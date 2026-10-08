import os

from dotenv import load_dotenv

from database import get_connection

load_dotenv()


conn = get_connection()
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
