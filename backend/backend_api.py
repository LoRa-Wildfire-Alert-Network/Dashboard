import os
import time
import sqlite3
import uvicorn
import logging
import requests
import jwt as pyjwt
import datetime as dt
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from alerts.worker import start_workers
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


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
    temp_over_c: Optional[float] = Field(default=None, ge=-50, le=150)
    battery_below_pct: Optional[float] = Field(default=None, ge=0, le=100)
    smoke_detected: Optional[bool] = None


class AlertPreferenceUpdate(BaseModel):
    dev_eui: Optional[str] = None
    enabled: Optional[bool] = None
    temp_over_c: Optional[float] = Field(default=None, ge=-50, le=150)
    battery_below_pct: Optional[float] = Field(default=None, ge=0, le=100)
    smoke_detected: Optional[bool] = None


class OrgRoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False
    permissions: List[str] = []


class OrgRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None


class AssignRoleRequest(BaseModel):
    role_id: int


class RoleSettingsUpdate(BaseModel):
    permissions: List[str]


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
CLERK_JWT_ISSUER = os.getenv(
    "CLERK_JWT_ISSUER", "https://growing-midge-79.clerk.accounts.dev"
)
with open(os.path.join(HERE, "clerk_public_key.pem")) as f:
    CLERK_JWT_PUBLIC_KEY = f.read()

bearer_scheme = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only start workers when explicitly enabled
    if not _env_bool("ALERTS_ENABLE_WORKERS", "0"):
        log.info("Alert workers disabled (set ALERTS_ENABLE_WORKERS=1 to enable).")
        yield
        return

    try:
        start_workers()
        log.info("Alert workers started.")
    except Exception:
        log.exception("Failed to start alert workers")

    yield


app = FastAPI(title="LoRa Wildfire Backend API", lifespan=lifespan)
CLERK_SECRET_KEY = os.getenv("VITE_CLERK_PUBLISHABLE_KEY")

ALL_PERMISSIONS: set[str] = {
    "view_nodes",
    "subscribe_nodes",
    "ack_alerts",
    "manage_alert_preferences",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        [o.strip() for o in ALLOWED_ORIGINS.split(",")]
        if ALLOWED_ORIGINS != "*"
        else ["*"]
    ),
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
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Clerk JWT: {e}")


def get_clerk_user_id(
    request: Request,
    payload: dict = Depends(_decode_clerk_jwt),
) -> str:
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id in Clerk token")
    email = None
    with db() as conn:
        row = conn.execute(
            "SELECT email FROM users WHERE auth_sub = ?", (user_id,)
        ).fetchone()
        if row and row["email"]:
            email = row["email"]
    if not email:
        email = fetch_clerk_email(user_id)
        ensure_user_row(user_id, email)
    return user_id


def get_clerk_org_id(
    request: Request,
    payload: dict = Depends(_decode_clerk_jwt),
) -> str | None:
    return payload.get("org_id") or request.headers.get("x-org-id")


_org_role_cache: dict[tuple[str, str], tuple[str | None, float]] = {}
_ORG_ROLE_CACHE_TTL = 300  # 5 minutes


def _fetch_user_org_role(user_id: str, org_id: str) -> str | None:
    cache_key = (user_id, org_id)
    cached = _org_role_cache.get(cache_key)
    if cached and time.time() - cached[1] < _ORG_ROLE_CACHE_TTL:
        return cached[0]

    if not CLERK_SECRET_KEY:
        return None
    result: str | None = None
    try:
        r = requests.get(
            f"https://api.clerk.com/v1/users/{user_id}/organization_memberships",
            params={"limit": 50},
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=10,
        )
        if r.status_code != 200:
            log.warning("Clerk memberships API error: status=%s", r.status_code)
        else:
            for m in r.json().get("data", []):
                if m.get("organization", {}).get("id") == org_id:
                    result = m.get("role")
                    break
    except Exception:
        log.exception("Failed to fetch user org role from Clerk")

    _org_role_cache[cache_key] = (result, time.time())
    return result


