import os
import time
import sqlite3
import threading
import logging
from contextlib import contextmanager

from .dispatch_email import send_email_alert
from dotenv import load_dotenv
load_dotenv()

log = logging.getLogger("alerts.worker")
log.setLevel(os.getenv("LOG_LEVEL", "INFO"))


HERE = os.path.abspath(os.path.dirname(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, ".."))
DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(BACKEND_ROOT, DB_NAME)
log.info("[alert-worker] DB_PATH=%s", DB_PATH)

POLL_SECONDS = float(os.getenv("ALERT_POLL_SECONDS", "1.0"))
CLAIM_TTL_SECONDS = int(os.getenv("ALERT_CLAIM_TTL_SECONDS", "60"))


@contextmanager
def _db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        yield conn
    finally:
        conn.close()


def _claim_one(conn: sqlite3.Connection) -> sqlite3.Row | None:
    """
    Atomically claim one queue row by marking in_progress=1.
    """
    cur = conn.cursor()
    cur.execute("BEGIN IMMEDIATE")

    row = cur.execute(
        """
        SELECT id, email, dev_eui, alert_type, message
        FROM alert_queue
        WHERE processed = 0 AND in_progress = 0
        ORDER BY created_at ASC
        LIMIT 1
        """
    ).fetchone()

    if not row:
        conn.commit()
        return None

    ts = int(time.time())
    cur.execute(
        """
        UPDATE alert_queue
        SET in_progress = 1,
            in_progress_at = ?
        WHERE id = ?
          AND processed = 0
          AND in_progress = 0
        """,
        (ts, row["id"]),
    )

    if cur.rowcount == 0:
        conn.commit()
        return None

    conn.commit()
    return row


def _release_stale_claims(conn: sqlite3.Connection) -> int:
    """
    Release rows stuck in_progress longer than CLAIM_TTL_SECONDS.
    """
    cutoff = int(time.time()) - int(CLAIM_TTL_SECONDS)

    cur = conn.execute(
        """
        UPDATE alert_queue
        SET in_progress = 0,
            in_progress_at = NULL
        WHERE processed = 0
          AND in_progress = 1
          AND in_progress_at IS NOT NULL
          AND in_progress_at < ?
        """,
        (cutoff,),
    )

    conn.commit()
    return cur.rowcount


def worker_loop(worker_id: int) -> None:
    while True:
        try:
            with _db() as conn:
                _release_stale_claims(conn)
                row = _claim_one(conn)

            if row:
                log.info("[worker %s] claimed queue_id=%s", worker_id, row["id"])

            if not row:
                time.sleep(POLL_SECONDS)
                continue

            try:
                # Send email
                send_email_alert(
                    row["email"],
                    row["message"],
                    dev_eui=row["dev_eui"],
                    alert_type=row["alert_type"],
                )

                # Mark processed only after successful send
                with _db() as conn:
                    conn.execute(
                        """
                        UPDATE alert_queue
                        SET processed = 1,
                            processed_at = ?,
                            in_progress = 0,
                            in_progress_at = NULL
                        WHERE id = ?
                        """,
                        (int(time.time()), row["id"]),
                    )
                    conn.commit()

            except Exception as e:
                log.exception(
                    "[worker %s] send failed queue_id=%s",
                    worker_id,
                    row["id"],
                )
                with _db() as conn:
                    _insert_system_alert(
                        conn,
                        "EMAIL_SEND_FAILED",
                        f"queue_id={row['id']} email={row['email']} error={e}",
                    )
                    conn.execute(
                        """
                        UPDATE alert_queue
                        SET in_progress = 0,
                            in_progress_at = NULL
                        WHERE id = ? AND processed = 0
                        """,
                        (row["id"],),
                    )
                    conn.commit()

        except Exception:
            log.exception(
                "[worker %s] unexpected error in worker_loop iteration",
                worker_id,
            )
            time.sleep(max(POLL_SECONDS, 5.0))


def start_workers() -> None:
    n = int(os.getenv("ALERT_WORKERS", "1"))
    if n < 1:
        n = 1

    log.info("starting %s worker(s)", n)

    for i in range(n):
        t = threading.Thread(target=worker_loop, args=(i,), daemon=True)
        t.start()


def _insert_system_alert(
    conn: sqlite3.Connection,
    alert_type: str,
    message: str,
) -> None:
    ts = int(time.time())
    conn.execute(
        """
        INSERT INTO alerts (dev_eui, alert_type, message, created_at, acknowledged)
        VALUES ('SYSTEM', ?, ?, ?, 0)
        """,
        (alert_type, message, ts),
    )
    conn.commit()
