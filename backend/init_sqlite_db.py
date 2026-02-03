import os
import sqlite3

HERE = os.path.abspath(os.path.dirname(__file__))
DB_NAME = os.getenv("DB_NAME", "lora.db")
DB_PATH = os.path.join(HERE, DB_NAME)
SCHEMA_PATH = os.path.join(HERE, "sqlite_schema.sql")

def main():
    os.makedirs(HERE, exist_ok=True)

    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Missing schema file: {SCHEMA_PATH}")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(schema_sql)
        conn.commit()
        print(f"SQLite DB created at: {DB_PATH}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
