import argparse
import os
import re
import sys
from uuid import uuid4

from dotenv import load_dotenv

from database import ensure_schema, get_connection
from passwords import hash_password

load_dotenv()

BOOTSTRAP_LOCK_ID = 7246013302472185001


class BootstrapConfigurationError(ValueError):
    pass


def get_admin_values():
    name = os.getenv("YIELDSENSE_ADMIN_NAME", "").strip()
    email = os.getenv("YIELDSENSE_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("YIELDSENSE_ADMIN_PASSWORD", "")

    missing = [
        variable
        for variable, value in (
            ("YIELDSENSE_ADMIN_NAME", name),
            ("YIELDSENSE_ADMIN_EMAIL", email),
            ("YIELDSENSE_ADMIN_PASSWORD", password),
        )
        if not value
    ]
    if missing:
        raise BootstrapConfigurationError(
            f"Required environment variables are missing: {', '.join(missing)}."
        )
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise BootstrapConfigurationError(
            "YIELDSENSE_ADMIN_EMAIL must be a valid email address."
        )
    if len(password) < 12:
        raise BootstrapConfigurationError(
            "YIELDSENSE_ADMIN_PASSWORD must contain at least 12 characters."
        )

    return name, email, password


def active_admin_count():
    if not os.getenv("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL must be set to use the production Admin bootstrap.")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = TRUE"
            )
            return cur.fetchone()[0]


def ensure_admin_exists():
    if not os.getenv("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL must be set to use the production Admin bootstrap.")

    ensure_schema()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_xact_lock(%s)", (BOOTSTRAP_LOCK_ID,))
            cur.execute(
                "SELECT 1 FROM users WHERE role = 'admin' AND is_active = TRUE LIMIT 1"
            )
            if cur.fetchone():
                return "ACTIVE_ADMIN_EXISTS"

            name, email, password = get_admin_values()
            cur.execute(
                "SELECT 1 FROM users WHERE LOWER(email) = %s LIMIT 1",
                (email,),
            )
            if cur.fetchone():
                return "EMAIL_ALREADY_IN_USE"

            password_hash = hash_password(password)
            cur.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
                VALUES (%s, %s, %s, %s, 'admin', TRUE, NOW())
                ON CONFLICT (email) DO NOTHING
                RETURNING id
                """,
                (str(uuid4()), name, email, password_hash),
            )
            if cur.fetchone() is None:
                return "EMAIL_ALREADY_IN_USE"

    return "ADMIN_CREATED"


def main():
    parser = argparse.ArgumentParser(description="Safely bootstrap the first active Admin.")
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Report whether an active Admin exists without reading credentials or changing data.",
    )
    args = parser.parse_args()

    try:
        if args.verify:
            count = active_admin_count()
            print("ACTIVE_ADMIN_EXISTS" if count else "NO_ACTIVE_ADMIN")
        else:
            print(ensure_admin_exists())
    except BootstrapConfigurationError as error:
        print(f"ADMIN_BOOTSTRAP_FAILED: {error}", file=sys.stderr)
        return 1
    except Exception as error:
        error_type = type(error).__name__
        print(f"ADMIN_BOOTSTRAP_FAILED ({error_type})", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
