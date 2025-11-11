import os
import datetime as dt
from typing import Optional, List

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv()
DB_DSN = os.getenv("DB_DSN")
if not DB_DSN:
    raise RuntimeError("Missing DB_DSN in .env")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

app = FastAPI(title="LoRa Wildfire Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db() -> psycopg2.extensions.connection:
    return psycopg2.connect(DB_DSN, cursor_factory=RealDictCursor)

def parse_iso(ts: Optional[str]) -> Optional[dt.datetime]:
    if not ts:
        return None
    ts = ts.replace("Z", "+00:00")
    return dt.datetime.fromisoformat(ts)

# -------------------------
#         ENDPOINTS
# -------------------------

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/nodes")
def list_nodes():
    """
    Returns: [{node_id, device_eui, last_seen}]
    """
    q = """
        SELECT node_id, device_eui, last_seen
        FROM nodes
        ORDER BY node_id
    """
    with db() as conn, conn.cursor() as cur:
        cur.execute(q)
        rows = cur.fetchall()
    return rows

@app.get("/nodes/{node_id}/latest")
def node_latest(node_id: str):
    """
    Latest telemetry row for a node_id.
    """
    q = """
        SELECT
          node_id, 
          gateway_id, 
          "timestamp", 
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
        WHERE node_id = %s
        ORDER BY "timestamp" DESC
        LIMIT 1
    """
    with db() as conn, conn.cursor() as cur:
        cur.execute(q, (node_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No telemetry for this node")
    return row

@app.get("/telemetry")
def get_telemetry(
    node_id: Optional[str] = None,
    t_from: Optional[str] = Query(None, description="ISO8601; e.g. 2025-01-01T00:00:00Z"),
    t_to: Optional[str] = Query(None, description="ISO8601; e.g. 2025-01-02T00:00:00Z"),
    limit: int = Query(500, ge=1, le=5000),
    newest_first: bool = True,
):
    """
    Returns telemetry rows. Filters:
      - node_id: only that node’s data
      - t_from/t_to: time range on 'timestamp'
      - limit: row cap (default 500)
    """
    dt_from = parse_iso(t_from)
    dt_to   = parse_iso(t_to)

    clauses: List[str] = []
    params: List[object] = []

    if node_id:
        clauses.append("node_id = %s")
        params.append(node_id)
    if dt_from:
        clauses.append('"timestamp" >= %s')
        params.append(dt_from)
    if dt_to:
        clauses.append('"timestamp" <= %s')
        params.append(dt_to)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    order = 'DESC' if newest_first else 'ASC'

    q = f"""
        SELECT
          node_id, 
          gateway_id, 
          "timestamp", 
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
        ORDER BY "timestamp" {order}
        LIMIT %s
    """

    with db() as conn, conn.cursor() as cur:
        cur.execute(q, (*params, limit))
        rows = cur.fetchall()
    return rows

@app.get("/latest")
def latest_all_nodes():
    """
    Latest telemetry row per node.
    """
    q = """
        SELECT
          node_id, 
          gateway_id, 
          "timestamp", 
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
        ORDER BY node_id
    """
    with db() as conn, conn.cursor() as cur:
        cur.execute(q)
        rows = cur.fetchall()
    return rows

@app.get("/summary")
def summary_all_nodes():
    """
    Compact payload for map: latest row per node.
    """
    q = """
        SELECT
          node_id,
          "timestamp",
          latitude,
          longitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected
        FROM latest_telemetry
        ORDER BY node_id
    """
    with db() as conn, conn.cursor() as cur:
        cur.execute(q)
        return cur.fetchall()

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
        clauses.append("latitude BETWEEN %s AND %s")
        params += [min_lat, max_lat]
    if min_lon is not None and max_lon is not None:
        clauses.append("longitude BETWEEN %s AND %s")
        params += [min_lon, max_lon]

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    q = f"""
        SELECT
          node_id,
          "timestamp",
          latitude,
          longitude,
          temperature_c,
          humidity_pct,
          battery_level,
          smoke_detected
        FROM latest_telemetry
        {where}
        ORDER BY node_id
        LIMIT %s
    """
    params.append(limit)

    with db() as conn, conn.cursor() as cur:
        cur.execute(q, tuple(params))
        return cur.fetchall()


if __name__ == "__main__":
    uvicorn.run("backend_api:app", host="0.0.0.0", port=8000, reload=True)