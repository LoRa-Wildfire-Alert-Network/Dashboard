import os
import sqlite3
import pytest
from unittest.mock import patch

SCHEMA_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), "..", "sqlite_schema.sql"
)


def _apply_schema(conn: sqlite3.Connection) -> None:
    with open(SCHEMA_PATH) as f:
        sql = f.read()
    conn.executescript(sql)
    conn.commit()


def _seed(conn: sqlite3.Connection) -> None:
    conn.execute("INSERT OR IGNORE INTO gateways (gateway_id) VALUES ('GW001')")
    conn.execute(
        "INSERT OR IGNORE INTO nodes (device_eui, node_id, last_seen, gateway_id) "
        "VALUES ('AABBCCDD00000001', NULL, NULL, 'GW001')"
    )
    conn.execute(
        "INSERT OR IGNORE INTO users (auth_sub, email, created_at) "
        "VALUES ('test_user_123', 'test@example.com', 1000000)"
    )
    conn.execute(
        "INSERT OR IGNORE INTO user_node_subscriptions (user_id, device_eui) "
        "VALUES ('test_user_123', 'AABBCCDD00000001')"
    )
    conn.commit()


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    _apply_schema(conn)
    _seed(conn)
    yield conn
    conn.close()


@pytest.fixture
def seeded_db(db_conn):
    return db_conn


@pytest.fixture
def file_db(tmp_path):
    db_path = str(tmp_path / "test_lora.db")
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    _apply_schema(conn)
    _seed(conn)
    conn.close()
    return db_path


@pytest.fixture
def api_client(tmp_path):
    db_path = str(tmp_path / "api_test.db")
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    _apply_schema(conn)
    _seed(conn)
    conn.close()

    with patch("backend_api.DB_PATH", db_path):
        import backend_api
        from fastapi.testclient import TestClient

        original_overrides = dict(backend_api.app.dependency_overrides)

        backend_api.app.dependency_overrides[
            backend_api.get_clerk_user_id
        ] = lambda: "test_user_123"

        client = TestClient(backend_api.app, raise_server_exceptions=True)

        yield client, db_path

        backend_api.app.dependency_overrides.clear()
        backend_api.app.dependency_overrides.update(original_overrides)
