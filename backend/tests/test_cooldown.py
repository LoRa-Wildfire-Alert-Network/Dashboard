import time
from alerts.cooldown import is_duplicate_within_cooldown, can_send, COOLDOWN_SECONDS

DEV_EUI = "AABBCCDD00000001"
ALERT_TYPE = "FIRE_RISK"
OTHER_ALERT_TYPE = "BATTERY_LOW"


def _insert_alert(conn, dev_eui, alert_type, created_at):
    conn.execute(
        "INSERT INTO alerts (dev_eui, alert_type, message, created_at, acknowledged) "
        "VALUES (?, ?, 'test', ?, 0)",
        (dev_eui, alert_type, created_at),
    )
    conn.commit()


class TestIsDuplicateWithinCooldown:

    def test_no_alert_rows_returns_false(self, db_conn):
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=1_000_000, cooldown_seconds=300
        )
        assert result is False

    def test_alert_within_window_returns_true(self, db_conn):
        now = 1_000_000
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - 10)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=300
        )
        assert result is True

    def test_alert_exactly_at_window_start_returns_true(self, db_conn):
        now = 1_000_000
        cooldown = 300
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - cooldown)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=cooldown
        )
        assert result is True

    def test_alert_outside_window_returns_false(self, db_conn):
        now = 1_000_000
        cooldown = 300
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - cooldown - 1)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=cooldown
        )
        assert result is False

    def test_different_alert_type_returns_false(self, db_conn):
        now = 1_000_000
        _insert_alert(db_conn, DEV_EUI, OTHER_ALERT_TYPE, created_at=now - 10)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=300
        )
        assert result is False

    def test_now_ts_none_uses_current_time(self, db_conn):
        recent_ts = int(time.time()) - 5
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=recent_ts)
        result = is_duplicate_within_cooldown(db_conn, DEV_EUI, ALERT_TYPE)
        assert result is True

    def test_cooldown_seconds_none_uses_module_constant(self, db_conn):
        recent_ts = int(time.time()) - 1
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=recent_ts)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=int(time.time())
        )
        assert result is True

    def test_both_defaults_used_together(self, db_conn):
        recent_ts = int(time.time()) - 2
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=recent_ts)
        result = is_duplicate_within_cooldown(db_conn, DEV_EUI, ALERT_TYPE)
        assert result is True

    def test_zero_cooldown_means_no_dedup(self, db_conn):
        now = 1_000_000
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - 1)
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=0
        )
        assert result is False

    def test_multiple_alerts_one_in_window(self, db_conn):
        now = 1_000_000
        cooldown = 300
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - 400)  # outside
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - 100)  # inside
        result = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=cooldown
        )
        assert result is True


class TestCanSend:

    def test_can_send_true_when_no_recent_alert(self, db_conn):
        result = can_send(db_conn, DEV_EUI, ALERT_TYPE)
        assert result is True

    def test_can_send_false_when_recent_alert_exists(self, db_conn):
        recent_ts = int(time.time()) - 10
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=recent_ts)
        result = can_send(db_conn, DEV_EUI, ALERT_TYPE)
        assert result is False

    def test_can_send_true_after_cooldown_expires(self, db_conn):
        old_ts = int(time.time()) - COOLDOWN_SECONDS - 60
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=old_ts)
        result = can_send(db_conn, DEV_EUI, ALERT_TYPE)
        assert result is True

    def test_can_send_true_for_different_dev_eui(self, db_conn):
        """Alert for a different dev_eui doesn't block another dev_eui."""
        recent_ts = int(time.time()) - 10
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=recent_ts)
        result = can_send(db_conn, "AABBCCDD00000002", ALERT_TYPE)
        assert result is True

    def test_can_send_inverts_is_duplicate(self, db_conn):
        """can_send is exactly the inverse of is_duplicate_within_cooldown."""
        now = 1_000_000
        assert can_send(db_conn, DEV_EUI, ALERT_TYPE) is True
        _insert_alert(db_conn, DEV_EUI, ALERT_TYPE, created_at=now - 10)
        dup = is_duplicate_within_cooldown(
            db_conn, DEV_EUI, ALERT_TYPE, now_ts=now, cooldown_seconds=300
        )
        assert dup is True
