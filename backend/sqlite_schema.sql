PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS gateways (
  gateway_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS nodes (
  device_eui TEXT PRIMARY KEY,
  node_id TEXT,
  last_seen TEXT,
  gateway_id TEXT,
  FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY,
  device_eui TEXT NOT NULL,
  gateway_id TEXT,
  timestamp TEXT NOT NULL,
  device_timestamp TEXT,
  latitude REAL,
  longitude REAL,
  altitude REAL,
  temperature_c REAL,
  humidity_pct REAL,
  battery_level REAL,
  smoke_detected INTEGER DEFAULT 0,
  rssi REAL,
  snr REAL,
  FOREIGN KEY (device_eui) REFERENCES nodes(device_eui),
  FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_time
ON telemetry(device_eui, timestamp);

CREATE VIEW IF NOT EXISTS latest_telemetry AS
SELECT t.*
FROM telemetry t
JOIN (
  SELECT device_eui, MAX(timestamp) AS max_ts
  FROM telemetry
  GROUP BY device_eui
) latest
ON t.device_eui = latest.device_eui
AND t.timestamp = latest.max_ts;

CREATE TABLE IF NOT EXISTS user_node_subscriptions (
  user_id TEXT NOT NULL,
  device_eui TEXT NOT NULL,
  PRIMARY KEY (user_id, device_eui),
  FOREIGN KEY (device_eui) REFERENCES nodes(device_eui) ON DELETE CASCADE
);
