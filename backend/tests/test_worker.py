import sqlite3
import threading
import time
import pytest
from unittest.mock import patch, MagicMock, call

import alerts.worker as worker_module
from alerts.worker import (
    _claim_one,
    _release_stale_claims,
    _insert_system_alert,
    start_workers,
    worker_loop,
)

def _open_conn(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _insert_queue_row(conn, email="u@example.com", dev_eui="AABBCCDD00000001",
                      alert_type="FIRE_RISK", message="test alert",
                      created_at=None, processed=0, in_progress=0,
                      in_progress_at=None):
    ts = created_at or int(time.time())
    cur = conn.execute(
        """
        INSERT INTO alert_queue
          (email, dev_eui, alert_type, message, created_at,
           in_progress, in_progress_at, processed, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        """,
        (email, dev_eui, alert_type, message, ts,
         in_progress, in_progress_at, processed),
    )
    conn.commit()
    return cur.lastrowid


class TestClaimOne:

    def test_empty_queue_returns_none(self, file_db):
        """No rows in queue → None."""
        with _open_conn(file_db) as conn:
            result = _claim_one(conn)
        assert result is None

    def test_row_exists_is_claimed_and_returned(self, file_db):
        conn = _open_conn(file_db)
        row_id = _insert_queue_row(conn)
        conn.close()

        with _open_conn(file_db) as conn:
            result = _claim_one(conn)

        assert result is not None
        assert result["id"] == row_id
        assert result["dev_eui"] == "AABBCCDD00000001"

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT in_progress FROM alert_queue WHERE id=?", (row_id,)
            ).fetchone()
        assert row["in_progress"] == 1

    def test_already_processed_row_not_claimed(self, file_db):
        conn = _open_conn(file_db)
        _insert_queue_row(conn, processed=1)
        conn.close()

        with _open_conn(file_db) as conn:
            result = _claim_one(conn)
        assert result is None

    def test_already_in_progress_row_not_claimed(self, file_db):
        conn = _open_conn(file_db)
        _insert_queue_row(conn, in_progress=1, in_progress_at=int(time.time()))
        conn.close()

        with _open_conn(file_db) as conn:
            result = _claim_one(conn)
        assert result is None

    def test_returns_oldest_row_first(self, file_db):
        now = int(time.time())
        conn = _open_conn(file_db)
        id_old = _insert_queue_row(conn, created_at=now - 100, message="old")
        id_new = _insert_queue_row(conn, created_at=now, message="new")
        conn.close()

        with _open_conn(file_db) as conn:
            result = _claim_one(conn)
        assert result["id"] == id_old

    def test_claimed_row_fields_present(self, file_db):
        conn = _open_conn(file_db)
        _insert_queue_row(conn, email="fire@test.com", message="big fire")
        conn.close()

        with _open_conn(file_db) as conn:
            result = _claim_one(conn)

        assert result["email"] == "fire@test.com"
        assert result["message"] == "big fire"
        assert result["alert_type"] == "FIRE_RISK"


class TestReleaseStaleСlaims:

    def test_no_stale_rows_returns_zero(self, file_db):
        with _open_conn(file_db) as conn:
            count = _release_stale_claims(conn)
        assert count == 0

    def test_stale_row_is_released(self, file_db):
        old_ts = int(time.time()) - 300
        conn = _open_conn(file_db)
        row_id = _insert_queue_row(conn, in_progress=1, in_progress_at=old_ts)
        conn.close()

        with _open_conn(file_db) as conn:
            count = _release_stale_claims(conn)

        assert count == 1

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT in_progress, in_progress_at FROM alert_queue WHERE id=?",
                (row_id,)
            ).fetchone()
        assert row["in_progress"] == 0
        assert row["in_progress_at"] is None

    def test_fresh_in_progress_row_not_released(self, file_db):
        fresh_ts = int(time.time())
        conn = _open_conn(file_db)
        _insert_queue_row(conn, in_progress=1, in_progress_at=fresh_ts)
        conn.close()

        with _open_conn(file_db) as conn:
            count = _release_stale_claims(conn)
        assert count == 0

    def test_already_processed_row_not_released(self, file_db):
        old_ts = int(time.time()) - 999
        conn = _open_conn(file_db)
        _insert_queue_row(conn, processed=1, in_progress=1, in_progress_at=old_ts)
        conn.close()

        with _open_conn(file_db) as conn:
            count = _release_stale_claims(conn)
        assert count == 0

    def test_multiple_stale_rows_all_released(self, file_db):
        old_ts = int(time.time()) - 300
        conn = _open_conn(file_db)
        _insert_queue_row(conn, in_progress=1, in_progress_at=old_ts)
        _insert_queue_row(conn, in_progress=1, in_progress_at=old_ts)
        conn.close()

        with _open_conn(file_db) as conn:
            count = _release_stale_claims(conn)
        assert count == 2


