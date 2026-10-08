import os
import json
import sqlite3
import uuid
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://lohithakodani_db_user:rKTu7uTGMT5y03cH@cropcast.rxtbzxt.mongodb.net/")
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
POSTGRES_URL = os.getenv("POSTGRES_URL", os.getenv("DATABASE_URL", ""))
use_postgres = False

if POSTGRES_URL and POSTGRES_URL.startswith("postgresql"):
    try:
        import psycopg2
        pg_conn = psycopg2.connect(POSTGRES_URL, connect_timeout=2)
        pg_conn.close()
        use_postgres = True
        print("[Database] Connected successfully to PostgreSQL DB Engine.")
    except Exception as e:
        print(f"[Database] PostgreSQL unavailable ({e}). Defaulting to persistent relational SQLite engine.")
        use_postgres = False


def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Core Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE,
            full_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'Farmer',
            created_at TEXT NOT NULL
        )
    """)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
    except Exception:
        pass

    # Farmer Linked Profile Table (Linked to users.id via Foreign Key)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farmer_profiles (
            user_id TEXT PRIMARY KEY,
            farm_name TEXT,
            region TEXT,
            soil_type TEXT,
            crop_preferences TEXT,
            farm_size_hectares REAL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Consultant Linked Profile Table (Linked to users.id via Foreign Key)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consultant_profiles (
            user_id TEXT PRIMARY KEY,
            expertise TEXT,
            regions_served TEXT,
            organization_name TEXT,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Agricultural Records Table (Linked to user_id)
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
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    return get_user_by_identifier(email)


def get_user_by_identifier(identifier: str):
    identifier = identifier.strip().lower()
    if use_mongo:
        user = mongo_db["users"].find_one({
            "$or": [
                {"email": identifier},
                {"username": identifier}
            ]
        })
        if user:
            user["id"] = str(user.get("_id", user.get("id")))
            return user
        return None
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM users 
            WHERE LOWER(email) = ? OR LOWER(username) = ?
        """, (identifier, identifier))
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


def update_user_password(user_id: str, new_hashed_password: str):
    if use_mongo:
        res = mongo_db["users"].update_one(
            {"id": user_id},
            {"$set": {"hashed_password": new_hashed_password}}
        )
        return res.modified_count > 0 or res.matched_count > 0
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (new_hashed_password, user_id))
        updated = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return updated




def create_user(email: str, full_name: str, hashed_password: str, role: str = "Farmer", username: str = None):
    email = email.strip().lower()
    if not username:
        username = email.split("@")[0].lower()
    else:
        username = username.strip().lower()
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    if use_mongo:
        mongo_db["users"].insert_one({
            "id": user_id,
            "email": email,
            "username": username,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "role": role,
            "created_at": created_at
        })
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (id, email, username, full_name, hashed_password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, username, full_name, hashed_password, role, created_at))
        conn.commit()
        conn.close()

    return {
        "id": user_id,
        "email": email,
        "username": username,
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


# Profile Management Operations (Linked via Foreign Key user_id)
# Profile Management Operations (Linked via Foreign Key user_id)
def get_farmer_profile(user_id: str):
    if use_mongo:
        profile = mongo_db["farmer_profiles"].find_one({"user_id": user_id})
        if profile:
            profile.pop("_id", None)
            return profile
        return {
            "user_id": user_id,
            "farm_name": "Green Valley Agriculture",
            "region": "Punjab",
            "soil_type": "Alluvial / Loamy",
            "crop_preferences": "Wheat, Rice, Maize",
            "farm_size_hectares": 50.0,
            "updated_at": datetime.utcnow().isoformat()
        }
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM farmer_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {
            "user_id": user_id,
            "farm_name": "Green Valley Agriculture",
            "region": "Punjab",
            "soil_type": "Alluvial / Loamy",
            "crop_preferences": "Wheat, Rice, Maize",
            "farm_size_hectares": 50.0,
            "updated_at": datetime.utcnow().isoformat()
        }


def save_farmer_profile(user_id: str, profile_data: dict):
    updated_at = datetime.utcnow().isoformat()
    data = {
        "user_id": user_id,
        "farm_name": profile_data.get("farm_name", "Green Valley Agriculture"),
        "region": profile_data.get("region", "Punjab"),
        "soil_type": profile_data.get("soil_type", "Alluvial / Loamy"),
        "crop_preferences": profile_data.get("crop_preferences", "Wheat, Rice"),
        "farm_size_hectares": float(profile_data.get("farm_size_hectares") or 50.0),
        "updated_at": updated_at
    }
    if use_mongo:
        mongo_db["farmer_profiles"].replace_one({"user_id": user_id}, data, upsert=True)
        return get_farmer_profile(user_id)
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO farmer_profiles (user_id, farm_name, region, soil_type, crop_preferences, farm_size_hectares, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                farm_name=excluded.farm_name,
                region=excluded.region,
                soil_type=excluded.soil_type,
                crop_preferences=excluded.crop_preferences,
                farm_size_hectares=excluded.farm_size_hectares,
                updated_at=excluded.updated_at
        """, (
            user_id,
            data["farm_name"],
            data["region"],
            data["soil_type"],
            data["crop_preferences"],
            data["farm_size_hectares"],
            updated_at
        ))
        conn.commit()
        conn.close()
        return get_farmer_profile(user_id)


def get_consultant_profile(user_id: str):
    if use_mongo:
        profile = mongo_db["consultant_profiles"].find_one({"user_id": user_id})
        if profile:
            profile.pop("_id", None)
            return profile
        return {
            "user_id": user_id,
            "expertise": "Agronomy, Soil Chemistry, Micro-Irrigation & Yield Optimization",
            "regions_served": "Punjab, Haryana, Uttar Pradesh",
            "organization_name": "CropCast AgTech Advisory Lead",
            "updated_at": datetime.utcnow().isoformat()
        }
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM consultant_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {
            "user_id": user_id,
            "expertise": "Agronomy, Soil Chemistry, Micro-Irrigation & Yield Optimization",
            "regions_served": "Punjab, Haryana, Uttar Pradesh",
            "organization_name": "CropCast AgTech Advisory Lead",
            "updated_at": datetime.utcnow().isoformat()
        }


def save_consultant_profile(user_id: str, profile_data: dict):
    updated_at = datetime.utcnow().isoformat()
    data = {
        "user_id": user_id,
        "expertise": profile_data.get("expertise", "Agronomy & Soil Chemistry"),
        "regions_served": profile_data.get("regions_served", "Punjab, Haryana"),
        "organization_name": profile_data.get("organization_name", "AgTech Advisory"),
        "updated_at": updated_at
    }
    if use_mongo:
        mongo_db["consultant_profiles"].replace_one({"user_id": user_id}, data, upsert=True)
        return get_consultant_profile(user_id)
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO consultant_profiles (user_id, expertise, regions_served, organization_name, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                expertise=excluded.expertise,
                regions_served=excluded.regions_served,
                organization_name=excluded.organization_name,
                updated_at=excluded.updated_at
        """, (
            user_id,
            data["expertise"],
            data["regions_served"],
            data["organization_name"],
            updated_at
        ))
        conn.commit()
        conn.close()
        return get_consultant_profile(user_id)


# Admin User Governance
def get_all_users_with_profiles():
    if use_mongo:
        users = list(mongo_db["users"].find().sort("created_at", -1))
        result = []
        for u in users:
            uid = u.get("id") or str(u.get("_id"))
            fp = mongo_db["farmer_profiles"].find_one({"user_id": uid}) or {}
            cp = mongo_db["consultant_profiles"].find_one({"user_id": uid}) or {}
            result.append({
                "id": uid,
                "email": u.get("email"),
                "username": u.get("username"),
                "full_name": u.get("full_name"),
                "role": u.get("role"),
                "created_at": u.get("created_at"),
                "farm_name": fp.get("farm_name"),
                "farmer_region": fp.get("region"),
                "soil_type": fp.get("soil_type"),
                "crop_preferences": fp.get("crop_preferences"),
                "farm_size_hectares": fp.get("farm_size_hectares"),
                "expertise": cp.get("expertise"),
                "consultant_regions": cp.get("regions_served"),
                "organization_name": cp.get("organization_name")
            })
        return result
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.username, u.full_name, u.role, u.created_at,
                   fp.farm_name, fp.region as farmer_region, fp.soil_type, fp.crop_preferences, fp.farm_size_hectares,
                   cp.expertise, cp.regions_served as consultant_regions, cp.organization_name
            FROM users u
            LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
            LEFT JOIN consultant_profiles cp ON u.id = cp.user_id
            ORDER BY u.created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]


def update_user_role(user_id: str, new_role: str):
    if use_mongo:
        res = mongo_db["users"].update_one({"id": user_id}, {"$set": {"role": new_role}})
        return res.modified_count > 0 or res.matched_count > 0
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        updated = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return updated


def delete_user_account(user_id: str):
    if use_mongo:
        res = mongo_db["users"].delete_one({"id": user_id})
        mongo_db["farmer_profiles"].delete_one({"user_id": user_id})
        mongo_db["consultant_profiles"].delete_one({"user_id": user_id})
        mongo_db["agricultural_records"].delete_many({"user_id": user_id})
        return res.deleted_count > 0
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted