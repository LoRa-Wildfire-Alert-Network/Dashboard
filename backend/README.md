# LoRa Wildfire Alert Network – Backend (SQLite)

Backend services for the **LoRa Wildfire Alert Network Dashboard**.  
This backend ingests live telemetry from LoRa sensor nodes, stores it in a local SQLite database, and provides a FastAPI REST API for the frontend dashboard during development.

---

## Features

- **Real-time Data Ingestion**  
  Continuously fetches live telemetry from LoRa nodes via the configured live API.

- **FastAPI Backend**  
  Provides REST endpoints for telemetry, subscriptions, alerts, and map data.

- **SQLite Database**  
  Lightweight embedded database for easy local development and deployment.

- **Authentication (Clerk JWT)**  
  Secures user-specific endpoints such as subscriptions and alert preferences.

- **CORS Support**  
  Configurable allowed origins for frontend integration.

---

## Prerequisites

- Python **3.12+**
- Docker (optional, for containerized runs)

---

## Environment Variables

Create a `.env` file in the `backend/` directory (**do not commit this file**):

```bash
cp .env.example .env
# Edit .env and set required variables
```

### Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LIVE_URL` | External API for live LoRa telemetry | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | No (default `*`) |
| `CLERK_JWT_ISSUER` | Clerk JWT issuer URL | Yes |
| `DB_NAME` | SQLite database filename | No (default `lora.db`) |
| `ALERTS_ENABLE_WORKERS` | Enable background alert workers | No |

---

## Local Development (Python)

### 1) Set up a virtual environment

```bash
cd backend
python -m venv .venv
```

**Activate**

**Windows**
```bash
.venv\Scripts\activate
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

### 2) Initialize the SQLite database

```bash
python init_sqlite_db.py
```

This creates the database using `sqlite_schema.sql`.

---

### 3) Start the data listener

```bash
python data_listener.py
```

This continuously fetches telemetry from `LIVE_URL` and inserts it into SQLite.

---

### 4) Start the backend API

```bash
uvicorn backend_api:app --reload --port 8000
```

---

## API Access

- **Backend API:** http://localhost:8000  
- **Swagger Docs:** http://localhost:8000/docs  

---

# API Endpoints

## Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/nodes` | GET | List all sensor nodes |
| `/nodes/{device_eui}/latest` | GET | Latest telemetry for a node |
| `/telemetry` | GET | Telemetry history with filters |
| `/summary` | GET | Compact latest telemetry for all nodes |
| `/map/nodes` | GET | Nodes within optional map bounds |

---

## Authentication Required (Clerk JWT)

The following endpoints require a valid Clerk JWT:

```
Authorization: Bearer <token>
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/latest` | GET | Latest telemetry for subscribed nodes |
| `/alerts` | GET | List alert events for nodes the user is subscribed to |
| `/subscriptions` | GET | List user subscriptions |
| `/alert-preferences` | GET | List alert preferences |
| `/alert-preferences` | POST | Create alert preference |
| `/subscriptions/subscribe` | POST | Subscribe to a node |
| `/subscriptions/unsubscribe` | POST | Unsubscribe from a node |
| `/alerts/{alert_id}/ack` | PUT | Acknowledge alert |
| `/alert-preferences/{pref_id}` | PUT | Update alert preference |
| `/alert-preferences/{pref_id}` | DELETE | Delete alert preference |

---

## Example API Calls

```bash
# Get all nodes
curl http://localhost:8000/nodes

# Get latest telemetry for a node
curl http://localhost:8000/nodes/0200000000000001/latest

# Get telemetry with filters
curl "http://localhost:8000/telemetry?device_eui=0200000000000001&limit=100"

# Get alert events
curl http://localhost:8000/alerts
```

---

## Project Structure

```
backend/
├── backend_api.py        # FastAPI REST API
├── data_listener.py      # Live data ingestion service
├── init_sqlite_db.py     # SQLite initialization script
├── sqlite_schema.sql     # Database schema
├── requirements.txt      # Python dependencies
├── clerk_public_key.pem  # Clerk JWT Public Key
├── Dockerfile            # Backend container
├── README.md
├── .env                  # Environment variables (ignored)
├── .env.example          # Environment template
├── lora.db               # SQLite database (ignored)
│
├── alerts/               # Alert processing system
│   ├── __init__.py
│   ├── engine.py         # Alert evaluation logic
│   ├── cooldown.py       # Alert cooldown enforcement
│   ├── dispatch_email.py # Email sending logic
│   └── worker.py         # Background alert workers
│
└── __pycache__/          # Python cache (ignored)
```

---

## Notes

- All responses are JSON
- Timestamps use ISO8601 format
- Default telemetry limit is 500 rows
- SQLite is used for local development
- Alert emails are processed via background workers
