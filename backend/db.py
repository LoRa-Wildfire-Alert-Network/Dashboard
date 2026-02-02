import os
import sqlite3

HERE = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(HERE, "lora.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
