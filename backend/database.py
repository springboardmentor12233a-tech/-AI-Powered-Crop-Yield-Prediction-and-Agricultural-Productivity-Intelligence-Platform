import os
from dotenv import load_dotenv
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import Json, RealDictCursor

load_dotenv()


def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url, sslmode="require")

    return psycopg2.connect(
        host=os.getenv("YIELDSENSE_DB_HOST", "localhost"),
        database=os.getenv("YIELDSENSE_DB_NAME", "yieldsense"),
        user=os.getenv("YIELDSENSE_DB_USER", "postgres"),
        password=os.getenv("YIELDSENSE_DB_PASSWORD", ""),
        port=os.getenv("YIELDSENSE_DB_PORT", "5432"),
    )


def _connection():
    return get_connection()


@contextmanager
def db_cursor():
    connection = _connection()
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def ensure_schema():
    with db_cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('farmer', 'admin')),
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                prediction_id UUID PRIMARY KEY,
                crop TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT,
                season TEXT NOT NULL,
                year INTEGER NOT NULL,
                predicted_yield DOUBLE PRECISION NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                context JSONB NOT NULL DEFAULT '{}'::jsonb
            )
            """
        )

        cursor.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_state TEXT"
        )
        cursor.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_district TEXT"
        )

        cursor.execute(
            "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS user_id UUID"
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_predictions_user_id
            ON predictions (user_id)
            """
        )


def create_user(user_record):
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
            VALUES (%(id)s, %(name)s, %(email)s, %(password_hash)s, %(role)s, %(is_active)s, NOW())
            RETURNING id, name, email, role, is_active, created_at,
                      location_state, location_district
            """,
            user_record,
        )
        return dict(cursor.fetchone())


def get_user_by_email(email):
    with db_cursor() as cursor:
        cursor.execute(
            """SELECT id, name, email, password_hash, role, is_active, created_at,
                      location_state, location_district
               FROM users WHERE email = %s""",
            (email.lower(),),
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    with db_cursor() as cursor:
        cursor.execute(
            """SELECT id, name, email, password_hash, role, is_active, created_at,
                      location_state, location_district
               FROM users WHERE id = %s""",
            (str(user_id),),
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def list_users():
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
        )
        return [dict(row) for row in cursor.fetchall()]


def insert_prediction(record):
    record = {**record, "context": Json(record.get("context", {}))}
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO predictions
                (prediction_id, user_id, crop, state, district, season, year, predicted_yield, context)
            VALUES (%(prediction_id)s, %(user_id)s, %(crop)s, %(state)s, %(district)s, %(season)s,
                    %(year)s, %(predicted_yield)s, %(context)s)
            RETURNING prediction_id, user_id, crop, state, district, season, year, predicted_yield, created_at, context
            """,
            record,
        )
        prediction = dict(cursor.fetchone())
        if record.get("user_id"):
            cursor.execute(
                """
                UPDATE users
                SET location_state = %(state)s,
                    location_district = %(district)s
                WHERE id = %(user_id)s
                """,
                record,
            )
        return prediction


def fetch_predictions(filters=None):
    filters = filters or {}
    clauses = []
    values = []
    for column in ("crop", "state", "season"):
        if filters.get(column):
            clauses.append(f"{column} = %s")
            values.append(filters[column])
    if filters.get("year"):
        clauses.append("year = %s")
        values.append(int(filters["year"]))
    if filters.get("user_id"):
        clauses.append("user_id = %s")
        values.append(str(filters["user_id"]))
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with db_cursor() as cursor:
        cursor.execute(
            f"SELECT prediction_id, user_id, crop, state, district, season, year, predicted_yield, created_at, context FROM predictions {where} ORDER BY created_at DESC",
            values,
        )
        return [dict(row) for row in cursor.fetchall()]


def fetch_user_counts():
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (WHERE role = 'farmer') AS total_farmers,
                COUNT(*) FILTER (WHERE role = 'farmer' AND is_active) AS active_farmers
            FROM users
            """
        )
        return dict(cursor.fetchone())


def fetch_analytics_options(user_id=None):
    where = "WHERE user_id = %s" if user_id is not None else ""
    values = (str(user_id),) if user_id is not None else ()
    with db_cursor() as cursor:
        cursor.execute(
            f"""
            SELECT
                ARRAY(
                    SELECT DISTINCT crop
                    FROM predictions
                    {where}
                    ORDER BY crop
                ) AS crops,

                ARRAY(
                    SELECT DISTINCT state
                    FROM predictions
                    {where}
                    ORDER BY state
                ) AS states,

                ARRAY(
                    SELECT DISTINCT season
                    FROM predictions
                    {where}
                    ORDER BY season
                ) AS seasons,

                ARRAY(
                    SELECT DISTINCT year
                    FROM predictions
                    {where}
                    ORDER BY year DESC
                ) AS years
            """,
            values * 4,
        )

        row = cursor.fetchone()

        return {
            "crops": row["crops"],
            "states": row["states"],
            "seasons": row["seasons"],
            "years": row["years"],
        }


def fetch_prediction(prediction_id):
    with db_cursor() as cursor:
        cursor.execute("SELECT * FROM predictions WHERE prediction_id = %s", (prediction_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


print("PostgreSQL connected successfully!")