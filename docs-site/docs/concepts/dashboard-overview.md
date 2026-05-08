# Dashboard Overview

The LoRa Wildfire Dashboard has four main areas: the alert panel, the map, the node list, and the left detail/alert panel.

## Layout

```
┌─────────────────┬────────────────────┬──────────────┐
│  Alert Count    │                    │              │
│─────────────────│       Map          │  Node List   │
│  Node Details   │                    │  (+ Filter)  │
│  or             │                    │              │
│  Recent Alerts  │                    │              │
└─────────────────┴────────────────────┴──────────────┘
```

On mobile the panels stack vertically.

## Alert Count (top-left)

Always visible. Shows the number of **unacknowledged alerts** across all nodes in the system.

## Left Detail Panel

The left panel changes depending on whether a node is selected:

- **No node selected** — shows the **Recent Alerts** list: all recent system alerts with type, message, timestamp, and an Acknowledge button for your subscribed nodes
- **Node selected** — shows **Node Details**: current sensor readings, node-specific alerts, and the last 50 historical readings

## Map

Shows the locations of your **subscribed nodes** as color-coded markers. See [Use the Map](../how-to/use-the-map.md) for marker colors and interactions.

## Node List

Shows all nodes (or a filtered subset). Use it to browse nodes, subscribe, and expand cards for full readings. The filter icon (funnel) opens the filter panel. See [Filter Nodes](../how-to/filter-nodes.md).

## Data Refresh

Node data and alerts refresh every 3 seconds automatically. Historical data refreshes every 30 seconds. Subscriptions refresh every 30 seconds.

## Access Restriction

If your organization role does not have the **View nodes & telemetry** permission, the dashboard shows an "Access Restricted" message instead of node data. Contact your org admin to request access.
