# LoRa Wildfire Alert Network – Backend (SQLite)

Backend services for the **LoRa Wildfire Alert Network Dashboard**.  
This backend ingests live telemetry from LoRa sensor nodes, stores it in a local SQLite database, and provides a FastAPI REST API for the frontend dashboard during development.

---

## Features

- **Real-time Data Ingestion**  
  Continuously fetches live telemetry from LoRa nodes via the configured live API.

- **FastAPI Backend**  
  Provides REST endpoints for nodes, telemetry history, and map data.

- **SQLite Database**  
  Lightweight embedded database for easy local development and deployment.

- **CORS Support**  
  Configurable allowed origins for frontend integration.

---

## Prerequisites

- Python **3.12+**
- Docker (optional, for containerized runs)

---

## Environment Variables

Create a `.env` file in the `backend/` directory (**do not commit this file**):

```env
LIVE_URL=
ALLOWED_ORIGINS=*
```

### Variables

| Variable | Description | Required |
|---------|-------------|----------|
| `LIVE_URL` | External API for live LoRa telemetry | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | No (default `*`) |

---

## Local Development (Python)

### 1) Set up virtual environment

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
- **API Docs (Swagger):** http://localhost:8000/docs  

---

## API Endpoints (Internal Use Only)

The following endpoints are provided **for local development and internal frontend use** as part of this course project.

> **Security / Scope Notice**  
> This backend is **not publicly exposed**. Endpoints are only accessible when run locally or in a controlled development environment.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/nodes` | GET | List all sensor nodes |
| `/nodes/{node_id}/latest` | GET | Latest telemetry for a node |
| `/telemetry` | GET | Telemetry history (filterable) |
| `/latest` | GET | Latest telemetry per node |
| `/summary` | GET | Compact latest telemetry |
| `/map/nodes` | GET | Nodes within map bounds |

---

## Example API Calls

```bash
# Get all nodes
curl http://localhost:8000/nodes

# Get latest data for a node
curl http://localhost:8000/nodes/00c1ea6e/latest

# Get telemetry with filters
curl "http://localhost:8000/telemetry?node_id=00c1ea6e&limit=100"
```

---

## Project Structure

```
backend/
├── backend_api.py        # FastAPI REST API
├── data_listener.py     # Live data ingestion service
├── init_sqlite_db.py    # SQLite initialization script
├── sqlite_schema.sql    # Database schema
├── requirements.txt     # Python dependencies
├── Dockerfile           # Backend container
├── README.md
└── lora.db              # SQLite database (ignored)
```

