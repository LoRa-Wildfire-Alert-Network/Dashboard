# Alerts

The dashboard can notify you when sensor conditions are met on nodes you subscribe to. Alerts are created automatically when you subscribe to a node.

## Alert Types

| Type | Trigger |
|------|---------|
| **SMOKE_DETECTED** | Smoke sensor fires on a subscribed node |
| **HIGH_TEMP** | Temperature exceeds 70°C on a subscribed node |
| **LOW_BATTERY** | Battery drops below 20% on a subscribed node |
| **FIRE_RISK** | General fire risk condition detected |

## How Alerts Work

When a subscribed node's sensor data meets one of the thresholds above, an alert is recorded in the system and an **email notification** is sent to the subscriber's email address.

Alerts appear in two places on the dashboard:

- **All Alerts panel** (top-left) — shows the count of unacknowledged alerts across the whole system
- **Recent Alerts list** (left panel, when no node is selected) — shows a scrollable list of all recent alerts
- **Node Details panel** (left panel, when a node is selected) — shows alerts for that specific node

## Viewing Alerts

All signed-in users can see alerts. You do not need to be subscribed to a node to see its alerts.

### Recent Alerts list

When no node is selected, the left panel shows a list of recent alerts. Each alert shows:

- **Node** — the Device EUI of the sensor
- **Type** — one of the alert types above
- **Message** — details about the alert
- **Timestamp** — when the alert was triggered

### Alerts in Node Details

When you select a node, its alerts appear in the **Node Details** panel below the current readings. The list shows only alerts for that node.

## Acknowledging Alerts

Only **subscribers** can acknowledge alerts. Acknowledging marks an alert as reviewed.

To acknowledge an alert:

1. Find the alert in the Recent Alerts list or in Node Details
2. Click the **Acknowledge** button next to the alert
3. The button turns green and shows **Acknowledged**

To un-acknowledge an alert, click **Acknowledged** again.

> Only alerts for nodes you are subscribed to show the Acknowledge button.

## Show / Hide Acknowledged Alerts

By default, acknowledged alerts are hidden. To show them:

1. Click the **Show Acknowledged** toggle (top-right of the alert list)
2. The toggle turns dark and shows **Showing Acknowledged** — all alerts including acknowledged ones are now visible

Click the toggle again to hide acknowledged alerts.

The toggle is available in both the Recent Alerts list and the Node Details alert section. The setting is shared between both views.

## Filter vs. Alerts

| Feature | Purpose |
|---------|---------|
| **Alerts** (this page) | Notifications triggered by sensor conditions on subscribed nodes. Stored in the dashboard and trigger email |
| **Filter panel "Alerts"** | Filters the Node List to *show* nodes matching conditions (smoke, temp, humidity). Does not send notifications |

Use the [filter panel](filter-nodes.md) to focus the node list. Use subscriptions to receive alert notifications.

## Email Notifications

When a subscribed node triggers an alert, an email is sent to the address on your account. Contact your administrator if you expect alerts but are not receiving email.
