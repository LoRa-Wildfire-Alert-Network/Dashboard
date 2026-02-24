import os
import time
import sqlite3

from .cooldown import can_send
from .dispatch_email import send_email_alert

TEMP_C_THRESHOLD = 70.0

HERE = os.path.abspath(os.path.dirname(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, ".."))
DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(BACKEND_ROOT, DB_NAME)


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _insert_alert(
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


def process_row_for_alerts(row: dict) -> None:
    dev_eui = row.get("device_eui")
    if not dev_eui:
        return

    node_id = row.get("node_id")  # ok to include in message, but not used for dedupe
    temp_c = row.get("temperature_c")
    smoke = row.get("smoke_detected")

    fire_risk = (smoke == 1) or (temp_c is not None and temp_c > TEMP_C_THRESHOLD)
    if not fire_risk:
        return

    alert_type = "FIRE_RISK"
    now_ts = int(time.time())

    msg = (
        "FIRE RISK DETECTED\n"
        f"Device EUI: {dev_eui}\n"
        f"Session Addr: {node_id}\n"
        f"Temp(C): {temp_c}\n"
        f"Smoke: {smoke}\n"
    )

    # Store alert event in DB (and use DB-backed cooldown dedupe)
    with _db() as conn:
        if not can_send(conn, dev_eui, alert_type):
            return
        _insert_alert(conn, dev_eui, alert_type, msg, now_ts)

    # Keep PoC email behavior for now
    send_email_alert(msg)