def get_clerk_org_role(
    request: Request,
    user_id: str = Depends(get_clerk_user_id),
    org_id: str | None = Depends(get_clerk_org_id),
    payload: dict = Depends(_decode_clerk_jwt),
) -> str | None:
    jwt_role = payload.get("org_role")
    if jwt_role:
        return jwt_role
    if org_id:
        return _fetch_user_org_role(user_id, org_id)
    return None


def get_org_permissions(
    user_id: str = Depends(get_clerk_user_id),
    org_id: str | None = Depends(get_clerk_org_id),
    org_role: str | None = Depends(get_clerk_org_role),
) -> set[str]:
    if not org_id:
        return ALL_PERMISSIONS
    if org_role == "org:admin":
        return ALL_PERMISSIONS
    if not org_role:
        return set()
    with db() as conn:
        perms = conn.execute(
            "SELECT permission FROM org_role_settings "
            "WHERE org_id = ? AND clerk_role = ?",
            (org_id, org_role),
        ).fetchall()
    return {p["permission"] for p in perms}


def _require_perm(perm: str):
    def _check(permissions: set = Depends(get_org_permissions)) -> None:
        if perm not in permissions:
            raise HTTPException(status_code=403, detail=f"Permission denied: {perm}")

    return _check


def require_permission(perm: str):
    return Depends(_require_perm(perm))


def require_org_admin(
    org_id: str | None = Depends(get_clerk_org_id),
    org_role: str | None = Depends(get_clerk_org_role),
) -> str:
    if not org_id:
        raise HTTPException(status_code=403, detail="Must be in an org context")
    if org_role != "org:admin":
        raise HTTPException(status_code=403, detail="Org admin required")
    return org_id


def fetch_clerk_email(user_id: str) -> str:
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Missing CLERK_SECRET_KEY")

    url = f"https://api.clerk.com/v1/users/{user_id}"
    r = requests.get(
        url,
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        timeout=10,
    )

    if r.status_code != 200:
        log.warning("Clerk API error: status=%s body=%s", r.status_code, r.text[:200])
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch user from Clerk (status {r.status_code})",
        )

    data: dict[str, Any] = r.json()

    # pick primary email if present, else first email
    primary_id = data.get("primary_email_address_id")
    emails = data.get("email_addresses") or []

    email = None
    if primary_id:
        for e in emails:
            if e.get("id") == primary_id:
                email = e.get("email_address")
                break

    if not email and emails:
        email = emails[0].get("email_address")

    if not email:
        raise HTTPException(status_code=401, detail="No email on Clerk user")

    return email


# -------------------------
#         ENDPOINTS
# -------------------------


