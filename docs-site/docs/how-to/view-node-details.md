# How to View Node Details

When you select a node (by clicking its card or map marker), the **Node Details** panel appears on the left. It shows current readings, alerts, and historical data for that node.

## Opening Node Details

1. **From the map**: Click a marker
2. **From the Node List**: Click a node card

The panel updates to show the selected node.

## Current Readings

The panel shows the latest sensor data:

| Field | Description |
|-------|-------------|
| **Temperature** | Current temperature in °C |
| **Humidity** | Relative humidity in % |
| **Battery Level** | Battery charge in % |
| **Smoke Detected** | Yes or No |
| **Latitude / Longitude** | GPS coordinates |
| **Altitude** | Elevation in meters |
| **RSSI** | Signal strength (Received Signal Strength Indicator) |
| **SNR** | Signal-to-noise ratio |
| **Gateway ID** | ID of the LoRa gateway that received the transmission |

## Alerts for This Node

Below the current readings, the panel shows **alerts for this node**. Each alert shows its type (SMOKE_DETECTED, HIGH_TEMP, LOW_BATTERY, FIRE_RISK), message, and timestamp.

- Use the **Show Acknowledged** toggle to show or hide acknowledged alerts
- If you are subscribed to this node, an **Acknowledge** button appears on each alert

See [Alerts](alerts.md) for full details on alert types and acknowledgment.

## Historical Data

Below alerts, the panel shows the **last 50 telemetry entries** for the node:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the reading was taken |
| **Temperature** | °C |
| **Humidity** | % |
| **Battery Level** | % |
| **Smoke Detected** | Yes or No |

Use this to see trends over time (rising temperature, dropping battery, etc.).

## Data Refresh

Current readings and alerts refresh every few seconds. Historical data refreshes every 30 seconds.
