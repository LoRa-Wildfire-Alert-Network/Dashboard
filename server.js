import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DB_DSN,
});

app.get('/api/nodes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT node_id, device_eui, name, description, firmware_version, 
             installed_at, last_seen, active
      FROM nodes
      ORDER BY last_seen DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

app.get('/api/telemetry/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const result = await pool.query(`
      SELECT t.*, n.name as node_name
      FROM telemetry t
      LEFT JOIN nodes n ON t.node_id = n.node_id
      ORDER BY t.timestamp DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

app.get('/api/telemetry/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const result = await pool.query(`
      SELECT *
      FROM telemetry
      WHERE node_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [nodeId, limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching node telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch node telemetry' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [nodesResult, telemetryResult, activeNodesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM nodes'),
      pool.query('SELECT COUNT(*) as count FROM telemetry'),
      pool.query('SELECT COUNT(*) as count FROM nodes WHERE active = true AND last_seen > NOW() - INTERVAL \'1 hour\'')
    ]);

    const latestTelemetry = await pool.query(`
      SELECT AVG(temperature_c) as avg_temp, 
             AVG(humidity_pct) as avg_humidity,
             AVG(battery_level) as avg_battery
      FROM telemetry
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);

    res.json({
      totalNodes: parseInt(nodesResult.rows[0].count),
      totalTelemetry: parseInt(telemetryResult.rows[0].count),
      activeNodes: parseInt(activeNodesResult.rows[0].count),
      avgTemperature: parseFloat(latestTelemetry.rows[0].avg_temp) || 0,
      avgHumidity: parseFloat(latestTelemetry.rows[0].avg_humidity) || 0,
      avgBattery: parseFloat(latestTelemetry.rows[0].avg_battery) || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/gateways', async (req, res) => {
  try {
    const result = await pool.query('SELECT gateway_id FROM gateways ORDER BY gateway_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gateways:', error);
    res.status(500).json({ error: 'Failed to fetch gateways' });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

