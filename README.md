# LoRa Wildfire Alert Network Dashboard

A real-time monitoring dashboard for LoRa-based wildfire detection sensor nodes. This system collects telemetry data from distributed sensor nodes and displays it on an interactive map with detailed node information.

## Features

- **Real-time Data Ingestion**: Continuously fetches sensor data from LoRa nodes via the live API
- **Interactive Map**: Visualize node locations with color-coded markers indicating status
  - 🟢 Green: Normal operation
  - 🟠 Orange: Low battery warning
  - 🔴 Red: Smoke detected
- **Node Details**: View detailed telemetry including temperature, humidity, battery level, and smoke detection status
- **PostgreSQL + PostGIS**: Geospatial database for efficient location-based queries

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LoRa Nodes    │────▶│  LoRa Gateway   │────▶│  Data Listener  │
│   (Sensors)     │     │  (Chirpstask)   │     │  (Python)       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │◀────│  Backend API    │◀────│  PostgreSQL     │
│   (React/Vite)  │     │  (FastAPI)      │     │  (PostGIS)      │
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
   
   Create a `.env` file in the root directory:
   ```env
   POSTGRES_DB=
   POSTGRES_USER=
   POSTGRES_PASSWORD=
   DB_DSN=
   ALLOWED_ORIGINS=
   LIVE_URL=
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
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/nodes` | GET | List all sensor nodes |
| `/nodes/{node_id}/latest` | GET | Get latest telemetry for a node |
| `/telemetry` | GET | Query telemetry history (supports filtering) |

### Example API Calls

```bash
# Get all nodes
curl http://localhost:8000/nodes

# Get latest data for a specific node
curl http://localhost:8000/nodes/00c1ea6e/latest

# Get telemetry with filters
curl "http://localhost:8000/telemetry?node_id=00c1ea6e&limit=100"
```

## Project Structure

```
Dashboard/
├── docker-compose.yml        # Docker container orchestration
├── .env                      # Environment variables
├── backend/
│   ├── backend_api.py        # FastAPI REST API
│   ├── data_listener.py      # Live data ingestion service
│   ├── lora_schema.sql       # Database schema
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
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
```

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the API server
uvicorn backend_api:app --reload --port 8000

# Run the data listener
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

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_DSN` | PostgreSQL connection string | - |
| `LIVE_URL` | External API for live sensor data | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `POSTGRES_DB` | Database name | - |
| `POSTGRES_USER` | Database user | - |
| `POSTGRES_PASSWORD` | Database password | - |

## License

See [LICENSE](frontend/LICENSE) for details.
