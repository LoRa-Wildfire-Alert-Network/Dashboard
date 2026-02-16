import time

_last = {}
COOLDOWN_SECONDS = 300

def can_send(node_id: str, alert_type: str) -> bool:
    key = f"{node_id}:{alert_type}"
    now = time.time()
    last = _last.get(key)

    if last is None or (now - last) > COOLDOWN_SECONDS:
        _last[key] = now
        return True

    return False
