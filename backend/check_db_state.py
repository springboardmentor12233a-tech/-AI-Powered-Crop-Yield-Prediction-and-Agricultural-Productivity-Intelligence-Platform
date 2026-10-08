import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def connect():
    return psycopg2.connect(
        host=os.getenv("YIELDSENSE_DB_HOST", "localhost"),
        dbname=os.getenv("YIELDSENSE_DB_NAME", "yieldsense"),
        user=os.getenv("YIELDSENSE_DB_USER", "postgres"),
        password=os.getenv("YIELDSENSE_DB_PASSWORD", ""),
        port=os.getenv("YIELDSENSE_DB_PORT", "5432"),
    )


conn = connect()
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
print("TABLES", [row[0] for row in cur.fetchall()])
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position")
user_columns = [row[0] for row in cur.fetchall()]
print("USERS_COLUMNS", user_columns)
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='predictions' ORDER BY ordinal_position")
prediction_columns = [row[0] for row in cur.fetchall()]
print("PREDICTIONS_COLUMNS", prediction_columns)
print("HAS_USER_ID", "user_id" in prediction_columns)
cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
print("USER_ROLES", cur.fetchall())
conn.close()
