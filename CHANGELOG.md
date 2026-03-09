# Changelog

All notable changes to the LoRa Wildfire Dashboard are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/LoRa-Wildfire-Alert-Network/Dashboard/releases/tag/v0.1.0-alpha
