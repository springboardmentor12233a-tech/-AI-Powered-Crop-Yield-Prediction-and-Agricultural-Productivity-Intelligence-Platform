import os
from dotenv import load_dotenv
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import Json, RealDictCursor

load_dotenv()


def _connection():
    return psycopg2.connect(
        host=os.getenv("YIELDSENSE_DB_HOST", "localhost"),
        database=os.getenv("YIELDSENSE_DB_NAME", "yieldsense"),
        user=os.getenv("YIELDSENSE_DB_USER", "postgres"),
        password=os.getenv("YIELDSENSE_DB_PASSWORD", ""),
        port=os.getenv("YIELDSENSE_DB_PORT", "5432"),
    )


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


def insert_prediction(record):
    record = {**record, "context": Json(record.get("context", {}))}
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO predictions
                (prediction_id, crop, state, district, season, year, predicted_yield, context)
            VALUES (%(prediction_id)s, %(crop)s, %(state)s, %(district)s, %(season)s,
                    %(year)s, %(predicted_yield)s, %(context)s)
            RETURNING prediction_id, crop, state, district, season, year, predicted_yield, created_at, context
            """,
            record,
        )
        return dict(cursor.fetchone())


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
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with db_cursor() as cursor:
        cursor.execute(
            f"SELECT prediction_id, crop, state, district, season, year, predicted_yield, created_at, context FROM predictions {where} ORDER BY created_at DESC",
            values,
        )
        return [dict(row) for row in cursor.fetchall()]

def fetch_analytics_options():
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                ARRAY(
                    SELECT DISTINCT crop
                    FROM predictions
                    ORDER BY crop
                ) AS crops,

                ARRAY(
                    SELECT DISTINCT state
                    FROM predictions
                    ORDER BY state
                ) AS states,

                ARRAY(
                    SELECT DISTINCT season
                    FROM predictions
                    ORDER BY season
                ) AS seasons,

                ARRAY(
                    SELECT DISTINCT year
                    FROM predictions
                    ORDER BY year DESC
                ) AS years
            """
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