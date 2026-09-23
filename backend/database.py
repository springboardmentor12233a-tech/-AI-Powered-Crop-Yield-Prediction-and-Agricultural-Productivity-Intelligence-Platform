import os
import json
import sqlite3
import uuid
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "CropCast")

SQLITE_DB_FILE = os.path.join(os.path.dirname(__file__), "cropcast.db")

# Detect if MongoDB is actually available
use_mongo = False
mongo_client = None
mongo_db = None

if MONGODB_URL and not MONGODB_URL.startswith("mongodb+srv://YOUR_USERNAME"):
    try:
        mongo_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[DATABASE_NAME]
        use_mongo = True
        print("[Database] Connected successfully to MongoDB.")
    except Exception as e:
        print(f"[Database] MongoDB unavailable ({e}). Falling back to persistent SQLite.")
        use_mongo = False
else:
    print("[Database] Using persistent SQLite database (instant local zero-config).")


def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'farmer',
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agricultural_records (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            farm_name TEXT,
            state TEXT NOT NULL,
            crop TEXT NOT NULL,
            season TEXT NOT NULL,
            area REAL NOT NULL,
            rainfall REAL NOT NULL,
            temperature REAL NOT NULL,
            fertilizer REAL,
            pesticide REAL,
            yield_per_hectare REAL NOT NULL,
            total_production REAL NOT NULL,
            risk_level TEXT,
            notes TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_sqlite_db()


def check_database_connection():
    if use_mongo:
        try:
            mongo_client.admin.command("ping")
            return True
        except Exception:
            return False
    else:
        try:
            conn = sqlite3.connect(SQLITE_DB_FILE)
            conn.execute("SELECT 1")
            conn.close()
            return True
        except Exception:
            return False


# User DB operations
def get_user_by_email(email: str):
    email = email.strip().lower()
    if use_mongo:
        user = mongo_db["users"].find_one({"email": email})
        if user:
            user["id"] = str(user.get("_id", user.get("id")))
            return user
        return None
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None


def get_user_by_id(user_id: str):
    if use_mongo:
        user = mongo_db["users"].find_one({"id": user_id})
        if user:
            user["id"] = str(user.get("_id", user.get("id")))
            return user
        return None
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None


def create_user(email: str, full_name: str, hashed_password: str, role: str = "farmer"):
    email = email.strip().lower()
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    if use_mongo:
        mongo_db["users"].insert_one({
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "role": role,
            "created_at": created_at
        })
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (id, email, full_name, hashed_password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, email, full_name, hashed_password, role, created_at))
        conn.commit()
        conn.close()

    return {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "created_at": created_at
    }


# Agricultural Records CRUD operations
def create_agricultural_record(user_id: str, record_data: dict):
    rec_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    data = {
        "id": rec_id,
        "user_id": user_id,
        "farm_name": record_data.get("farm_name") or "Primary Farm",
        "state": record_data["state"],
        "crop": record_data["crop"],
        "season": record_data["season"],
        "area": float(record_data["area"]),
        "rainfall": float(record_data["rainfall"]),
        "temperature": float(record_data["temperature"]),
        "fertilizer": float(record_data.get("fertilizer") or 100.0),
        "pesticide": float(record_data.get("pesticide") or 1.0),
        "yield_per_hectare": float(record_data["yield_per_hectare"]),
        "total_production": float(record_data["total_production"]),
        "risk_level": record_data.get("risk_level", "Low"),
        "notes": record_data.get("notes", ""),
        "created_at": created_at
    }

    if use_mongo:
        mongo_db["agricultural_records"].insert_one(dict(data))
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO agricultural_records 
            (id, user_id, farm_name, state, crop, season, area, rainfall, temperature, fertilizer, pesticide, yield_per_hectare, total_production, risk_level, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["id"], data["user_id"], data["farm_name"], data["state"], data["crop"], data["season"],
            data["area"], data["rainfall"], data["temperature"], data["fertilizer"], data["pesticide"],
            data["yield_per_hectare"], data["total_production"], data["risk_level"], data["notes"], data["created_at"]
        ))
        conn.commit()
        conn.close()

    return data


def get_agricultural_records(user_id: str = None):
    if use_mongo:
        query = {"user_id": user_id} if user_id else {}
        records = list(mongo_db["agricultural_records"].find(query).sort("created_at", -1))
        for r in records:
            r["id"] = str(r.get("_id", r.get("id")))
            r.pop("_id", None)
        return records
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        if user_id:
            cursor.execute("SELECT * FROM agricultural_records WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        else:
            cursor.execute("SELECT * FROM agricultural_records ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]


def delete_agricultural_record(record_id: str, user_id: str = None):
    if use_mongo:
        query = {"id": record_id}
        if user_id:
            query["user_id"] = user_id
        res = mongo_db["agricultural_records"].delete_one(query)
        return res.deleted_count > 0
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        if user_id:
            cursor.execute("DELETE FROM agricultural_records WHERE id = ? AND user_id = ?", (record_id, user_id))
        else:
            cursor.execute("DELETE FROM agricultural_records WHERE id = ?", (record_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted