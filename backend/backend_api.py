from pydantic import BaseModel
import os
import datetime as dt
from typing import Optional, List
import sqlite3
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from alerts.worker import start_workers
import uvicorn
import jwt as pyjwt
import logging


def _env_bool(name: str, default: str = "0") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


HERE = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(HERE, ".env"))

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("alerts")


class NodeIdRequest(BaseModel):
    device_eui: str


class AlertPreferenceCreate(BaseModel):
    dev_eui: str
    enabled: Optional[bool] = True
    temp_over_c: Optional[float] = None
    battery_below_pct: Optional[float] = None
    smoke_detected: Optional[bool] = None


class AlertPreferenceUpdate(BaseModel):
    dev_eui: Optional[str] = None
    enabled: Optional[bool] = None
    temp_over_c: Optional[float] = None
    battery_below_pct: Optional[float] = None
    smoke_detected: Optional[bool] = None


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
CLERK_JWT_ISSUER = os.getenv(
    "CLERK_JWT_ISSUER",
    "https://growing-midge-79.clerk.accounts.dev"
)
with open(os.path.join(HERE, "clerk_public_key.pem")) as f:
    CLERK_JWT_PUBLIC_KEY = f.read()

bearer_scheme = HTTPBearer()
app = FastAPI(title="LoRa Wildfire Backend API")


@app.on_event("startup")
def _startup():
    # Only start workers when explicitly enabled
    if not _env_bool("ALERTS_ENABLE_WORKERS", "0"):
        log.info("Alert workers disabled (set ALERTS_ENABLE_WORKERS=1 to enable).")
        return

    try:
        start_workers()
        log.info("Alert workers started.")
    except Exception:
        # log exception with traceback; no stdout prints
        log.exception("Failed to start alert workers")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")]
    if ALLOWED_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(HERE, DB_NAME)


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def parse_iso(ts: Optional[str]) -> Optional[dt.datetime]:
    if not ts:
        return None
    ts = ts.replace("Z", "+00:00")
    return dt.datetime.fromisoformat(ts)


def now_ts() -> int:
    return int(dt.datetime.now(dt.UTC).timestamp())


def ensure_user_row(user_id: str, email: str) -> None:
    ts = now_ts()
    with db() as conn:
        conn.execute(
            """
            INSERT INTO users (auth_sub, email, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(auth_sub) DO UPDATE SET
              email = excluded.email
            """,
            (user_id, email, ts),
        )
        conn.commit()