def _seed_system_node(db_path: str) -> None:
    conn = _open_conn(db_path)
    conn.execute("PRAGMA foreign_keys = OFF;")
    conn.execute(
        "INSERT OR IGNORE INTO nodes (device_eui, node_id, last_seen, gateway_id) "
        "VALUES ('SYSTEM', NULL, NULL, NULL)"
    )
    conn.commit()
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.close()


class TestInsertSystemAlert:

    def test_inserts_row_with_system_dev_eui(self, file_db):
        _seed_system_node(file_db)
        with _open_conn(file_db) as conn:
            _insert_system_alert(conn, "EMAIL_SEND_FAILED", "something went wrong")

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT * FROM alerts WHERE dev_eui='SYSTEM' ORDER BY id DESC LIMIT 1"
            ).fetchone()

        assert row is not None
        assert row["dev_eui"] == "SYSTEM"
        assert row["alert_type"] == "EMAIL_SEND_FAILED"
        assert row["message"] == "something went wrong"
        assert row["acknowledged"] == 0

    def test_created_at_is_recent(self, file_db):
        _seed_system_node(file_db)
        before = int(time.time())
        with _open_conn(file_db) as conn:
            _insert_system_alert(conn, "TEST_TYPE", "msg")
        after = int(time.time())

        with _open_conn(file_db) as conn:
            row = conn.execute(
                "SELECT created_at FROM alerts WHERE dev_eui='SYSTEM'"
            ).fetchone()

        assert before <= row["created_at"] <= after

    def test_multiple_system_alerts_all_stored(self, file_db):
        _seed_system_node(file_db)
        with _open_conn(file_db) as conn:
            _insert_system_alert(conn, "A", "msg1")
        with _open_conn(file_db) as conn:
            _insert_system_alert(conn, "B", "msg2")

        with _open_conn(file_db) as conn:
            count = conn.execute(
                "SELECT COUNT(*) AS n FROM alerts WHERE dev_eui='SYSTEM'"
            ).fetchone()["n"]
        assert count == 2


class TestStartWorkers:

    def test_starts_one_worker_by_default(self):
        with patch.dict("os.environ", {"ALERT_WORKERS": "1"}), \
                patch("alerts.worker.threading.Thread") as MockThread:
            mock_t = MagicMock()
            MockThread.return_value = mock_t
            start_workers()

        MockThread.assert_called_once_with(
            target=worker_loop, args=(0,), daemon=True
        )
        mock_t.start.assert_called_once()

    def test_starts_three_workers(self):
        with patch.dict("os.environ", {"ALERT_WORKERS": "3"}), \
                patch("alerts.worker.threading.Thread") as MockThread:
            mock_t = MagicMock()
            MockThread.return_value = mock_t
            start_workers()

        assert MockThread.call_count == 3
        calls = MockThread.call_args_list
        for i in range(3):
            assert calls[i] == call(target=worker_loop, args=(i,), daemon=True)
        assert mock_t.start.call_count == 3

    def test_zero_workers_clamped_to_one(self):
        with patch.dict("os.environ", {"ALERT_WORKERS": "0"}), \
                patch("alerts.worker.threading.Thread") as MockThread:
            mock_t = MagicMock()
            MockThread.return_value = mock_t
            start_workers()

        assert MockThread.call_count == 1

    def test_negative_workers_clamped_to_one(self):
        with patch.dict("os.environ", {"ALERT_WORKERS": "-5"}), \
                patch("alerts.worker.threading.Thread") as MockThread:
            mock_t = MagicMock()
            MockThread.return_value = mock_t
            start_workers()

        assert MockThread.call_count == 1


