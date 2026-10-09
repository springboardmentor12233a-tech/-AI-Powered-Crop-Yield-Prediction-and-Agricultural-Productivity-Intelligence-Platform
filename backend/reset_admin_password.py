import os
import sys
from getpass import getpass

from dotenv import load_dotenv

from database import db_cursor, get_user_by_email
from passwords import hash_password

load_dotenv()

def reset_admin_password():
    email = os.getenv("YIELDSENSE_ADMIN_EMAIL") or input("Existing admin email: ")
    email = email.strip().lower()
    if not email:
        raise ValueError("An admin email is required.")

    user = get_user_by_email(email)
    if not user or user.get("role") != "admin":
        raise ValueError("No admin account exists for the supplied email.")
    if not user.get("is_active"):
        raise ValueError("The admin account is inactive; password reset was not performed.")

    configured_password = os.getenv("YIELDSENSE_ADMIN_PASSWORD")
    password = configured_password or getpass("New admin password (12+ characters): ")
    confirmation = (
        password
        if configured_password
        else getpass("Confirm new admin password: ")
    )
    if len(password) < 12:
        raise ValueError("The new password must contain at least 12 characters.")
    if password != confirmation:
        raise ValueError("Password confirmation does not match.")

    password_hash = hash_password(password)
    with db_cursor() as cursor:
        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s AND role = 'admin' AND is_active = TRUE
            """,
            (password_hash, str(user["id"])),
        )
        if cursor.rowcount != 1:
            raise RuntimeError("The active admin account changed; password reset was not performed.")

    print("ADMIN_PASSWORD_RESET")


if __name__ == "__main__":
    try:
        reset_admin_password()
    except (ValueError, RuntimeError) as exc:
        print(f"ADMIN_PASSWORD_RESET_ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
