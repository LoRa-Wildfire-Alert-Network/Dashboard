# LoRa Dashboard — Frontend

React + TypeScript frontend for the LoRa Wildfire Monitoring Network. Displays live node telemetry, a map of subscribed nodes, and an alert feed with acknowledgment support.

## Stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **Tailwind CSS v4**
- **Clerk** (authentication)
- **Leaflet / React-Leaflet** (map)
- **Font Awesome** (icons)

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

This also starts the docs site on the port defined by `DOCS_PORT`. To skip it:

```bash
npm run dev:only
```

## Environment Variables

| Variable                     | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `VITE_API_URL`               | Backend base URL (default: `http://localhost:8000`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key — required for auth           |
| `VITE_DOCS_URL`              | Path or URL the navbar docs link points to          |
| `DOCS_PORT`                  | Port the docs dev server runs on (default: `4000`)  |

## Scripts

| Script               | What it does                               |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Vite dev server + docs site                |
| `npm run dev:only`   | Vite dev server only                       |
| `npm run dev:docker` | Build docs then serve on `0.0.0.0:8001`    |
| `npm run build`      | TypeScript check + Vite build + docs build |
| `npm run lint`       | ESLint                                     |
| `npm run lint:fix`   | ESLint with auto-fix                       |

## Project Structure

```
src/
├── Components/
│   ├── Alerts/          # AlertAckButton, ShowAckedButton
│   ├── Dashboard/       # Main layout, data fetching, polling
│   ├── Navbar/
│   ├── NodeDetails/     # Per-node telemetry, alerts, history
│   ├── NodeFilter/      # Filter controls for the node list
│   ├── NodeListPanel/   # Node list + filter state
│   ├── NodeSubscriptionModal/
│   ├── OrgSettings/     # Role/permission management (org admins)
│   └── WildfireMap/     # Leaflet map with node markers
├── providers/           # Clerk auth context, RBAC helpers
└── types/               # Shared TypeScript types
```

## Docker

For Docker deployments use `npm run dev:docker` or let the root `docker-compose.yml` handle it. The app is served at port `8001` by default.

_This README was generated with Claude AI_
