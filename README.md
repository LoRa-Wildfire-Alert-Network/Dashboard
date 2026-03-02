# LoRa Wildfire Alert Network Dashboard

A real-time monitoring dashboard for LoRa-based wildfire detection sensor nodes. This system collects telemetry data from distributed sensor nodes and displays it on an interactive map with detailed node information.

## Features

- **Real-time Data Ingestion**: Continuously fetches sensor data from LoRa nodes via the live API
- **Interactive Map**: Visualize node locations with color-coded markers indicating status
  - 🟢 Green: Normal operation
  - 🟠 Orange: Low battery warning
  - 🔴 Red: Smoke detected
- **Node Details**: View detailed telemetry including temperature, humidity, battery level, and smoke detection status
- **SQLite Database**: Lightweight embedded database for easy deployment and data persistence
- **User Alert Preferences**: Users can configure alert rules per device (`dev_eui`), including temperature, battery, and smoke triggers
- **Queued Email Notifications**:
  - Alert events stored in `alerts`
  - Matching user preferences evaluated
  - Queue row created per matching user
  - Email stored directly on the queue row
  - Background workers send notifications
  - Worker count configurable via `ALERT_WORKERS` environment variable

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LoRa Nodes    │────▶│  LoRa Gateway   │────▶│  Data Listener  │
│   (Sensors)     │     │  (Chirpstask)   │     │  (Python)       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │◀────│  Backend API    │◀────│    SQLite       │
│   (React/Vite)  │     │  (FastAPI)      │     │   (lora.db)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Start up

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Running with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/LoRa-Wildfire-Alert-Network/Dashboard.git
   cd Dashboard
   ```

2. **Configure environment variables**
   
   **Backend** — Create `backend/.env` from the example:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   **Frontend** — Create `frontend/.env` from the example:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run the data listener** (to fetch live sensor data)
   ```bash
   docker-compose exec backend python data_listener.py
   ```

5. **Access the application**
   - Frontend: http://localhost:8001
   - User docs: http://localhost:8001/docs/
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/nodes` | GET | List all sensor nodes |
| `/nodes/{device_eui}/latest` | GET | Get latest telemetry for a node |
| `/telemetry` | GET | Query telemetry history (supports filtering) |
| `/alert-preferences` | POST | Create alert preference |
| `/alert-preferences` | GET | List current user’s preferences |
| `/alert-preferences/{id}` | PUT | Update alert preference |

### Example API Calls

```bash
# Get all nodes
curl http://localhost:8000/nodes

# Get latest data for a specific node
curl http://localhost:8000/nodes/00c1ea6e/latest

# Get telemetry with filters
curl "http://localhost:8000/telemetry?device_eui=00c1ea6e&limit=100"
```

## Project Structure

```
Dashboard/
├── docker-compose.yml        # Docker container orchestration
├── backend/
│   ├── backend_api.py        # FastAPI REST API
│   ├── data_listener.py      # Live data ingestion service
│   ├── init_sqlite_db.py     # Database initialization script
│   ├── sqlite_schema.sql     # SQLite database schema
│   ├── requirements.txt      # Python dependencies
│   ├── clerk_public_key.pem
│   ├── Dockerfile
│   ├── alerts/
│   │  ├── engine.py             # AlertService logic
│   │  ├── worker.py             # Background email workers
│   │  ├── dispatch_email.py     # SMTP email sender
│   │  ├── cooldown.py           # Alert cooldown logic
│   └── lora.db                  # SQLite database (ignored)
├── frontend/
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Dashboard/    # Main dashboard layout
│   │   │   ├── Map/          # Leaflet map with markers
│   │   │   ├── Navbar/       # Navigation bar
│   │   │   └── NodeCardList/ # Node detail cards
│   │   └── types/            # TypeScript type definitions
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs-site/                # User documentation
│   └── docs/                 # How-to guides
```

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_sqlite_db.py
uvicorn backend_api:app --reload --port 8000
```

# Run the data listener
```bash
python data_listener.py
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Database Schema

### Tables

- **nodes**: Registered sensor nodes with metadata
- **gateways**: LoRa gateways that relay data
- **telemetry**: Time-series sensor readings (temperature, humidity, smoke detection, battery, GPS)

## Configuration

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `LIVE_URL` | External API for live LoRa telemetry | — |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `DB_NAME` | SQLite database filename | `lora.db` |
| `CLERK_JWT_ISSUER` | Clerk JWT issuer URL (required) | — |
| `ALERT_EMAIL` | SMTP sender email account | — |
| `ALERT_PASS` | SMTP sender password/app password | — |
| `ALERT_WORKERS` | Number of background email workers | `1` |
| `ALERT_POLL_SECONDS` | Queue polling interval | `1.0` |
| `ALERT_CLAIM_TTL_SECONDS` | Worker claim timeout (seconds) | `60` |
| `ALERT_PREF_COOLDOWN_SECONDS` | Per-preference cooldown window (seconds) | `300` |

Also requires `backend/clerk_public_key.pem` (Clerk JWT public key).

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | — |
| `VITE_DOCS_URL` | Docs URL in navbar | `/docs/` |
| `DOCS_PORT` | Docs dev server port (Vite proxy) | `4000` |

## License

See [LICENSE](frontend/LICENSE) for details.
