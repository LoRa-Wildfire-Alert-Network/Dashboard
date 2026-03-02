import os
import time
import sqlite3

from .cooldown import can_send

TEMP_C_THRESHOLD = 70.0  # keep for now; prefs can override
PREF_COOLDOWN_SECONDS = int(os.getenv("ALERT_PREF_COOLDOWN_SECONDS", "300"))


HERE = os.path.abspath(os.path.dirname(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, ".."))
DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(BACKEND_ROOT, DB_NAME)


class AlertService:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _db(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _insert_alert(
        self,
        conn: sqlite3.Connection,
        dev_eui: str,
        alert_type: str,
        message: str,
        now_ts: int,
    ) -> int:
        cur = conn.execute(
            """
            INSERT INTO alerts (dev_eui, alert_type, message, created_at, acknowledged)
            VALUES (?, ?, ?, ?, 0)
            """,
            (dev_eui, alert_type, message, int(now_ts)),
        )
        conn.commit()
        alert_id = cur.lastrowid
        if alert_id is None:
            raise RuntimeError("Failed to insert alert row")
        return alert_id

    def _enqueue_matching_users(
        self,
        conn: sqlite3.Connection,
        dev_eui: str,
        temp_c: float | None,
        battery_level: float | None,
        smoke: int | None,
        message: str,
        now_ts: int,
    ) -> int:
        """
        Create alert_queue rows for each matching preference.
        Store email directly on queue row.
        Returns number of rows inserted.
        """
        # Evaluate prefs (enabled) for this dev_eui
        # Match if any criteria set AND triggered by telemetry
        q = """
            SELECT
              ap.id AS pref_id,
              u.email AS email,
              ap.temp_over_c,
              ap.battery_below_pct,
              ap.smoke_detected,
              ap.last_sent_at
            FROM alert_preferences ap
            JOIN users u
              ON u.auth_sub = ap.user_id
            WHERE ap.enabled = 1
              AND ap.dev_eui = ?
              AND u.email IS NOT NULL
              AND (
                (ap.smoke_detected = 1 AND ? = 1)
                OR (ap.temp_over_c IS NOT NULL AND ? IS NOT NULL AND ? > ap.temp_over_c)
                OR (
                    ap.battery_below_pct IS NOT NULL
                    AND ? IS NOT NULL
                    AND ? < ap.battery_below_pct
                )
              )
              AND (
                ap.last_sent_at IS NULL
                OR (? - ap.last_sent_at) >= ?
              )
        """
        rows = conn.execute(
            q,
            (
                dev_eui,
                smoke if smoke is not None else 0,
                temp_c,
                temp_c,
                battery_level,
                battery_level,
                int(now_ts),
                int(PREF_COOLDOWN_SECONDS),
            ),
        ).fetchall()

        inserted = 0
        for r in rows:
            conn.execute(
                """
                INSERT INTO alert_queue (
                  email, dev_eui, alert_type, message, created_at,
                  processed, processed_at
                )
                VALUES (?, ?, ?, ?, ?, 0, NULL)
                """,
                (r["email"], dev_eui, "FIRE_RISK", message, int(now_ts)),
            )
            conn.execute(
                """
                UPDATE alert_preferences
                SET last_sent_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (int(now_ts), int(now_ts), r["pref_id"]),
            )
            inserted += 1

        conn.commit()
        return inserted

    def process_row(self, row: dict) -> None:
        dev_eui = row.get("device_eui")
        if not dev_eui:
            return

        node_id = row.get("node_id")
        temp_c = row.get("temperature_c")
        smoke = row.get("smoke_detected")
        battery_level = row.get("battery_level")

        alert_type = "FIRE_RISK"
        now_ts = int(time.time())

        msg = (
            "ALERT TRIGGERED\n"
            f"Device EUI: {dev_eui}\n"
            f"Session Addr: {node_id}\n"
            f"Temp(C): {temp_c}\n"
            f"Battery: {battery_level}\n"
            f"Smoke: {smoke}\n"
        )

        with self._db() as conn:
            # 1) Check if THIS telemetry matches ANY enabled preference for this node
            match_count_row = conn.execute(
                """
                SELECT COUNT(1) AS n
                FROM alert_preferences ap
                JOIN users u ON u.auth_sub = ap.user_id
                WHERE ap.enabled = 1
                  AND ap.dev_eui = ?
                  AND u.email IS NOT NULL
                  AND (
                    (ap.smoke_detected = 1 AND ? = 1)
                    OR (
                        ap.temp_over_c IS NOT NULL
                        AND ? IS NOT NULL
                        AND ? > ap.temp_over_c
                    )
                    OR (
                        ap.battery_below_pct IS NOT NULL
                        AND ? IS NOT NULL
                        AND ? < ap.battery_below_pct
                    )
                  )
                """,
                (
                    dev_eui,
                    smoke if smoke is not None else 0,
                    temp_c,
                    temp_c,
                    battery_level,
                    battery_level,
                ),
            ).fetchone()
            pref_triggered = (match_count_row["n"] if match_count_row else 0) > 0

            # 2) Keep the existing coarse fallback detection (optional safety net)
            fire_risk = (
                smoke == 1
                or (
                    temp_c is not None
                    and temp_c > TEMP_C_THRESHOLD
                )
            )

            # If neither prefs nor fallback triggers, do nothing
            if not pref_triggered and not fire_risk:
                return

            # Global dedupe (server-controlled -> ALERT_COOLDOWN_SECONDS in cooldown.py)
            if not can_send(conn, dev_eui, alert_type):
                return

            # Requirement order: store alert event first, then enqueue
            self._insert_alert(conn, dev_eui, alert_type, msg, now_ts)

            self._enqueue_matching_users(
                conn,
                dev_eui,
                temp_c,
                battery_level,
                smoke,
                msg,
                now_ts,
            )


_service = AlertService(DB_PATH)


def process_row_for_alerts(row: dict) -> None:
    _service.process_row(row)
