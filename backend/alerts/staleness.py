import os
import time
import sqlite3
import threading
import logging
import datetime
from contextlib import contextmanager

from .cooldown import can_send

log = logging.getLogger("alerts.staleness")
log.setLevel(os.getenv("LOG_LEVEL", "INFO"))

HERE = os.path.abspath(os.path.dirname(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, ".."))
DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(BACKEND_ROOT, DB_NAME)

OFFLINE_THRESHOLD_SECONDS = int(
    os.getenv("NODE_OFFLINE_THRESHOLD_SECONDS", "1800")
)  # 30 min
STALENESS_POLL_SECONDS = float(os.getenv("NODE_STALENESS_POLL_SECONDS", "60"))
PREF_COOLDOWN_SECONDS = int(os.getenv("STALENESS_ALERT_PREF_COOLDOWN_SECONDS", "86400"))


@contextmanager
def _db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        yield conn
    finally:
        conn.close()


def _check_offline_nodes(conn: sqlite3.Connection) -> int:
    """
    Fire NODE_OFFLINE alerts for nodes that haven't reported within the threshold
    and have at least one user with an enabled alert preference.
    Returns the number of alerts fired.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(
        seconds=OFFLINE_THRESHOLD_SECONDS
    )
    cutoff_iso = cutoff.isoformat()
    now_ts = int(time.time())

    stale = conn.execute(
        """
        SELECT DISTINCT n.device_eui, n.node_id, n.last_seen
        FROM nodes n
        JOIN alert_preferences ap ON ap.dev_eui = n.device_eui
        JOIN users u ON u.auth_sub = ap.user_id
        WHERE ap.enabled = 1
          AND u.email IS NOT NULL
          AND n.last_seen IS NOT NULL
          AND n.last_seen < ?
        """,
        (cutoff_iso,),
    ).fetchall()

    fired = 0
    for node in stale:
        dev_eui = node["device_eui"]
        alert_type = "NODE_OFFLINE"

        if not can_send(conn, dev_eui, alert_type):
            continue

        msg = (
            "NODE OFFLINE\n"
            f"Device EUI: {dev_eui}\n"
            f"Session Addr: {node['node_id']}\n"
            f"Last Seen: {node['last_seen']}\n"
        )

        try:
            conn.execute(
                """
                INSERT INTO alerts (dev_eui, alert_type,
                    message, created_at, acknowledged)
                VALUES (?, ?, ?, ?, 0)
                """,
                (dev_eui, alert_type, msg, now_ts),
            )

            subscribers = conn.execute(
                """
                SELECT DISTINCT u.email, ap.id AS pref_id
                FROM alert_preferences ap
                JOIN users u ON u.auth_sub = ap.user_id
                WHERE ap.enabled = 1
                  AND ap.dev_eui = ?
                  AND u.email IS NOT NULL
                  AND (ap.last_sent_at IS NULL OR (? - ap.last_sent_at) >= ?)
                """,
                (dev_eui, now_ts, PREF_COOLDOWN_SECONDS),
            ).fetchall()

            for sub in subscribers:
                conn.execute(
                    """
                    INSERT INTO alert_queue (
                      email, dev_eui, alert_type, message, created_at,
                      processed, processed_at
                    )
                    VALUES (?, ?, ?, ?, ?, 0, NULL)
                    """,
                    (sub["email"], dev_eui, alert_type, msg, now_ts),
                )

                conn.execute(
                    """
                    UPDATE alert_preferences
                    SET last_sent_at = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (now_ts, now_ts, sub["pref_id"]),
                )

            conn.commit()
            fired += 1
            log.info(
                "[staleness] Fired NODE_OFFLINE alert for dev_eui=%s, last_seen=%s",
                dev_eui,
                node["last_seen"],
            )

        except Exception:
            conn.rollback()
            log.exception(
                "[staleness] error firing NODE_OFFLINE alert for dev_eui=%s",
                dev_eui,
            )

    return fired


def staleness_loop() -> None:
    log.info(
        "[staleness] checker started (threshold=%ss, poll=%ss)",
        OFFLINE_THRESHOLD_SECONDS,
        STALENESS_POLL_SECONDS,
    )

    while True:
        try:
            with _db() as conn:
                fired = _check_offline_nodes(conn)
                if fired:
                    log.info("[staleness] fired %s NODE_OFFLINE alert(s)", fired)
        except Exception:
            log.exception("[staleness] unexpected error in staleness_loop")
        time.sleep(STALENESS_POLL_SECONDS)


def start_staleness_checker() -> None:
    t = threading.Thread(target=staleness_loop, daemon=True, name="staleness-checker")
    t.start()
