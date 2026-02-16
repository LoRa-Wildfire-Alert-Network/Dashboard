from .cooldown import can_send
from .dispatch_email import send_email_alert

TEMP_C_THRESHOLD = 70.0


def process_row_for_alerts(row: dict) -> None:
    node_id = row.get("node_id")
    dev_eui = row.get("device_eui") or "unknown"
    temp_c = row.get("temperature_c")
    smoke = row.get("smoke_detected")  # 0/1

    if not node_id:
        return

    fire_risk = (smoke == 1) or (temp_c is not None and temp_c > TEMP_C_THRESHOLD)
    if not fire_risk:
        return

    if not can_send(dev_eui, "FIRE_RISK"):
        return

    msg = (
        "FIRE RISK DETECTED\n"
        f"Device EUI: {dev_eui}\n"
        f"Session Addr: {node_id}\n"
        f"Temp(C): {temp_c}\n"
        f"Smoke: {smoke}\n"
    )
    send_email_alert(msg)
