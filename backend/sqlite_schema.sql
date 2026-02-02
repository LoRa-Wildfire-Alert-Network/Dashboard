PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS gateways (
  gateway_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS nodes (
  node_id TEXT PRIMARY KEY,
  device_eui TEXT,
  last_seen TEXT,
  gateway_id TEXT,
  FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY,
  node_id TEXT NOT NULL,
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
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  FOREIGN KEY (gateway_id) REFERENCES gateways(gateway_id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_node_time
ON telemetry(node_id, timestamp);

CREATE VIEW IF NOT EXISTS latest_telemetry AS
SELECT t.*
FROM telemetry t
JOIN (
  SELECT node_id, MAX(timestamp) AS max_ts
  FROM telemetry
  GROUP BY node_id
) latest
ON t.node_id = latest.node_id
AND t.timestamp = latest.max_ts;
