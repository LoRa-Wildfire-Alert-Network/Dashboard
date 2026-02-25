# How to View Node Details

When you select a node (by clicking its card or map marker), the **Node Details** panel appears on the left. It shows current readings and historical data for that node.

## Opening Node Details

1. **From the map**: Click a marker
2. **From the Node List**: Click a node card

The panel updates to show the selected node. If nothing is selected, the panel is empty.

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

## Historical Data

Below the current readings, the panel shows the **last 50 telemetry entries** for that node. Each entry includes:

- **Timestamp** — When the reading was taken
- **Temperature** — °C
- **Humidity** — %
- **Battery Level** — %
- **Smoke Detected** — Yes or No

Use this to see trends over time (e.g., rising temperature or dropping battery).

## Data Refresh

Current readings refresh every few seconds. Historical data loads when you first select the node.
