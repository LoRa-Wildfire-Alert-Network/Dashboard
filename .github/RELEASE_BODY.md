## v0.2.0 — Alerts, RBAC, and UI Overhaul

Major feature release for the LoRa Wildfire Alert Network Dashboard.

### New Features

- **Role-based access controls** — Org admins can assign roles and configure per-member permissions for subscriptions and alert management
- **Alert types** — `SMOKE_DETECTED`, `HIGH_TEMP`, and `LOW_BATTERY` alerts with configurable thresholds
- **Alert acknowledgment** — Subscribed users can acknowledge active alerts; all users can view alerts
- **Node staleness alerts** — Auto-alert when a node stops reporting for 30+ minutes (24hr cooldown); auto-acknowledged when node resumes
- **Map marker clustering** — Nearby markers cluster at low zoom for readability
- **Dashboard alert panel** — Shows total unacknowledged count and a full alert list when no node is selected

### Changes

- Default to **dark mode**; full frontend UI/theme overhaul
- Subscribe checkbox replaced with **subscribe button**
- Node filter now applies to both the map and node card list
- Map markers visible by default; zoom adjusted on node selection
- Updated user documentation to reflect all new features

### Bug Fixes

- Alert timestamps displayed 1/21/1970 — now shows the correct date/time
- Infinite subscription fetch loop resolved
- Mobile map now requires two fingers to pan/zoom

### Security Updates

- `cryptography` 46.0.6 → 46.0.7
- `axios` 1.13.5 → 1.15.2
- `@clerk/clerk-react` 5.59.5 → 5.61.6
- `@clerk/shared` 3.43.2 → 3.47.5
- `vite` 7.1.12 → 7.3.2
- `postcss`, `@babel/plugin-transform-modules-systemjs`, `fast-uri`, `lodash`, `follow-redirects` — patch updates