class TestWorkerLoop:

    def _run_one_iteration_no_row(self, file_db):
        sleep_count = [0]

        def mock_sleep(s):
            sleep_count[0] += 1
            raise StopIteration("stop")

        from contextlib import contextmanager

        @contextmanager
        def patched_db():
            conn = _open_conn(file_db)
            try:
                yield conn
            finally:
                conn.close()

        with patch.object(worker_module, "_db", patched_db), \
                patch("alerts.worker.time.sleep", side_effect=mock_sleep):
            try:
                worker_loop(99)
            except StopIteration:
                pass

        return sleep_count[0]

    def test_no_row_calls_sleep(self, file_db):
        count = self._run_one_iteration_no_row(file_db)
        assert count >= 1

    def test_successful_send_marks_processed(self, file_db):
        conn = _open_conn(file_db)
        row_id = _insert_queue_row(conn, email="u@x.com", message="fire")
        conn.close()

        from contextlib import contextmanager

        @contextmanager
        def patched_db():
            c = _open_conn(file_db)
            try:
                yield c
            finally:
                c.close()

        sleep_calls = [0]

        def mock_sleep(s):
            sleep_calls[0] += 1
            raise StopIteration("stop after sleep")

        with patch.object(worker_module, "_db", patched_db), \
                patch("alerts.worker.send_email_alert", return_value=None), \
                patch("alerts.worker.time.sleep", side_effect=mock_sleep):
            try:
                worker_loop(0)
            except StopIteration:
                pass

        with _open_conn(file_db) as c:
            row = c.execute(
                "SELECT processed, in_progress FROM alert_queue WHERE id=?",
                (row_id,)
            ).fetchone()

        assert row["processed"] == 1
        assert row["in_progress"] == 0

    def test_failed_send_inserts_system_alert_and_releases_row(self, file_db):
        _seed_system_node(file_db)

        conn = _open_conn(file_db)
        row_id = _insert_queue_row(conn, email="u@x.com", message="fire")
        conn.close()

        from contextlib import contextmanager

        class _BreakLoop(BaseException):
            pass

        claim_calls = [0]
        real_claim = worker_module._claim_one

        def controlled_claim(c):
            claim_calls[0] += 1
            if claim_calls[0] == 1:
                return real_claim(c)
            raise _BreakLoop("stop")

        @contextmanager
        def patched_db():
            c = _open_conn(file_db)
            try:
                yield c
            finally:
                c.close()

        with patch.object(worker_module, "_db", patched_db), \
                patch.object(worker_module, "_claim_one", side_effect=controlled_claim), \
                patch("alerts.worker.send_email_alert",
                      side_effect=RuntimeError("smtp down")), \
                patch("alerts.worker.time.sleep", return_value=None):
            try:
                worker_loop(0)
            except _BreakLoop:
                pass

        with _open_conn(file_db) as c:
            queue_row = c.execute(
                "SELECT processed, in_progress FROM alert_queue WHERE id=?",
                (row_id,)
            ).fetchone()
            system_alert = c.execute(
                "SELECT * FROM alerts WHERE dev_eui='SYSTEM'"
            ).fetchone()

        assert queue_row["processed"] == 0
        assert queue_row["in_progress"] == 0
        assert system_alert is not None
        assert system_alert["alert_type"] == "EMAIL_SEND_FAILED"
