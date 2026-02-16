from .cooldown import can_send
from .dispatch_email import send_email_alert

# placeholder thresholds (tune later)
TEMP_C_THRESHOLD = -100.0

def process_row_for_alerts(row: dict):
    node_id = row.get("node_id")
    dev_eui = row.get("device_eui") or "unknown"
    temp_c = row.get("temperature_c")
    smoke = row.get("smoke_detected") 

    if not node_id:
        return

    # Example rule: smoke detected OR temp too high
    fire_risk = (smoke == 1) or (temp_c is not None and temp_c > TEMP_C_THRESHOLD)

    if not fire_risk:
        return

    # cooldown only affects notifications, not data ingestion
    if not can_send(node_id, "FIRE_RISK"):
        return

    msg = (
        f"FIRE RISK DETECTED\n"
        f"Device EUI: {dev_eui}\n"
        f"Session Addr: {node_id}\n"
        f"Temp(C): {temp_c}\n"
        f"Smoke: {smoke}\n"
)
    send_email_alert(msg)
