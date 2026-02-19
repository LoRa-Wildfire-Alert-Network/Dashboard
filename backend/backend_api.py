from pydantic import BaseModel
import os
import datetime as dt
from typing import Optional, List
import sqlite3
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import jwt as pyjwt

HERE = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(HERE, ".env"))


class NodeIdRequest(BaseModel):
    device_eui: str


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
CLERK_JWT_ISSUER = os.getenv(
    "CLERK_JWT_ISSUER",
    "https://growing-midge-79.clerk.accounts.dev"
)
with open(os.path.join(HERE, "clerk_public_key.pem")) as f:
    CLERK_JWT_PUBLIC_KEY = f.read()

bearer_scheme = HTTPBearer()
app = FastAPI(title="LoRa Wildfire Backend API")

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


def get_clerk_user_id(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    token = credentials.credentials
    try:
        payload = pyjwt.decode(
            token,
            CLERK_JWT_PUBLIC_KEY,
            algorithms=["RS256"],
            audience=None,
            issuer=CLERK_JWT_ISSUER
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Clerk JWT: {e}")
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id in Clerk token")
    return user_id

# -------------------------
#         ENDPOINTS
# -------------------------


@app.post("/subscriptions/subscribe")
def subscribe_node(
    body: NodeIdRequest,
    user_id: str = Depends(get_clerk_user_id)
):
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
def unsubscribe_node(body: NodeIdRequest, user_id: str = Depends(get_clerk_user_id)):
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


@app.get("/subscriptions")
def get_user_subscriptions(user_id: str = Depends(get_clerk_user_id)):
    with db() as conn:
        rows = conn.execute(
            "SELECT device_eui FROM user_node_subscriptions WHERE user_id = ?",
            (user_id,)
        ).fetchall()
    return [r[0] for r in rows]


@app.get("/health")
def health():
    return {"status": "ok"}


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
def latest_all_nodes(user_id: str = Depends(get_clerk_user_id)):
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
