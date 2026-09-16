import os
import sqlite3
import hashlib
import json
import uuid
from typing import Optional, Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "data", "yieldsense.db")

def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns a thread-safe connection to the YieldSense SQLite database.
    Enforces foreign key constraints and row factory for dict-like row access.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """
    Initializes the SQLite database schema if tables do not already exist:
    - users: Farmer authentication credentials and location details
    - farms: Farmer farm metadata (land size in Acres/Hectares, soil type, irrigation method)
    - predictions: Historical crop yield predictions and reports scoped by user_id
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        village TEXT DEFAULT '',
        district TEXT DEFAULT '',
        state TEXT DEFAULT '',
        onboarding_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. Farm Profiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        field_name TEXT DEFAULT 'North Field',
        land_size REAL DEFAULT 4.5,
        land_unit TEXT DEFAULT 'Acres',
        soil_type TEXT DEFAULT 'Loam',
        irrigation_method TEXT DEFAULT 'Sprinkler',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)
    
    # 3. Prediction History & Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        report_id TEXT UNIQUE NOT NULL,
        crop TEXT NOT NULL,
        region TEXT NOT NULL,
        soil_type TEXT NOT NULL,
        soil_ph REAL NOT NULL,
        rainfall_mm REAL NOT NULL,
        temperature_c REAL NOT NULL,
        humidity_pct REAL NOT NULL,
        fertilizer_kg REAL NOT NULL,
        irrigation TEXT NOT NULL,
        pesticides_kg REAL NOT NULL,
        planting_density REAL NOT NULL,
        previous_crop TEXT NOT NULL,
        predicted_yield REAL NOT NULL,
        field_name TEXT DEFAULT '',
        insights_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()
    conn.close()
    print("YieldSense AI Database Initialized Successfully.")

def hash_password(password: str) -> str:
    """Computes a SHA-256 hash for secure user password storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_user(email: str, password: str, full_name: str, phone: str = "", village: str = "", district: str = "", state: str = "") -> Dict[str, Any]:
    """
    Registers a new farmer account and creates an initial farm profile entry.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, phone, village, district, state) VALUES (?, ?, ?, ?, ?, ?, ?);",
            (email.lower().strip(), pwd_hash, full_name.strip(), phone.strip(), village.strip(), district.strip(), state.strip())
        )
        user_id = cursor.lastrowid
        
        # Create default associated farm profile
        cursor.execute(
            "INSERT INTO farms (user_id, field_name, land_size, land_unit, soil_type, irrigation_method) VALUES (?, 'North Field', 4.5, 'Acres', 'Loam', 'Sprinkler');",
            (user_id,)
        )
        conn.commit()
        
        cursor.execute("SELECT id, email, full_name, phone, village, district, state, onboarding_completed FROM users WHERE id = ?;", (user_id,))
        user_row = dict(cursor.fetchone())
        return user_row
    except sqlite3.IntegrityError:
        raise ValueError("An account with this email address already exists.")
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticates a farmer by verifying email and password hash.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    cursor.execute("SELECT id, email, full_name, phone, village, district, state, onboarding_completed FROM users WHERE email = ? AND password_hash = ?;", (email.lower().strip(), pwd_hash))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetches user profile details by user ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, phone, village, district, state, onboarding_completed FROM users WHERE id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_profile(user_id: int, full_name: str, phone: str, village: str, district: str, state: str) -> Dict[str, Any]:
    """Updates farmer profile information."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET full_name = ?, phone = ?, village = ?, district = ?, state = ? WHERE id = ?;",
        (full_name.strip(), phone.strip(), village.strip(), district.strip(), state.strip(), user_id)
    )
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)

def complete_user_onboarding(user_id: int):
    """Marks onboarding wizard as completed for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET onboarding_completed = 1 WHERE id = ?;", (user_id,))
    conn.commit()
    conn.close()

def get_user_farm(user_id: int) -> Dict[str, Any]:
    """Fetches farm details associated with a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, field_name, land_size, land_unit, soil_type, irrigation_method FROM farms WHERE user_id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"field_name": "North Field", "land_size": 4.5, "land_unit": "Acres", "soil_type": "Loam", "irrigation_method": "Sprinkler"}

def update_user_farm(user_id: int, field_name: str, land_size: float, land_unit: str, soil_type: str, irrigation_method: str) -> Dict[str, Any]:
    """Updates farm details for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO farms (user_id, field_name, land_size, land_unit, soil_type, irrigation_method) VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET field_name=?, land_size=?, land_unit=?, soil_type=?, irrigation_method=?, updated_at=CURRENT_TIMESTAMP;",
        (user_id, field_name, land_size, land_unit, soil_type, irrigation_method, field_name, land_size, land_unit, soil_type, irrigation_method)
    )
    conn.commit()
    conn.close()
    return get_user_farm(user_id)

def save_user_prediction(user_id: int, report_id: str, payload: dict, predicted_yield: float, insights: dict) -> Dict[str, Any]:
    """
    Saves a crop yield prediction result into the user's prediction history database table.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    field_name = payload.get("plot_label") or payload.get("field_name") or "Main Plot"
    
    cursor.execute("""
    INSERT INTO predictions (
        user_id, report_id, crop, region, soil_type, soil_ph, rainfall_mm,
        temperature_c, humidity_pct, fertilizer_kg, irrigation, pesticides_kg,
        planting_density, previous_crop, predicted_yield, field_name, insights_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        user_id, report_id, payload["Crop"], payload["Region"], payload["Soil_Type"],
        payload["Soil_pH"], payload["Rainfall_mm"], payload["Temperature_C"],
        payload["Humidity_pct"], payload["Fertilizer_Used_kg"], payload["Irrigation"],
        payload["Pesticides_Used_kg"], payload["Planting_Density"], payload["Previous_Crop"],
        predicted_yield, field_name, json.dumps(insights)
    ))
    conn.commit()
    conn.close()
    return get_prediction_by_report_id(user_id, report_id)

def get_user_prediction_history(user_id: int) -> List[Dict[str, Any]]:
    """Returns all saved prediction records belonging to the authenticated user ordered by date descending."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC;", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        item = dict(r)
        item["insights"] = json.loads(item["insights_json"])
        results.append(item)
    return results

def get_prediction_by_report_id(user_id: int, report_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a specific prediction report owned by the authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions WHERE report_id = ? AND user_id = ?;", (report_id, user_id))
    row = cursor.fetchone()
    conn.close()
    if row:
        item = dict(row)
        item["insights"] = json.loads(item["insights_json"])
        return item
    return None

if __name__ == "__main__":
    init_db()
