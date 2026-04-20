import datetime

# ---------------------------------------------------------------------------
# Style constants — keeps f-string lines under 88 chars
# ---------------------------------------------------------------------------

_S_BODY = (
    "margin:0;padding:0;"
    "background-color:#f3f4f6;"
    "font-family:-apple-system,BlinkMacSystemFont,"
    "'Segoe UI',Roboto,sans-serif;"
)
_S_OUTER_TABLE = "background-color:#f3f4f6;padding:32px 16px;"
_S_INNER_TABLE = "max-width:560px;"
_S_HEADER_H1 = (
    "margin:0;color:#ffffff;font-size:22px;"
    "font-weight:700;letter-spacing:-0.3px;"
)
_S_BADGE_TD = (
    "background-color:#ffffff;"
    "padding:20px 32px 0 32px;"
    "text-align:center;"
)
_S_BODY_TD = (
    "background-color:#ffffff;"
    "padding:16px 32px 20px 32px;"
    "text-align:center;"
)
_S_BODY_P = "margin:0;color:#374151;font-size:15px;line-height:1.6;"
_S_DATA_OUTER_TD = "background-color:#ffffff;padding:0 32px 24px 32px;"
_S_DATA_TABLE = (
    "border:1px solid #e5e7eb;"
    "border-radius:6px;"
    "overflow:hidden;"
)
_S_FOOTER_P = "margin:0;color:#9ca3af;font-size:12px;line-height:1.5;"
_S_FOOTER_STRONG = "color:#6b7280;"
_S_LABEL_TD = (
    "padding:10px 16px;"
    "color:#6b7280;"
    "font-size:13px;"
    "white-space:nowrap;"
    "border-bottom:1px solid #f3f4f6;"
)
_S_VAL_TD = (
    "padding:10px 16px;"
    "font-size:13px;"
    "font-weight:600;"
    "border-bottom:1px solid #f3f4f6;"
)

# ---------------------------------------------------------------------------


def _parse_message(message: str) -> dict:
    """Extract key/value pairs from the plain-text alert message body."""
    result = {}
    for line in message.splitlines():
        if ": " in line:
            key, _, val = line.partition(": ")
            result[key.strip()] = val.strip()
    return result


def _alert_type_label(alert_type: str) -> str:
    labels = {
        "FIRE_RISK": "Fire Risk",
        "SMOKE_DETECTED": "Smoke Detected",
        "HIGH_TEMP": "High Temperature",
        "LOW_BATTERY": "Low Battery",
    }
    return labels.get(alert_type, alert_type.replace("_", " ").title())


def _alert_color(alert_type: str) -> str:
    if alert_type in ("FIRE_RISK", "SMOKE_DETECTED", "HIGH_TEMP"):
        return "#dc2626"  # red-600
    if alert_type == "LOW_BATTERY":
        return "#d97706"  # amber-600
    return "#2563eb"  # blue-600


def render_alert_email(
    dev_eui: str,
    alert_type: str,
    message: str,
) -> str:
    fields = _parse_message(message)
    label = _alert_type_label(alert_type)
    color = _alert_color(alert_type)
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%d %H:%M UTC"
    )

    smoke_raw = fields.get("Smoke", "0")
    smoke_display = "Yes" if smoke_raw in ("1", "True", "true") else "No"
    smoke_color = "#dc2626" if smoke_display == "Yes" else "#16a34a"

    temp_raw = fields.get("Temp(C)", "—")
    battery_raw = fields.get("Battery", "—")
    session_addr = fields.get("Session Addr", "—")

    rows = [
        ("Device EUI", dev_eui or "—"),
        ("Session Addr", session_addr),
        ("Temperature", f"{temp_raw} °C" if temp_raw != "—" else "—"),
        ("Battery", f"{battery_raw} %" if battery_raw != "—" else "—"),
        ("Smoke Detected", smoke_display, smoke_color),
        ("Timestamp", timestamp),
    ]

    # Dynamic styles that depend on runtime values
    header_td_style = (
        f"background-color:{color};"
        "border-radius:8px 8px 0 0;"
        "padding:28px 32px;"
        "text-align:center;"
    )
    badge_span_style = (
        "display:inline-block;"
        f"background-color:{color}1a;"
        f"color:{color};"
        f"border:1px solid {color}33;"
        "border-radius:999px;"
        "padding:4px 14px;"
        "font-size:12px;"
        "font-weight:700;"
        "letter-spacing:0.5px;"
        "text-transform:uppercase;"
    )
    footer_td_style = (
        "background-color:#f9fafb;"
        "border-top:1px solid #e5e7eb;"
        "border-radius:0 0 8px 8px;"
        "padding:16px 32px;"
        "text-align:center;"
    )

    def row_html(r):
        label_td = f'<td style="{_S_LABEL_TD}">{r[0]}</td>'
        val_color = r[2] if len(r) > 2 else "#111827"
        val_style = f"{_S_VAL_TD}color:{val_color};"
        val_td = f'<td style="{val_style}">{r[1]}</td>'
        return f"<tr>{label_td}{val_td}</tr>"

    table_rows = "\n".join(row_html(r) for r in rows)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LoRa Wildfire Alert</title>
</head>
<body style="{_S_BODY}">
  <table width="100%" cellpadding="0" cellspacing="0" style="{_S_OUTER_TABLE}">
    <tr>
      <td align="center">
        <table width="100%" style="{_S_INNER_TABLE}" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="{header_td_style}">
              <p style="margin:0 0 8px 0;font-size:26px;">🔥</p>
              <h1 style="{_S_HEADER_H1}">
                Wildfire Alert
              </h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                LoRa Wildfire Monitoring Network
              </p>
            </td>
          </tr>

          <!-- Alert type badge -->
          <tr>
            <td style="{_S_BADGE_TD}">
              <span style="{badge_span_style}">
                {label}
              </span>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td style="{_S_BODY_TD}">
              <p style="{_S_BODY_P}">
                A sensor on your network has triggered a
                <strong>{label}</strong> alert.
                Review the readings below and take action if needed.
              </p>
            </td>
          </tr>

          <!-- Data table -->
          <tr>
            <td style="{_S_DATA_OUTER_TD}">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="{_S_DATA_TABLE}">
                {table_rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="{footer_td_style}">
              <p style="{_S_FOOTER_P}">
                You received this alert because you are subscribed to node
                <strong style="{_S_FOOTER_STRONG}">{dev_eui}</strong>.<br>
                Manage your alert preferences in the LoRa Dashboard.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
