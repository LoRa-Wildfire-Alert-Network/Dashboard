import os
import time
import sqlite3

# Configurable by us (server env), not by users yet.
COOLDOWN_SECONDS = int(os.getenv("ALERT_COOLDOWN_SECONDS", "300"))


def is_duplicate_within_cooldown(
    conn: sqlite3.Connection,
    dev_eui: str,
    alert_type: str,
    now_ts: int | None = None,
    cooldown_seconds: int | None = None,
) -> bool:
    """DB-backed cooldown check so it persists across restarts."""
    if now_ts is None:
        now_ts = int(time.time())
    if cooldown_seconds is None:
        cooldown_seconds = COOLDOWN_SECONDS

    window_start = int(now_ts) - int(cooldown_seconds)
    row = conn.execute(
        """
        SELECT 1
        FROM alerts
        WHERE dev_eui = ?
          AND alert_type = ?
          AND created_at >= ?
        LIMIT 1
        """,
        (dev_eui, alert_type, window_start),
    ).fetchone()
    return row is not None


def can_send(conn: sqlite3.Connection, dev_eui: str, alert_type: str) -> bool:
    """True if we should send/store a new alert now (i.e., not a cooldown duplicate)."""
    return not is_duplicate_within_cooldown(conn, dev_eui, alert_type)
