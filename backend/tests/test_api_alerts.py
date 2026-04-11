import sqlite3
import time
import pytest


def _open(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _insert_alert(db_path, dev_eui, alert_type="FIRE_RISK",
                  message="test alert", created_at=None, acknowledged=0):
    ts = created_at or int(time.time())
    conn = _open(db_path)
    cur = conn.execute(
        "INSERT INTO alerts (dev_eui, alert_type, message, created_at, acknowledged) "
        "VALUES (?, ?, ?, ?, ?)",
        (dev_eui, alert_type, message, ts, acknowledged),
    )
    conn.commit()
    aid = cur.lastrowid
    conn.close()
    return aid


def _insert_pref(db_path, user_id, dev_eui,
                 enabled=1, temp_over_c=None, battery_below_pct=None,
                 smoke_detected=None):
    ts = int(time.time())
    conn = _open(db_path)
    cur = conn.execute(
        """
        INSERT INTO alert_preferences
          (user_id, dev_eui, enabled, temp_over_c, battery_below_pct,
           smoke_detected, last_sent_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
        """,
        (user_id, dev_eui, enabled, temp_over_c, battery_below_pct,
         smoke_detected, ts, ts),
    )
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return pid


def _insert_node(db_path, device_eui):
    conn = _open(db_path)
    conn.execute("INSERT OR IGNORE INTO gateways (gateway_id) VALUES ('GW002')")
    conn.execute(
        "INSERT OR IGNORE INTO nodes (device_eui, node_id, last_seen, gateway_id) "
        "VALUES (?, NULL, NULL, 'GW002')",
        (device_eui,),
    )
    conn.commit()
    conn.close()


DEV_EUI = "AABBCCDD00000001"
OTHER_DEV_EUI = "AABBCCDD00000099"
USER_ID = "test_user_123"
OTHER_USER = "other_user_456"


class TestGetAlerts:

    def test_returns_empty_list_when_no_alerts(self, api_client):
        client, db_path = api_client
        resp = client.get("/alerts")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_alert_for_subscribed_node(self, api_client):
        client, db_path = api_client
        aid = _insert_alert(db_path, DEV_EUI, message="smoke!")
        resp = client.get("/alerts")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == aid
        assert data[0]["dev_eui"] == DEV_EUI

    def test_does_not_return_alerts_for_unsubscribed_node(self, api_client):
        client, db_path = api_client
        _insert_node(db_path, OTHER_DEV_EUI)
        _insert_alert(db_path, OTHER_DEV_EUI)
        resp = client.get("/alerts")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_filter_by_dev_eui(self, api_client):
        client, db_path = api_client
        aid = _insert_alert(db_path, DEV_EUI, message="this one")
        resp = client.get(f"/alerts?dev_eui={DEV_EUI}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == aid

    def test_filter_by_dev_eui_nonexistent_returns_empty(self, api_client):
        client, db_path = api_client
        _insert_alert(db_path, DEV_EUI)
        resp = client.get("/alerts?dev_eui=ZZZZZZZZ")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_filter_acknowledged_true(self, api_client):
        client, db_path = api_client
        _insert_alert(db_path, DEV_EUI, acknowledged=0)
        aid_ack = _insert_alert(db_path, DEV_EUI, acknowledged=1)
        resp = client.get("/alerts?acknowledged=true")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == aid_ack

    def test_filter_acknowledged_false(self, api_client):
        client, db_path = api_client
        aid_unack = _insert_alert(db_path, DEV_EUI, acknowledged=0)
        _insert_alert(db_path, DEV_EUI, acknowledged=1)
        resp = client.get("/alerts?acknowledged=false")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == aid_unack

    def test_returns_multiple_alerts_ordered_newest_first(self, api_client):
        client, db_path = api_client
        id1 = _insert_alert(db_path, DEV_EUI, created_at=1_000_000)
        id2 = _insert_alert(db_path, DEV_EUI, created_at=2_000_000)
        resp = client.get("/alerts")
        assert resp.status_code == 200
        data = resp.json()
        ids = [d["id"] for d in data]
        assert ids.index(id2) < ids.index(id1)


class TestAcknowledgeAlert:

    def test_404_when_alert_does_not_exist(self, api_client):
        client, db_path = api_client
        resp = client.put("/alerts/99999/ack")
        assert resp.status_code == 404

    def test_404_when_user_not_subscribed_to_node(self, api_client):
        client, db_path = api_client
        _insert_node(db_path, OTHER_DEV_EUI)
        aid = _insert_alert(db_path, OTHER_DEV_EUI)
        resp = client.put(f"/alerts/{aid}/ack")
        assert resp.status_code == 404

    def test_200_and_marks_acknowledged(self, api_client):
        client, db_path = api_client
        aid = _insert_alert(db_path, DEV_EUI, acknowledged=0)
        resp = client.put(f"/alerts/{aid}/ack")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["id"] == aid

        conn = _open(db_path)
        row = conn.execute(
            "SELECT acknowledged FROM alerts WHERE id=?", (aid,)
        ).fetchone()
        conn.close()
        assert row["acknowledged"] == 1

    def test_ack_sets_acknowledged_at(self, api_client):
        client, db_path = api_client
        before = int(time.time())
        aid = _insert_alert(db_path, DEV_EUI)
        client.put(f"/alerts/{aid}/ack")
        after = int(time.time())

        conn = _open(db_path)
        row = conn.execute(
            "SELECT acknowledged_at FROM alerts WHERE id=?", (aid,)
        ).fetchone()
        conn.close()
        assert before <= row["acknowledged_at"] <= after


class TestCreateAlertPreference:

    def test_422_when_no_condition_set(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "enabled": True,
        })
        assert resp.status_code == 422

    def test_404_when_node_does_not_exist(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": "NONEXISTENT",
            "smoke_detected": True,
        })
        assert resp.status_code == 404

    def test_400_when_preference_already_exists(self, api_client):
        client, db_path = api_client
        _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "smoke_detected": True,
        })
        assert resp.status_code == 400

    def test_201_with_smoke_detected(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "smoke_detected": True,
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["dev_eui"] == DEV_EUI
        assert body["smoke_detected"] == 1
        assert body["user_id"] == USER_ID

    def test_201_with_temp_over_c(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "temp_over_c": 60.0,
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["temp_over_c"] == 60.0
        assert body["battery_below_pct"] is None

    def test_201_with_battery_below_pct(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "battery_below_pct": 15.0,
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["battery_below_pct"] == 15.0

    def test_enabled_defaults_to_true(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "smoke_detected": True,
        })
        assert resp.status_code == 201
        assert resp.json()["enabled"] == 1

    def test_smoke_detected_false_stored_as_zero(self, api_client):
        client, db_path = api_client
        resp = client.post("/alert-preferences", json={
            "dev_eui": DEV_EUI,
            "smoke_detected": False,
        })
        assert resp.status_code == 201
        assert resp.json()["smoke_detected"] == 0


class TestListAlertPreferences:

    def test_returns_empty_list_when_none(self, api_client):
        client, db_path = api_client
        resp = client.get("/alert-preferences")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_created_preference(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        resp = client.get("/alert-preferences")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == pid
        assert data[0]["dev_eui"] == DEV_EUI

    def test_only_returns_own_preferences(self, api_client):
        client, db_path = api_client
        conn = _open(db_path)
        conn.execute(
            "INSERT OR IGNORE INTO users (auth_sub, email, created_at) "
            "VALUES (?, 'other@example.com', 999999)",
            (OTHER_USER,),
        )
        conn.commit()
        conn.close()
        _insert_pref(db_path, OTHER_USER, DEV_EUI, smoke_detected=1)
        own_pid = _insert_pref(db_path, USER_ID, DEV_EUI, temp_over_c=70.0)

        resp = client.get("/alert-preferences")
        assert resp.status_code == 200
        data = resp.json()
        ids = [d["id"] for d in data]
        assert own_pid in ids
        assert all(d["user_id"] == USER_ID for d in data)


class TestUpdateAlertPreference:

    def test_404_when_not_found(self, api_client):
        client, db_path = api_client
        resp = client.put("/alert-preferences/99999", json={"enabled": False})
        assert resp.status_code == 404

    def test_404_when_wrong_user(self, api_client):
        client, db_path = api_client
        conn = _open(db_path)
        conn.execute(
            "INSERT OR IGNORE INTO users (auth_sub, email, created_at) "
            "VALUES (?, 'other@example.com', 999999)",
            (OTHER_USER,),
        )
        conn.commit()
        conn.close()
        pid = _insert_pref(db_path, OTHER_USER, DEV_EUI, smoke_detected=1)
        resp = client.put(f"/alert-preferences/{pid}", json={"enabled": False})
        assert resp.status_code == 404

    def test_422_when_no_fields_provided(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        resp = client.put(f"/alert-preferences/{pid}", json={})
        assert resp.status_code == 422

    def test_200_disable_preference(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, enabled=1, smoke_detected=1)
        resp = client.put(f"/alert-preferences/{pid}", json={"enabled": False})
        assert resp.status_code == 200
        body = resp.json()
        assert body["enabled"] == 0
        assert body["id"] == pid

    def test_200_update_temp_threshold(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, temp_over_c=60.0)
        resp = client.put(f"/alert-preferences/{pid}", json={"temp_over_c": 75.0})
        assert resp.status_code == 200
        assert resp.json()["temp_over_c"] == 75.0

    def test_200_set_smoke_detected_to_null(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        resp = client.put(f"/alert-preferences/{pid}", json={"smoke_detected": None})
        assert resp.status_code == 200
        assert resp.json()["smoke_detected"] is None

    def test_update_battery_below_pct(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, battery_below_pct=30.0)
        resp = client.put(f"/alert-preferences/{pid}", json={"battery_below_pct": 10.0})
        assert resp.status_code == 200
        assert resp.json()["battery_below_pct"] == 10.0


class TestDeleteAlertPreference:

    def test_404_when_not_found(self, api_client):
        client, db_path = api_client
        resp = client.delete("/alert-preferences/99999")
        assert resp.status_code == 404

    def test_404_when_wrong_user(self, api_client):
        client, db_path = api_client
        conn = _open(db_path)
        conn.execute(
            "INSERT OR IGNORE INTO users (auth_sub, email, created_at) "
            "VALUES (?, 'other@example.com', 999999)",
            (OTHER_USER,),
        )
        conn.commit()
        conn.close()
        pid = _insert_pref(db_path, OTHER_USER, DEV_EUI, smoke_detected=1)
        resp = client.delete(f"/alert-preferences/{pid}")
        assert resp.status_code == 404

    def test_204_on_success(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        resp = client.delete(f"/alert-preferences/{pid}")
        assert resp.status_code == 204

    def test_row_removed_from_db_after_delete(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        client.delete(f"/alert-preferences/{pid}")

        conn = _open(db_path)
        row = conn.execute(
            "SELECT id FROM alert_preferences WHERE id=?", (pid,)
        ).fetchone()
        conn.close()
        assert row is None

    def test_delete_then_get_returns_empty(self, api_client):
        client, db_path = api_client
        pid = _insert_pref(db_path, USER_ID, DEV_EUI, smoke_detected=1)
        client.delete(f"/alert-preferences/{pid}")
        resp = client.get("/alert-preferences")
        assert resp.json() == []
