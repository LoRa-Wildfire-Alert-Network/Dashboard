import sqlite3
import time
import pytest
from unittest.mock import patch

from alerts.engine import AlertService, process_row_for_alerts, _service

DEV_EUI = "AABBCCDD00000001"
ALERT_TYPE = "FIRE_RISK"


def _open_conn(db_path):
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _insert_alert_pref(conn, user_id, dev_eui, enabled=1,
                       temp_over_c=None, battery_below_pct=None,
                       smoke_detected=None, last_sent_at=None):
    ts = 1_000_000
    conn.execute(
        """
        INSERT OR IGNORE INTO alert_preferences
          (user_id, dev_eui, enabled, temp_over_c, battery_below_pct,
           smoke_detected, last_sent_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, dev_eui, enabled, temp_over_c, battery_below_pct,
         smoke_detected, last_sent_at, ts, ts),
    )
    conn.commit()


def _count_alerts(conn, dev_eui):
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM alerts WHERE dev_eui = ?", (dev_eui,)
    ).fetchone()
    return row["n"]


def _count_queue(conn, dev_eui):
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM alert_queue WHERE dev_eui = ?", (dev_eui,)
    ).fetchone()
    return row["n"]


class TestInsertAlert:

    def test_returns_positive_alert_id(self, file_db):
        svc = AlertService(file_db)
        with svc._db() as conn:
            conn.execute("BEGIN")
            alert_id = svc._insert_alert(
                conn, DEV_EUI, ALERT_TYPE, "test msg", 1_000_000)
            conn.commit()
        assert isinstance(alert_id, int)
        assert alert_id > 0

    def test_row_persisted_with_correct_fields(self, file_db):
        svc = AlertService(file_db)
        now_ts = 1_000_500
        with svc._db() as conn:
            conn.execute("BEGIN")
            svc._insert_alert(conn, DEV_EUI, ALERT_TYPE, "alert body", now_ts)
            conn.commit()

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT * FROM alerts WHERE dev_eui = ? ORDER BY id DESC LIMIT 1",
                (DEV_EUI,),
            ).fetchone()

        assert row["dev_eui"] == DEV_EUI
        assert row["alert_type"] == ALERT_TYPE
        assert row["message"] == "alert body"
        assert row["created_at"] == now_ts
        assert row["acknowledged"] == 0

    def test_multiple_inserts_get_different_ids(self, file_db):
        svc = AlertService(file_db)
        ids = []
        for i in range(2):
            with svc._db() as conn:
                conn.execute("BEGIN")
                aid = svc._insert_alert(
                    conn, DEV_EUI, ALERT_TYPE, f"msg {i}", 1_000_000 + i)
                conn.commit()
            ids.append(aid)
        assert ids[0] != ids[1]


class TestEnqueueMatchingUsers:

    def test_no_matching_prefs_returns_zero(self, file_db):
        svc = AlertService(file_db)
        with svc._db() as conn:
            count = svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=30.0, battery_level=80.0, smoke=0,
                message="test", now_ts=1_000_000,
            )
        assert count == 0

    def test_smoke_pref_triggered_returns_one(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        conn.close()

        svc = AlertService(file_db)
        with svc._db() as conn:
            count = svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=1,
                message="smoke msg", now_ts=1_000_000,
            )
            conn.commit()
        assert count == 1

    def test_smoke_pref_not_triggered_when_smoke_zero(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        conn.close()

        svc = AlertService(file_db)
        with svc._db() as conn:
            count = svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=0,
                message="no smoke", now_ts=1_000_000,
            )
        assert count == 0

    def test_queue_row_fields_correct(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        conn.close()

        now = 1_000_000
        svc = AlertService(file_db)
        with svc._db() as conn:
            svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=1,
                message="fire msg", now_ts=now,
            )
            conn.commit()

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT * FROM alert_queue ORDER BY id DESC LIMIT 1"
            ).fetchone()

        assert row["email"] == "test@example.com"
        assert row["dev_eui"] == DEV_EUI
        assert row["alert_type"] == "FIRE_RISK"
        assert row["message"] == "fire msg"
        assert row["created_at"] == now
        assert row["processed"] == 0

    def test_last_sent_at_updated(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1, last_sent_at=None)
        pref_id = conn.execute(
            """SELECT id FROM alert_preferences
            WHERE user_id='test_user_123' AND dev_eui=?""",
            (DEV_EUI,)
        ).fetchone()["id"]
        conn.close()

        now = 2_000_000
        svc = AlertService(file_db)
        with svc._db() as conn:
            svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=1,
                message="update pref", now_ts=now,
            )
            conn.commit()

        with _open_conn(file_db) as conn:
            pref = conn.execute(
                "SELECT last_sent_at FROM alert_preferences WHERE id=?",
                (pref_id,)
            ).fetchone()

        assert pref["last_sent_at"] == now

    def test_disabled_pref_not_triggered(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=0, smoke_detected=1)
        conn.close()

        svc = AlertService(file_db)
        with svc._db() as conn:
            count = svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=1,
                message="disabled", now_ts=1_000_000,
            )
        assert count == 0

    def test_cooldown_per_pref_respected(self, file_db):
        now = 2_000_000
        recent_last_sent = now - 10

        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1,
                           last_sent_at=recent_last_sent)
        conn.close()

        svc = AlertService(file_db)
        with svc._db() as conn:
            count = svc._enqueue_matching_users(
                conn, DEV_EUI,
                temp_c=25.0, battery_level=80.0, smoke=1,
                message="cooldown active", now_ts=now,
            )
        assert count == 0


class TestProcessRow:

    def test_no_device_eui_returns_early(self, file_db):
        svc = AlertService(file_db)
        svc.process_row({"temperature_c": 80.0, "smoke_detected": 1})

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 0

    def test_no_prefs_low_temp_no_smoke_returns_early(self, file_db):
        svc = AlertService(file_db)
        svc.process_row({
            "device_eui": DEV_EUI,
            "temperature_c": 20.0,
            "smoke_detected": 0,
            "battery_level": 80.0,
        })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 0

    def test_fire_risk_smoke_but_no_enabled_prefs_returns_early(self, file_db):
        svc = AlertService(file_db)
        svc.process_row({
            "device_eui": DEV_EUI,
            "temperature_c": 25.0,
            "smoke_detected": 1,
            "battery_level": 80.0,
        })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 0

    def test_fire_risk_high_temp_but_no_enabled_prefs_returns_early(self, file_db):
        svc = AlertService(file_db)
        svc.process_row({
            "device_eui": DEV_EUI,
            "temperature_c": 80.0,
            "smoke_detected": 0,
            "battery_level": 80.0,
        })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 0

    def test_pref_triggered_smoke_inserts_alert_and_queues_user(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        conn.close()

        svc = AlertService(file_db)
        svc.process_row({
            "device_eui": DEV_EUI,
            "temperature_c": 25.0,
            "smoke_detected": 1,
            "battery_level": 80.0,
        })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 1
            assert _count_queue(conn, DEV_EUI) == 1

    def test_cooldown_active_no_new_alert(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        now = int(time.time())
        conn.execute(
            """INSERT INTO alerts (dev_eui,
                alert_type, message, created_at, acknowledged)"""
            "VALUES (?, 'FIRE_RISK', 'old', ?, 0)",
            (DEV_EUI, now - 10),
        )
        conn.commit()
        conn.close()

        svc = AlertService(file_db)
        svc.process_row({
            "device_eui": DEV_EUI,
            "temperature_c": 25.0,
            "smoke_detected": 1,
            "battery_level": 80.0,
        })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 1

    def test_db_exception_during_insert_rolls_back(self, file_db):
        conn = _open_conn(file_db)
        _insert_alert_pref(conn, "test_user_123", DEV_EUI,
                           enabled=1, smoke_detected=1)
        conn.close()

        class BrokenAlertService(AlertService):
            def _insert_alert(self, conn, dev_eui, alert_type, message, now_ts):
                raise RuntimeError("simulated DB failure")

        svc = BrokenAlertService(file_db)
        with pytest.raises(RuntimeError, match="simulated DB failure"):
            svc.process_row({
                "device_eui": DEV_EUI,
                "temperature_c": 25.0,
                "smoke_detected": 1,
                "battery_level": 80.0,
            })

        with _open_conn(file_db) as conn:
            assert _count_alerts(conn, DEV_EUI) == 0
            assert _count_queue(conn, DEV_EUI) == 0


class TestProcessRowForAlerts:

    def test_delegates_to_service_process_row(self):
        with patch.object(_service, "process_row") as mock_process:
            row = {"device_eui": DEV_EUI, "smoke_detected": 0}
            process_row_for_alerts(row)
        mock_process.assert_called_once_with(row)

    def test_passes_row_unchanged(self):
        row = {"device_eui": "ABCDEF", "temperature_c": 99.0}
        with patch.object(_service, "process_row") as mock_process:
            process_row_for_alerts(row)
        assert mock_process.call_args[0][0] is row
