import time

_last_alert_time = {}
COOLDOWN_SECONDS = 300  # 5 minutes


def can_send(node_id: str, alert_type: str) -> bool:
    key = f"{node_id}:{alert_type}"
    now = time.time()

    last = _last_alert_time.get(key)
    if last is None or (now - last) > COOLDOWN_SECONDS:
        _last_alert_time[key] = now
        return True

    return False