@app.post("/subscriptions/subscribe")
def subscribe_node(
    body: NodeIdRequest,
    user_id: str = Depends(get_clerk_user_id),
    _perm: None = require_permission("subscribe_nodes"),
):
    device_eui = body.device_eui
    with db() as conn:
        node = conn.execute(
            "SELECT device_eui FROM nodes WHERE device_eui = ?", (device_eui,)
        ).fetchone()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        try:
            conn.execute(
                "INSERT INTO user_node_subscriptions "
                "(user_id, device_eui) VALUES (?, ?)",
                (user_id, device_eui),
            )
            ts = now_ts()
            # default alert preference: smoke, temp>70°C, battery<20%
            # (until frontend supports config)
            conn.execute(
                """
                INSERT OR IGNORE INTO alert_preferences
                (user_id, dev_eui, enabled, temp_over_c,
                battery_below_pct, smoke_detected, created_at, updated_at)
                VALUES (?, ?, 1, 70.0, 20.0, 1, ?, ?)
                """,
                (user_id, device_eui, ts, ts),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Already subscribed")
    return {"message": f"Subscribed to {device_eui}"}


@app.post("/subscriptions/unsubscribe")
def unsubscribe_node(
    body: NodeIdRequest,
    user_id: str = Depends(get_clerk_user_id),
    _perm: None = require_permission("subscribe_nodes"),
):
    device_eui = body.device_eui
    with db() as conn:
        conn.execute(
            "DELETE FROM user_node_subscriptions WHERE user_id = ? AND device_eui = ?",
            (user_id, device_eui),
        )
        conn.execute(
            "DELETE FROM alert_preferences WHERE user_id = ? AND dev_eui = ?",
            (user_id, device_eui),
        )
        conn.commit()
    return {"message": f"Unsubscribed from {device_eui}"}


@app.post("/alert-preferences", status_code=201)
def create_alert_preference(
    body: AlertPreferenceCreate,
    user_id: str = Depends(get_clerk_user_id),
):
    ts = now_ts()
    enabled = 1 if (body.enabled is None or body.enabled) else 0
    smoke = None if body.smoke_detected is None else (1 if body.smoke_detected else 0)
    # New validation
    if (
        body.temp_over_c is None
        and body.battery_below_pct is None
        and body.smoke_detected is None
    ):
        raise HTTPException(
            status_code=422,
            detail="At least one alert condition must be set",
        )
    with db() as conn:
        # verify node exists
        node = conn.execute(
            "SELECT device_eui FROM nodes WHERE device_eui = ?", (body.dev_eui,)
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
def list_alert_preferences(user_id: str = Depends(get_clerk_user_id)):
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
def get_user_subscriptions(
    user_id: str = Depends(get_clerk_user_id),
):
    with db() as conn:
        rows = conn.execute(
            "SELECT device_eui FROM user_node_subscriptions WHERE user_id = ?",
            (user_id,),
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
    # user_id: Optional[str] = Depends(get_clerk_user_id),
):
    clauses: List[str] = []
    params: List[object] = []
    # if user_id:
    #     clauses.append("s.user_id = ?")
    #     params.append(user_id)
    if dev_eui:
        clauses.append("a.dev_eui = ?")
        params.append(dev_eui)
    if acknowledged is not None:
        clauses.append("a.acknowledged = ?")
        params.append(1 if acknowledged else 0)
    # join = (
    #     "JOIN user_node_subscriptions s ON s.device_eui = a.dev_eui" if user_id else ""
    # )
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    q = f"""
        SELECT
          a.id,
          a.dev_eui,
          a.alert_type,
          a.message,
          a.created_at,
          a.acknowledged,
          a.acknowledged_at
        FROM alerts a
        {where}
        ORDER BY a.created_at DESC
        LIMIT ?
    """
    params.append(limit)
    with db() as conn:
        rows = conn.execute(q, tuple(params)).fetchall()
    return [dict(r) for r in rows]


@app.put("/alerts/{alert_id}/ack")
def acknowledge_alert(
    alert_id: int,
    user_id: str = Depends(get_clerk_user_id),
):
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
            AND dev_eui IN (
                SELECT device_eui
                FROM user_node_subscriptions
                WHERE user_id = ?
            )
            """,
            (ts, alert_id, user_id),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "ok", "id": alert_id}


@app.put("/alert-preferences/{pref_id}")
def update_alert_preference(
    pref_id: int,
    body: AlertPreferenceUpdate,
    user_id: str = Depends(get_clerk_user_id),
):
    ts = now_ts()

    with db() as conn:
        existing = conn.execute(
            "SELECT * FROM alert_preferences WHERE id = ?", (pref_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Preference not found")
        if existing["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Preference not found")

        # Reject empty/no-op update bodies (don’t allow "update only updated_at")
        has_update = (
            ("dev_eui" in body.model_fields_set and body.dev_eui is not None)
            or ("enabled" in body.model_fields_set and body.enabled is not None)
            or ("temp_over_c" in body.model_fields_set)
            or ("battery_below_pct" in body.model_fields_set)
            or ("smoke_detected" in body.model_fields_set)
        )
        if not has_update:
            raise HTTPException(status_code=422, detail="No updatable fields provided")

        # If dev_eui is changing, verify node exists
        if "dev_eui" in body.model_fields_set and body.dev_eui is not None:
            node = conn.execute(
                "SELECT device_eui FROM nodes WHERE device_eui = ?", (body.dev_eui,)
            ).fetchone()
            if not node:
                raise HTTPException(status_code=404, detail="Node not found")

        set_clauses = []
        params = []

        if "dev_eui" in body.model_fields_set and body.dev_eui is not None:
            set_clauses.append("dev_eui = ?")
            params.append(body.dev_eui)

        if "enabled" in body.model_fields_set and body.enabled is not None:
            set_clauses.append("enabled = ?")
            params.append(1 if body.enabled else 0)

        if "temp_over_c" in body.model_fields_set:
            set_clauses.append("temp_over_c = ?")
            params.append(body.temp_over_c)

        if "battery_below_pct" in body.model_fields_set:
            set_clauses.append("battery_below_pct = ?")
            params.append(body.battery_below_pct)

        if "smoke_detected" in body.model_fields_set:
            if body.smoke_detected is None:
                smoke = None
            else:
                smoke = 1 if body.smoke_detected else 0
            set_clauses.append("smoke_detected = ?")
            params.append(smoke)

        set_clauses.append("updated_at = ?")
        params.append(ts)

        try:
            conn.execute(
                f"""
                UPDATE alert_preferences
                SET {", ".join(set_clauses)}
                WHERE id = ?
                """,
                (*params, pref_id),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="Preference for this device already exists for this user",
            )

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


@app.delete("/alert-preferences/{pref_id}", status_code=204)
def delete_alert_preference(
    pref_id: int,
    user_id: str = Depends(get_clerk_user_id),
):

    with db() as conn:
        existing = conn.execute(
            "SELECT user_id FROM alert_preferences WHERE id = ?", (pref_id,)
        ).fetchone()
        if not existing or existing["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Preference not found")
        conn.execute("DELETE FROM alert_preferences WHERE id = ?", (pref_id,))
        conn.commit()


@app.get("/nodes")
def list_nodes(_perm: None = require_permission("view_nodes")):
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
def node_latest(device_eui: str, _perm: None = require_permission("view_nodes")):
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
    _perm: None = require_permission("view_nodes"),
    device_eui: Optional[str] = None,
    t_from: Optional[str] = Query(
        None, description="ISO8601; e.g. 2025-01-01T00:00:00Z"
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
def latest_all_nodes(
    user_id: str = Depends(get_clerk_user_id),
    _perm: None = require_permission("view_nodes"),
):
    with db() as conn:
        device_euis = conn.execute(
            "SELECT device_eui FROM user_node_subscriptions WHERE user_id = ?",
            (user_id,),
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
def summary_all_nodes(_perm: None = require_permission("view_nodes")):
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
    _perm: None = require_permission("view_nodes"),
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


# -------------------------
#      ORG / RBAC ENDPOINTS
# -------------------------


@app.get("/org/role-settings")
def get_org_role_settings(org_id: str = Depends(require_org_admin)):
    with db() as conn:
        rows = conn.execute(
            "SELECT clerk_role, permission FROM org_role_settings WHERE org_id = ?",
            (org_id,),
        ).fetchall()
    result: dict[str, list[str]] = {}
    for row in rows:
        result.setdefault(row["clerk_role"], []).append(row["permission"])
    return result


@app.put("/org/role-settings/{clerk_role}")
def update_org_role_settings(
    clerk_role: str,
    body: RoleSettingsUpdate,
    org_id: str = Depends(require_org_admin),
):
    invalid = set(body.permissions) - ALL_PERMISSIONS
    if invalid:
        raise HTTPException(
            status_code=422, detail=f"Invalid permissions: {sorted(invalid)}"
        )

    new_perms = set(body.permissions)
    with db() as conn:
        old_perms = {
            row["permission"]
            for row in conn.execute(
                "SELECT permission FROM org_role_settings "
                "WHERE org_id = ? AND clerk_role = ?",
                (org_id, clerk_role),
            ).fetchall()
        }

        conn.execute(
            "DELETE FROM org_role_settings WHERE org_id = ? AND clerk_role = ?",
            (org_id, clerk_role),
        )
        for perm in new_perms:
            conn.execute(
                "INSERT INTO org_role_settings "
                "(org_id, clerk_role, permission) VALUES (?, ?, ?)",
                (org_id, clerk_role, perm),
            )
        conn.commit()

    subscribe_revoked = (
        "subscribe_nodes" in old_perms and "subscribe_nodes" not in new_perms
    )
    if subscribe_revoked and CLERK_SECRET_KEY:
        try:
            r = requests.get(
                f"https://api.clerk.com/v1/organizations/{org_id}/memberships",
                params={"limit": 500},
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
                timeout=10,
            )
            if r.status_code == 200:
                affected_user_ids = [
                    m["public_user_data"]["user_id"]
                    for m in r.json().get("data", [])
                    if m.get("role") == clerk_role
                ]
                if affected_user_ids:
                    uid_params = [(uid,) for uid in affected_user_ids]
                    with db() as conn:
                        conn.executemany(
                            "DELETE FROM user_node_subscriptions WHERE user_id = ?",
                            uid_params,
                        )
                        conn.executemany(
                            "DELETE FROM alert_preferences WHERE user_id = ?",
                            uid_params,
                        )
                        conn.commit()
                    log.info(
                        "Auto-unsubscribed %d user(s) in org %s "
                        "(role %s lost subscribe_nodes); "
                        "removed matching alert preferences",
                        len(affected_user_ids),
                        org_id,
                        clerk_role,
                    )
            else:
                log.warning(
                    "Could not fetch org members to auto-unsubscribe: " "status=%s",
                    r.status_code,
                )
        except Exception:
            log.exception(
                "Failed to auto-unsubscribe users after subscribe_nodes revocation"
            )

    return {
        "org_id": org_id,
        "clerk_role": clerk_role,
        "permissions": sorted(new_perms),
    }


@app.get("/org/me/permissions")
def get_my_permissions(permissions: set = Depends(get_org_permissions)):
    return {"permissions": sorted(permissions)}


@app.get("/org/roles")
def list_org_roles(org_id: str = Depends(require_org_admin)):
    with db() as conn:
        roles = conn.execute(
            """
            SELECT id, org_id, name, description, is_default, created_at
            FROM org_roles WHERE org_id = ? ORDER BY name
            """,
            (org_id,),
        ).fetchall()
        result = []
        for role in roles:
            perms = conn.execute(
                "SELECT permission FROM org_role_permissions WHERE role_id = ?",
                (role["id"],),
            ).fetchall()
            result.append(
                {**dict(role), "permissions": [p["permission"] for p in perms]}
            )
    return result


@app.post("/org/roles", status_code=201)
def create_org_role(
    body: OrgRoleCreate,
    org_id: str = Depends(require_org_admin),
):
    invalid = set(body.permissions) - ALL_PERMISSIONS
    if invalid:
        raise HTTPException(
            status_code=422, detail=f"Invalid permissions: {sorted(invalid)}"
        )
    ts = now_ts()
    with db() as conn:
        if body.is_default:
            conn.execute(
                "UPDATE org_roles SET is_default = 0 WHERE org_id = ?", (org_id,)
            )
        try:
            conn.execute(
                "INSERT INTO org_roles "
                "(org_id, name, description, is_default, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    org_id,
                    body.name.strip(),
                    body.description,
                    1 if body.is_default else 0,
                    ts,
                ),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=400, detail="Role name already exists in this org"
            )
        role_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        for perm in body.permissions:
            conn.execute(
                "INSERT OR IGNORE INTO org_role_permissions "
                "(role_id, permission) VALUES (?, ?)",
                (role_id, perm),
            )
        conn.commit()
        role = conn.execute(
            "SELECT id, org_id, name, description, is_default, created_at "
            "FROM org_roles WHERE id = ?",
            (role_id,),
        ).fetchone()
        perms = conn.execute(
            "SELECT permission FROM org_role_permissions WHERE role_id = ?", (role_id,)
        ).fetchall()
    return {**dict(role), "permissions": [p["permission"] for p in perms]}


@app.put("/org/roles/{role_id}")
def update_org_role(
    role_id: int,
    body: OrgRoleUpdate,
    org_id: str = Depends(require_org_admin),
):
    with db() as conn:
        existing = conn.execute(
            "SELECT id FROM org_roles WHERE id = ? AND org_id = ?", (role_id, org_id)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")
        set_clauses, params = [], []
        if body.name is not None:
            set_clauses.append("name = ?")
            params.append(body.name.strip())
        if body.description is not None:
            set_clauses.append("description = ?")
            params.append(body.description)
        if body.is_default is not None:
            if body.is_default:
                conn.execute(
                    "UPDATE org_roles SET is_default = 0 WHERE org_id = ?", (org_id,)
                )
            set_clauses.append("is_default = ?")
            params.append(1 if body.is_default else 0)
        if not set_clauses:
            raise HTTPException(status_code=422, detail="No updatable fields provided")
        try:
            conn.execute(
                f"UPDATE org_roles SET {', '.join(set_clauses)} WHERE id = ?",
                (*params, role_id),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=400, detail="Role name already exists in this org"
            )
        conn.commit()
        role = conn.execute(
            "SELECT id, org_id, name, description, is_default, created_at "
            "FROM org_roles WHERE id = ?",
            (role_id,),
        ).fetchone()
        perms = conn.execute(
            "SELECT permission FROM org_role_permissions WHERE role_id = ?", (role_id,)
        ).fetchall()
    return {**dict(role), "permissions": [p["permission"] for p in perms]}


@app.delete("/org/roles/{role_id}", status_code=204)
def delete_org_role(role_id: int, org_id: str = Depends(require_org_admin)):
    with db() as conn:
        existing = conn.execute(
            "SELECT id FROM org_roles WHERE id = ? AND org_id = ?", (role_id, org_id)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")
        assigned = conn.execute(
            "SELECT COUNT(*) AS cnt FROM org_member_roles WHERE role_id = ?", (role_id,)
        ).fetchone()
        if assigned["cnt"] > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete a role that has members assigned",
            )
        conn.execute("DELETE FROM org_roles WHERE id = ?", (role_id,))
        conn.commit()


@app.post("/org/roles/{role_id}/permissions/{perm}", status_code=201)
def add_role_permission(
    role_id: int,
    perm: str,
    org_id: str = Depends(require_org_admin),
):
    if perm not in ALL_PERMISSIONS:
        raise HTTPException(status_code=422, detail=f"Invalid permission: {perm}")
    with db() as conn:
        existing = conn.execute(
            "SELECT id FROM org_roles WHERE id = ? AND org_id = ?", (role_id, org_id)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")
        conn.execute(
            "INSERT OR IGNORE INTO org_role_permissions "
            "(role_id, permission) VALUES (?, ?)",
            (role_id, perm),
        )
        conn.commit()
    return {"role_id": role_id, "permission": perm}


@app.delete("/org/roles/{role_id}/permissions/{perm}", status_code=204)
def remove_role_permission(
    role_id: int,
    perm: str,
    org_id: str = Depends(require_org_admin),
):
    with db() as conn:
        existing = conn.execute(
            "SELECT id FROM org_roles WHERE id = ? AND org_id = ?", (role_id, org_id)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")
        conn.execute(
            "DELETE FROM org_role_permissions WHERE role_id = ? AND permission = ?",
            (role_id, perm),
        )
        conn.commit()


@app.get("/org/members")
def list_org_members(org_id: str = Depends(require_org_admin)):
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Missing CLERK_SECRET_KEY")
    r = requests.get(
        f"https://api.clerk.com/v1/organizations/{org_id}/memberships?limit=100",
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        timeout=10,
    )
    if r.status_code != 200:
        log.warning(
            "Clerk org memberships error: status=%s body=%s",
            r.status_code,
            r.text[:200],
        )
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch org members from Clerk (status {r.status_code})",
        )
    clerk_members = r.json().get("data", [])

    with db() as conn:
        member_role_rows = conn.execute(
            """
            SELECT mr.user_id, mr.role_id, r.name AS role_name,
                   r.description AS role_description, r.is_default
            FROM org_member_roles mr
            JOIN org_roles r ON r.id = mr.role_id
            WHERE mr.org_id = ?
            """,
            (org_id,),
        ).fetchall()
        role_map = {row["user_id"]: dict(row) for row in member_role_rows}
        perm_map: dict[str, list[str]] = {}
        for row in member_role_rows:
            perms = conn.execute(
                "SELECT permission FROM org_role_permissions WHERE role_id = ?",
                (row["role_id"],),
            ).fetchall()
            perm_map[row["user_id"]] = [p["permission"] for p in perms]

    result = []
    for m in clerk_members:
        pub = m.get("public_user_data", {})
        user_id = pub.get("user_id")
        first = pub.get("first_name") or ""
        last = pub.get("last_name") or ""
        assigned = role_map.get(user_id)
        result.append(
            {
                "user_id": user_id,
                "email": pub.get("identifier", ""),
                "name": f"{first} {last}".strip() or None,
                "clerk_role": m.get("role"),
                "assigned_role": (
                    {
                        "id": assigned["role_id"],
                        "name": assigned["role_name"],
                        "description": assigned["role_description"],
                        "is_default": bool(assigned["is_default"]),
                        "permissions": perm_map.get(user_id, []),
                    }
                    if assigned
                    else None
                ),
            }
        )
    return result


@app.put("/org/members/{member_user_id}/role")
def assign_member_role(
    member_user_id: str,
    body: AssignRoleRequest,
    org_id: str = Depends(require_org_admin),
    admin_id: str = Depends(get_clerk_user_id),
):
    ts = now_ts()
    with db() as conn:
        role = conn.execute(
            "SELECT id FROM org_roles WHERE id = ? AND org_id = ?",
            (body.role_id, org_id),
        ).fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found in this org")
        conn.execute(
            "INSERT OR IGNORE INTO users (auth_sub, email, created_at) "
            "VALUES (?, '', ?)",
            (member_user_id, ts),
        )
        conn.execute(
            """
            INSERT INTO org_member_roles
              (org_id, user_id, role_id, assigned_at, assigned_by)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(org_id, user_id) DO UPDATE SET
              role_id = excluded.role_id,
              assigned_at = excluded.assigned_at,
              assigned_by = excluded.assigned_by
            """,
            (org_id, member_user_id, body.role_id, ts, admin_id),
        )
        conn.commit()
    return {"org_id": org_id, "user_id": member_user_id, "role_id": body.role_id}


@app.delete("/org/members/{member_user_id}/role", status_code=204)
def remove_member_role(
    member_user_id: str,
    org_id: str = Depends(require_org_admin),
):
    with db() as conn:
        conn.execute(
            "DELETE FROM org_member_roles WHERE org_id = ? AND user_id = ?",
            (org_id, member_user_id),
        )
        conn.commit()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend_api:app", host="0.0.0.0", port=port, reload=False)
