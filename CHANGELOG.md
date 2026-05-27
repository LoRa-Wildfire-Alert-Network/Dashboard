# Changelog

All notable changes to the LoRa Wildfire Dashboard are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-05-26

### Fixed

- **NodeCard double icon error** — when two alert conditions were simultaneously true, no icon would render; fixed in both `CardLongData` and `CardShortData`

### Security

- `idna` 3.11 → 3.15 (backend)
- `webpack-dev-server` 5.2.3 → 5.2.4 (docs-site)
- `qs` 6.14.2 → 6.15.2 (docs-site)
- `express` 4.22.1 → 4.22.2 (docs-site)
- `brace-expansion` 1.1.12 → 1.1.15 (frontend)
- `brace-expansion` 2.0.2 → 2.1.1 (frontend)
- `js-cookie` 3.0.5 → 3.0.7 (frontend)
- `@clerk/shared` 3.47.5 → 3.47.6 (frontend)

## [0.2.0] - 2026-05-12

### Added

- **Role-based access controls** — Org admins can assign roles and configure member permissions for subscriptions and alert management
- **Alert types** — `SMOKE_DETECTED`, `HIGH_TEMP`, and `LOW_BATTERY` alert types with configurable thresholds
- **Alert acknowledgment** — Subscribed users can acknowledge active alerts; non-subscribers can view but not acknowledge
- **Node staleness alerts** — Automatic alert when a node stops reporting for 30+ minutes; 24-hour cooldown per node; auto-acknowledged when node resumes reporting
- **Map marker clustering** — Nearby markers cluster at low zoom levels for readability
- **Alert count panel** — Dashboard shows total unacknowledged alert count
- **All-alerts panel** — Left panel shows all active alerts when no node is selected
- **Show Acknowledged toggle** — Filter to show or hide acknowledged alerts in alert lists
- **Frontend test suite** — Vitest + Testing Library tests for Dashboard, WildfireMap, Navbar, NodeCard, NodeCardList, NodeListPanel, NodeSubscriptionModal, NodeFilter, alert components, OrgPermissionsPage, AuthContext, and utilities
- **Backend test suite** — Pytest tests for alert engine, cooldown, dispatch, worker, and API alerts
- **CD pipeline** — Webhook-based continuous deployment
- **Email template** — Improved alert email formatting

### Changed

- **Dark mode default** — Application now defaults to dark mode
- **Frontend theme** — Full UI styling overhaul to match updated design system
- **User documentation** — Updated docs for alerts, acknowledgment, public visibility, subscribe flow, org permissions, node details, and dashboard overview; styling aligned with dashboard theme
- **Subscribe UI** — Node subscribe checkbox replaced with subscribe button
- **Node filter scope** — Filter now applies to both the map markers and the node card list
- **Map defaults** — Markers visible by default; zoom level increased slightly when a node is selected
- **Alert visibility** — Alerts are now visible to all users who can see a node (not just subscribers)
- **Alert engine** — Workers store alerts even when no users are subscribed to a node

### Fixed

- **Alert timestamp display** — Alert times were showing as 1/21/1970; now correctly displays the actual alert date and time
- **Infinite subscription fetch** — Resolved loop causing repeated subscription API calls
- **Single-finger map scroll** — Mobile map now requires two fingers to pan/zoom, preventing accidental map interaction while scrolling the page

### Security

- `cryptography` 46.0.6 → 46.0.7
- `axios` 1.13.5 → 1.15.2
- `@clerk/clerk-react` 5.59.5 → 5.61.6
- `@clerk/shared` 3.43.2 → 3.47.5
- `vite` 7.1.12 → 7.3.2
- `postcss` 8.5.6 → 8.5.14 (frontend & docs-site)
- `@babel/plugin-transform-modules-systemjs` → 7.29.4 (docs-site)
- `fast-uri` 3.1.0 → 3.1.2 (docs-site)
- `lodash` 4.17.23 → 4.18.1 (docs-site)
- `follow-redirects` 1.15.11 → 1.16.0 (frontend & docs-site)

## [0.1.1-alpha] - 2026-03-29

### Added

- **MIT license** — Added `LICENSE` file

### Changed

- **Docker image publishing** — Updated Dockerfiles and Docker Compose for publishing to GitHub Container Registry (GHCR)
- **README** — Added Docker package info

### Fixed

- **GHCR provenance** — Disabled provenance attestation to remove `unknown/unknown` from package page

### Security

- `cryptography` 46.0.5 → 46.0.6
- `requests` 2.32.5 → 2.33.0
- `pyjwt` 2.11.0 → 2.12.0
- `path-to-regexp` 0.1.12 → 0.1.13
- `brace-expansion` 1.1.12 → 1.1.13
- `picomatch` 2.3.1 → 2.3.2
- `flatted` 3.3.3 → 3.4.2

## [0.1.0-alpha] - 2026-03-9

### Added

- **Docker Compose setup** — Run backend, frontend, and docs with `docker compose up`
- **Example env files** — `backend/.env.example` and `frontend/.env.example` for local configuration
- **User documentation** — Docusaurus docs at `/docs/`:
  - Sign in and account setup
  - Subscribing to nodes
  - Alerts (default preferences, email notifications)
  - Filtering nodes (smoke, temp, humidity, battery)
  - Map usage and node details
  - Organizations and account management
  - Run with Docker guide
- **Alert system** — Default alert preferences when subscribing (smoke, temp > 70°C, battery < 20%)
- **Alert email** — Optional SMTP configuration for email notifications
- **Interactive map** — Leaflet map with color-coded node status (green/orange/yellow/red)
- **Node subscriptions** — Subscribe to nodes to track on map and receive alerts
- **Node filtering** — Filter by smoke, temperature, humidity, battery, subscription status
- **Organizations** — Create orgs, invite members, assign roles
- **Clerk authentication** — Sign in, 2FA, passkeys, account management

### Technical

- FastAPI backend with SQLite
- React + Vite frontend
- Vite proxy for docs in development

[Unreleased]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/compare/v0.1.1-alpha...v0.2.0
[0.1.1-alpha]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/compare/v0.1.0-alpha...v0.1.1-alpha
[0.1.0-alpha]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/releases/tag/v0.1.0-alpha
