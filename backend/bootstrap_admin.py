import os
import sys
from getpass import getpass
from uuid import uuid4

from passlib.context import CryptContext
import psycopg2
from dotenv import load_dotenv

from database import ensure_schema

load_dotenv()

password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def get_admin_values():
    name = os.getenv("YIELDSENSE_ADMIN_NAME") or os.getenv("ADMIN_NAME")
    email = os.getenv("YIELDSENSE_ADMIN_EMAIL") or os.getenv("ADMIN_EMAIL")
    password = os.getenv("YIELDSENSE_ADMIN_PASSWORD") or os.getenv("ADMIN_PASSWORD")

    if not name:
        name = input("Admin name: ").strip()
    if not email:
        email = input("Admin email: ").strip().lower()
    if not password:
        password = getpass("Admin password: ")

    if not name or not email or not password:
        raise ValueError("Name, email, and password are required.")

    return name.strip(), email.strip().lower(), password


def get_connection():
    return psycopg2.connect(
        host=os.getenv("YIELDSENSE_DB_HOST", "localhost"),
        dbname=os.getenv("YIELDSENSE_DB_NAME", "yieldsense"),
        user=os.getenv("YIELDSENSE_DB_USER", "postgres"),
        password=os.getenv("YIELDSENSE_DB_PASSWORD", ""),
        port=os.getenv("YIELDSENSE_DB_PORT", "5432"),
    )


def ensure_admin_exists():
    ensure_schema()
    name, email, password = get_admin_values()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            if existing:
                print("ADMIN_ALREADY_EXISTS")
                return {"status": "exists", "email": email}

            password_hash = password_context.hash(password)
            user_id = str(uuid4())
            cur.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """,
                (user_id, name, email, password_hash, "admin", True),
            )
            conn.commit()
            print("ADMIN_CREATED")
            return {"status": "created", "email": email}


if __name__ == "__main__":
    try:
        ensure_admin_exists()
    except Exception as exc:  # pragma: no cover
        print(f"BOOTSTRAP_ERROR: {exc}")
        sys.exit(1)
