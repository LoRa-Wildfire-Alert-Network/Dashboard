import os, datetime, requests, time, sqlite3
from dotenv import load_dotenv


HERE = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(HERE, ".env"))

API_URL = os.getenv("LIVE_URL", "https://lora.derekrgreene.com/api/live")
DB_NAME = os.getenv("DB_NAME") or "lora.db"
DB_PATH = os.path.join(HERE, DB_NAME)

def parse_rfc3339(dt_str):
    if not dt_str:
        return None
    return datetime.datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

def parse_unix_epoch(ts):
    try:
        return datetime.datetime.fromtimestamp(int(ts), tz=datetime.UTC)
    except Exception:
        return None

def fetch_live():
    r = requests.get(API_URL, timeout=10)
    r.raise_for_status()
    data = r.json()
    return data if isinstance(data, list) else [data]

def extract_rows(objs):
    rows = []
    for o in objs:
        node_id = o.get("devAddr")
        ts_network = parse_rfc3339(o.get("time"))

        rx = (o.get("rxInfo") or [])
        rx0 = rx[0] if rx else {}
        gateway_id = rx0.get("gatewayId")
        rssi = rx0.get("rssi")
        snr  = rx0.get("snr")
        loc  = rx0.get("location") or {}
        lat, lon, alt = loc.get("latitude"), loc.get("longitude"), loc.get("altitude")

        obj = o.get("object") or {}
        battery_level = obj.get("battery_level")
        humidity      = obj.get("humidity")
        smoke         = obj.get("smoke_detected")
        temp_raw      = obj.get("temperature")
        temperature_c = (float(temp_raw) / 100.0) if temp_raw is not None else None
        ts_device     = parse_unix_epoch(obj.get("timestamp"))

        rows.append({
            "node_id": node_id,
            "device_eui": (o.get("deviceInfo") or {}).get("devEui"),
            "gateway_id": gateway_id,
            "timestamp": ts_network,
            "device_timestamp": ts_device,
            "lat": lat, "lon": lon, "alt": alt,
            "temperature_c": temperature_c,
            "humidity_pct": humidity,
            "battery_level": battery_level,
            "rssi": rssi, "snr": snr,
            "smoke_detected": 1 if obj.get("smoke_detected") else 0,
        })
    return rows

def _to_iso(dt):
    return dt.isoformat() if isinstance(dt, datetime.datetime) else None

def upsert(conn, rows):
    cur = conn.cursor()

    # Nodes upsert (SQLite ON CONFLICT)
    node_values = []
    for r in rows:
        if r["node_id"]:
            node_values.append((r["node_id"], r["device_eui"], _to_iso(r["timestamp"])))

    if node_values:
        cur.executemany("""
            INSERT INTO nodes (node_id, device_eui, last_seen)
            VALUES (?, ?, ?)
            ON CONFLICT(node_id) DO UPDATE SET
              device_eui = excluded.device_eui,
              last_seen  = excluded.last_seen;
        """, node_values)

    # Gateways insert-ignore
    gw_values = [(r["gateway_id"],) for r in rows if r.get("gateway_id")]
    if gw_values:
        cur.executemany("""
            INSERT INTO gateways (gateway_id)
            VALUES (?)
            ON CONFLICT(gateway_id) DO NOTHING;
        """, gw_values)

    # Telemetry insert (bulk)
    tel_values = []
    for r in rows:
        tel_values.append((
            r["node_id"], r["gateway_id"], _to_iso(r["timestamp"]), _to_iso(r["device_timestamp"]),
            r["lat"], r["lon"], r["alt"],
            r["temperature_c"], r["humidity_pct"], r["battery_level"],
            r["rssi"], r["snr"], r["smoke_detected"]
        ))

    if tel_values:
        cur.executemany("""
            INSERT INTO telemetry
              (node_id, gateway_id, timestamp, device_timestamp,
               latitude, longitude, altitude,
               temperature_c, humidity_pct, battery_level,
               rssi, snr, smoke_detected)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tel_values)

    conn.commit()

def main():
    while True:
        try:
            objs = fetch_live()
            rows = extract_rows(objs)
            if not rows:
                print("No data.")
            else:
                conn = sqlite3.connect(DB_PATH, check_same_thread=False)
                try:
                    conn.execute("PRAGMA foreign_keys = ON;")
                    upsert(conn, rows)
                    print(f"Inserted {len(rows)} row(s).")
                finally:
                    conn.close()
        except Exception as e:
            print("Error:", e)

        time.sleep(3)

if __name__ == "__main__":
    main()