def _decode_clerk_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        return pyjwt.decode(
            token,
            CLERK_JWT_PUBLIC_KEY,
            algorithms=["RS256"],
            audience=None,
            issuer=CLERK_JWT_ISSUER,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Clerk JWT")


def get_clerk_user(
    payload: dict = Depends(_decode_clerk_jwt),
) -> dict:
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id in Clerk token")

    email = (
        payload.get("email")
        or payload.get("email_address")
        or payload.get("primary_email_address")
    )

    if not email:
        with db() as conn:
            row = conn.execute(
                "SELECT email FROM users WHERE auth_sub = ?",
                (user_id,),
            ).fetchone()
        if row and row["email"]:
            email = row["email"]
        else:
            raise HTTPException(
                status_code=401,
                detail="No email in Clerk token and no user record in DB for this user",
            )

    ensure_user_row(user_id, email)
    return {"user_id": user_id, "email": email}


def get_clerk_org_id(
    payload: dict = Depends(_decode_clerk_jwt),
) -> str | None:
    """Returns the active Clerk organization id, or None for personal accounts."""
    return payload.get("org_id")

# -------------------------
#         ENDPOINTS
# -------------------------


@app.post("/subscriptions/subscribe")
def subscribe_node(
    body: NodeIdRequest,
    user=Depends(get_clerk_user)
):
    user_id = user["user_id"]
    device_eui = body.device_eui
    with db() as conn:
        node = conn.execute(
            "SELECT device_eui FROM nodes WHERE device_eui = ?",
            (device_eui,)
        ).fetchone()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        try:
            conn.execute(
                "INSERT INTO user_node_subscriptions "
                "(user_id, device_eui) VALUES (?, ?)",
                (user_id, device_eui)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Already subscribed")
    return {
        "message": f"Subscribed to {device_eui}"
    }


@app.post("/subscriptions/unsubscribe")
def unsubscribe_node(body: NodeIdRequest, user=Depends(get_clerk_user)):
    user_id = user["user_id"]
    device_eui = body.device_eui
    with db() as conn:
        conn.execute(
            "DELETE FROM user_node_subscriptions "
            "WHERE user_id = ? AND device_eui = ?",
            (user_id, device_eui)
        )
        conn.commit()
    return {
        "message": f"Unsubscribed from {device_eui}"
    }


@app.post("/alert-preferences", status_code=201)
def create_alert_preference(body: AlertPreferenceCreate, user=Depends(get_clerk_user)):
    user_id = user["user_id"]
    ts = now_ts()

    enabled = 1 if (body.enabled is None or body.enabled) else 0
    smoke = None if body.smoke_detected is None else (1 if body.smoke_detected else 0)

    with db() as conn:
        # verify node exists
        node = conn.execute(
            "SELECT device_eui FROM nodes WHERE device_eui = ?",
            (body.dev_eui,),
        ).fetchone()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        existing = conn.execute(
            "SELECT id FROM alert_preferences WHERE user_id = ? AND dev_eui = ?",
            (user_id, body.dev_eui),
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Preference already exists for this node",
            )

        conn.execute(
            """
            INSERT INTO alert_preferences (
              user_id, dev_eui, enabled,
              temp_over_c, battery_below_pct, smoke_detected,
              last_sent_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            (
                user_id,
                body.dev_eui,
                enabled,
                body.temp_over_c,
                body.battery_below_pct,
                smoke,
                ts,
                ts,
            ),
        )
        conn.commit()

        pref = conn.execute(
            """
            SELECT
              id, user_id, dev_eui, enabled,
              temp_over_c, battery_below_pct, smoke_detected,
              last_sent_at, created_at, updated_at
            FROM alert_preferences
            WHERE id = last_insert_rowid()
            """
        ).fetchone()

    return dict(pref)


@app.get("/alert-preferences")
def list_alert_preferences(user=Depends(get_clerk_user)):
    user_id = user["user_id"]

    q = """
        SELECT
          id,
          user_id,
          dev_eui,
          enabled,
          temp_over_c,
          battery_below_pct,
          smoke_detected,
          last_sent_at,
          created_at,
          updated_at
        FROM alert_preferences
        WHERE user_id = ?
        ORDER BY id DESC
    """
    with db() as conn:
        rows = conn.execute(q, (user_id,)).fetchall()
    return [dict(r) for r in rows]


@app.get("/subscriptions")
def get_user_subscriptions(user=Depends(get_clerk_user)):
    user_id = user["user_id"]
    with db() as conn:
        rows = conn.execute(
            "SELECT device_eui FROM user_node_subscriptions WHERE user_id = ?",
            (user_id,)
        ).fetchall()
    return [r[0] for r in rows]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/alerts")
def get_alerts(
    limit: int = Query(50, ge=1, le=200),
    dev_eui: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
):
    """
    Fetch recent alert events (newest first).
    Optional filters:
      - dev_eui
      - acknowledged (true/false)
      - limit (default 50)
    """
    clauses: List[str] = []
    params: List[object] = []

    if dev_eui:
        clauses.append("dev_eui = ?")
        params.append(dev_eui)

    if acknowledged is not None:
        clauses.append("acknowledged = ?")
        params.append(1 if acknowledged else 0)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    q = f"""
        SELECT
          id,
          dev_eui,
          alert_type,
          message,
          created_at,
          acknowledged,
          acknowledged_at
        FROM alerts
        {where}
        ORDER BY created_at DESC
        LIMIT ?
    """
    params.append(limit)

    with db() as conn:
        rows = conn.execute(q, tuple(params)).fetchall()

    return [dict(r) for r in rows]


@app.put("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int):
    """
    Mark an alert as acknowledged.
    """
    ts = now_ts()

    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE alerts
            SET acknowledged = 1,
                acknowledged_at = ?
            WHERE id = ?
            """,
            (ts, alert_id),
        )
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

    return {"status": "ok", "id": alert_id}


@app.put("/alert-preferences/{pref_id}")
def update_alert_preference(
    pref_id: int,
    body: AlertPreferenceUpdate,
    user=Depends(get_clerk_user),
):
    user_id = user["user_id"]
    ts = now_ts()

    with db() as conn:
        existing = conn.execute(
            "SELECT * FROM alert_preferences WHERE id = ?",
            (pref_id,),
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Preference not found")
        if existing["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Preference not found")

        # If dev_eui is changing, verify node exists
        if body.dev_eui is not None:
            node = conn.execute(
                "SELECT device_eui FROM nodes WHERE device_eui = ?",
                (body.dev_eui,),
            ).fetchone()
            if not node:
                raise HTTPException(status_code=404, detail="Node not found")

        smoke = None
        if body.smoke_detected is not None:
            smoke = 1 if body.smoke_detected else 0

        conn.execute(
            """
            UPDATE alert_preferences
            SET
              dev_eui = COALESCE(?, dev_eui),
              enabled = COALESCE(?, enabled),
              temp_over_c = COALESCE(?, temp_over_c),
              battery_below_pct = COALESCE(?, battery_below_pct),
              smoke_detected = COALESCE(?, smoke_detected),
              updated_at = ?
            WHERE id = ?
            """,
            (
                body.dev_eui,
                None if body.enabled is None else (1 if body.enabled else 0),
                body.temp_over_c,
                body.battery_below_pct,
                smoke,
                ts,
                pref_id,
            ),
        )
        conn.commit()

        updated = conn.execute(
            """
            SELECT
              id, user_id, dev_eui, enabled,
              temp_over_c, battery_below_pct, smoke_detected,
              last_sent_at, created_at, updated_at
            FROM alert_preferences
            WHERE id = ?
            """,
            (pref_id,),
        ).fetchone()

    return dict(updated)


@app.get("/nodes")
def list_nodes():
    """
    Returns: [{device_eui, node_id, last_seen}]
    """
    q = """
        SELECT device_eui, node_id, last_seen
        FROM nodes
        ORDER BY device_eui
    """
    with db() as conn:
        rows = conn.execute(q).fetchall()
    return [dict(r) for r in rows]


@app.get("/nodes/{device_eui}/latest")
def node_latest(device_eui: str):
    """
    Latest telemetry row for a device_eui.
    """
    q = """
        SELECT
          device_eui,
          gateway_id,
          timestamp,
          device_timestamp,
          latitude,
          longitude,
          altitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected,
          rssi,
          snr
        FROM telemetry
        WHERE device_eui = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """
    with db() as conn:
        row = conn.execute(q, (device_eui,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No telemetry for this device")
    return dict(row)


@app.get("/telemetry")
def get_telemetry(
    device_eui: Optional[str] = None,
    t_from: Optional[str] = Query(
        None,
        description="ISO8601; e.g. 2025-01-01T00:00:00Z"
    ),
    t_to: Optional[str] = Query(None, description="ISO8601; e.g. 2025-01-02T00:00:00Z"),
    limit: int = Query(500, ge=1, le=5000),
    newest_first: bool = True,
):
    """
    Returns telemetry rows. Filters:
      - device_eui: only that device’s data
      - t_from/t_to: time range on 'timestamp'
      - limit: row cap (default 500)
    """
    dt_from = parse_iso(t_from)
    dt_to = parse_iso(t_to)

    clauses: List[str] = []
    params: List[object] = []

    if device_eui:
        clauses.append("device_eui = ?")
        params.append(device_eui)
    if dt_from:
        clauses.append("timestamp >= ?")
        params.append(dt_from.isoformat())
    if dt_to:
        clauses.append("timestamp <= ?")
        params.append(dt_to.isoformat())

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    order = "DESC" if newest_first else "ASC"

    q = f"""
        SELECT
          device_eui,
          gateway_id,
          timestamp,
          device_timestamp,
          latitude,
          longitude,
          altitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected,
          rssi,
          snr
        FROM telemetry
        {where}
        ORDER BY timestamp {order}
        LIMIT ?
    """

    params.append(limit)

    with db() as conn:
        rows = conn.execute(q, tuple(params)).fetchall()
    return [dict(r) for r in rows]


@app.get("/latest")
def latest_all_nodes(user=Depends(get_clerk_user)):
    user_id = user["user_id"]
    with db() as conn:
        device_euis = conn.execute(
            "SELECT device_eui FROM user_node_subscriptions WHERE user_id = ?",
            (user_id,)
        ).fetchall()
        device_euis = [r[0] for r in device_euis]
        if not device_euis:
            return []
        placeholders = ",".join(["?"] * len(device_euis))
        q = f"""
            SELECT
              device_eui,
              gateway_id,
              timestamp,
              device_timestamp,
              latitude,
              longitude,
              altitude,
              temperature_c,
              humidity_pct,
              battery_level,
              smoke_detected,
              rssi,
              snr
            FROM latest_telemetry
            WHERE device_eui IN ({placeholders})
            ORDER BY device_eui
        """
        rows = conn.execute(q, tuple(device_euis)).fetchall()
    return [dict(r) for r in rows]


@app.get("/summary")
def summary_all_nodes():
    """
    Compact payload for map: latest row per device.
    """
    q = """
        SELECT
          device_eui,
          timestamp,
          latitude,
          longitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected
        FROM latest_telemetry
        ORDER BY device_eui
    """
    with db() as conn:
        rows = conn.execute(q).fetchall()
    return [dict(r) for r in rows]


@app.get("/map/nodes")
def map_nodes(
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    limit: int = Query(5000, ge=1, le=10000),
):
    """
    Compact payload for map with optional viewport filtering.
    """
    clauses: List[str] = []
    params: List[object] = []

    if min_lat is not None and max_lat is not None:
        clauses.append("latitude BETWEEN ? AND ?")
        params += [min_lat, max_lat]
    if min_lon is not None and max_lon is not None:
        clauses.append("longitude BETWEEN ? AND ?")
        params += [min_lon, max_lon]

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    q = f"""
        SELECT
          device_eui,
          timestamp,
          latitude,
          longitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected
        FROM latest_telemetry
        {where}
        ORDER BY device_eui
        LIMIT ?
    """
    params.append(limit)

    with db() as conn:
        rows = conn.execute(q, tuple(params)).fetchall()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend_api:app", host="0.0.0.0", port=port, reload=False)
