# How to Understand Node Cards

Each node in the Node List is shown as a card. Cards can be collapsed or expanded.

## Card Layout

- **Status icon** — indicates the node's current condition (see below)
- **Device EUI** — unique identifier for the sensor
- **Subscribe / Unsubscribe button** — visible when the card is expanded (requires Subscribe permission)

## Status Icons

Node cards show four status icons (the map uses the same four colors — see [Use the map](use-the-map.md)):

| Icon | Meaning |
|------|---------|
| Fire (red) | Smoke detected |
| Triangle warning (orange) | Low humidity (below 15%) or high temperature (above 35°C) |
| Battery (yellow) | Low battery (below 20%) |
| Check (green) | Normal status |

## Collapsed View

Shows the status icon and Device EUI. Click the card to expand it.

## Expanded View

Shows full sensor data and the subscribe button:

- **Temperature** — in °C
- **Smoke Detected?** — Yes or No
- **Humidity** — in %
- **Battery Level** — in %
- **Subscribe / Unsubscribe** button — click to toggle your subscription to this node

## Subscribing from a Card

1. Click a card to expand it
2. Click **Subscribe** to subscribe, or **Unsubscribe** to remove the subscription

The Subscribe button only appears if your org role has the **Subscribe to nodes** permission. See [Subscribe to Nodes](subscribe-to-nodes.md) for details.

## Expanding and Collapsing

- **From the list**: click any node card to expand or collapse it. Multiple cards can be expanded at once
- **From the map**: clicking a marker expands that card and collapses all others. Clicking the same marker again collapses it
- **Node Details panel**: when you expand a card or click a marker, the left panel shows current and historical data for that node
