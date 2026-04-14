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

-- -------------------------
-- Users
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  auth_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- -------------------------
-- User Node Subscriptions
-- -------------------------
CREATE TABLE IF NOT EXISTS user_node_subscriptions (
  user_id TEXT NOT NULL,
  device_eui TEXT NOT NULL,
  PRIMARY KEY (user_id, device_eui),
  FOREIGN KEY (user_id) REFERENCES users(auth_sub) ON DELETE CASCADE,
  FOREIGN KEY (device_eui) REFERENCES nodes(device_eui) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_node_subs_user
ON user_node_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_node_subs_dev
ON user_node_subscriptions(device_eui);

-- -------------------------
-- Alerts (events)
-- -------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dev_eui TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_at INTEGER,
  FOREIGN KEY (dev_eui) REFERENCES nodes(device_eui)
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at
ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_dev_eui_type
ON alerts(dev_eui, alert_type);

CREATE INDEX IF NOT EXISTS idx_alerts_ack
ON alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_alerts_type
ON alerts(alert_type);

-- -------------------------
-- Alert Preferences
-- -------------------------
CREATE TABLE IF NOT EXISTS alert_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  dev_eui TEXT NOT NULL,

  enabled INTEGER NOT NULL DEFAULT 1,

  -- criteria (NULL means "ignore this condition")
  temp_over_c REAL,
  battery_below_pct REAL,
  smoke_detected INTEGER,

  -- cooldown per preference (prevents repeat notifications per user)
  last_sent_at INTEGER,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(auth_sub) ON DELETE CASCADE,
  FOREIGN KEY (dev_eui) REFERENCES nodes(device_eui) ON DELETE CASCADE,
  UNIQUE (user_id, dev_eui)
);

CREATE INDEX IF NOT EXISTS idx_alert_prefs_user
ON alert_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_alert_prefs_dev
ON alert_preferences(dev_eui);

CREATE INDEX IF NOT EXISTS idx_alert_prefs_enabled
ON alert_preferences(enabled);

-- -------------------------
-- RBAC: Clerk-role permission settings per org
-- Maps a Clerk role slug (e.g. 'org:member') to the permissions it has in an org
-- -------------------------
CREATE TABLE IF NOT EXISTS org_role_settings (
  org_id     TEXT NOT NULL,
  clerk_role TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (org_id, clerk_role, permission)
);

CREATE INDEX IF NOT EXISTS idx_org_role_settings_org
ON org_role_settings(org_id, clerk_role);

-- -------------------------
-- Custom Org Roles & Permissions (for future use)
-- -------------------------
CREATE TABLE IF NOT EXISTS org_roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id      TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS org_role_permissions (
  role_id    INTEGER NOT NULL REFERENCES org_roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS org_member_roles (
  org_id      TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(auth_sub),
  role_id     INTEGER NOT NULL REFERENCES org_roles(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_roles_org
ON org_roles(org_id);

CREATE INDEX IF NOT EXISTS idx_org_member_roles_org_user
ON org_member_roles(org_id, user_id);

-- -------------------------
-- Alert Queue
-- -------------------------
CREATE TABLE IF NOT EXISTS alert_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  dev_eui TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,

  in_progress INTEGER NOT NULL DEFAULT 0,
  in_progress_at INTEGER,

  processed INTEGER NOT NULL DEFAULT 0,
  processed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_alert_queue_queueable
ON alert_queue(processed, in_progress, created_at);
