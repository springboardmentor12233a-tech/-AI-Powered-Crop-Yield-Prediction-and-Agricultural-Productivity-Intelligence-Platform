import os
import sqlite3
import hashlib
import json
import uuid
from typing import Optional, Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "yieldsense.db")

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
    - users: Farmer and Admin authentication credentials, role, status, location details
    - farms: Farmer farm metadata (land size in Acres/Hectares, soil type, irrigation method)
    - predictions: Historical crop yield predictions and reports scoped by user_id
    - recommendations: Historical crop suitability analyses scoped by user_id
    - llm_configurations: Admin-managed LLM providers (Gemini, OpenAI, Grok/xAI)
    - chat_messages: Contextual conversations with the Agricultural AI Assistant
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
        role TEXT DEFAULT 'farmer',
        is_active INTEGER DEFAULT 1,
        phone TEXT DEFAULT '',
        village TEXT DEFAULT '',
        district TEXT DEFAULT '',
        state TEXT DEFAULT '',
        onboarding_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Check if role or is_active columns exist in users (for migrations)
    cursor.execute("PRAGMA table_info(users);")
    columns = [col[1] for col in cursor.fetchall()]
    if "role" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'farmer';")
    if "is_active" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;")
    
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
    
    # 4. Crop Recommendation History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recommended_crop TEXT NOT NULL,
        confidence REAL NOT NULL,
        confidence_pct TEXT NOT NULL,
        temperature_c REAL NOT NULL,
        humidity_pct REAL NOT NULL,
        soil_ph REAL NOT NULL,
        rainfall_mm REAL NOT NULL,
        top_candidates_json TEXT NOT NULL,
        soil_analysis_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)
    
    # 5. LLM Configurations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS llm_configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT UNIQUE NOT NULL,
        model_name TEXT NOT NULL,
        api_key TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 6. Chat History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        context_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)
    
    # Seed default Admin account if not existing
    admin_pwd_hash = hash_password("admin123")
    cursor.execute("SELECT id FROM users WHERE email = 'admin@yieldsense.ai';")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role, is_active, phone, state, onboarding_completed) VALUES (?, ?, ?, 'admin', 1, '1800-AGRI-ADMIN', 'National Admin Center', 1);",
            ("admin@yieldsense.ai", admin_pwd_hash, "System Administrator")
        )
    
    # Seed default Gemini and OpenAI provider rows (inactive by default if no key)
    cursor.execute("SELECT id FROM llm_configurations WHERE provider = 'gemini';")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO llm_configurations (provider, model_name, api_key, is_active) VALUES ('gemini', 'gemini-1.5-flash', '', 1);"
        )
    cursor.execute("SELECT id FROM llm_configurations WHERE provider = 'openai';")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO llm_configurations (provider, model_name, api_key, is_active) VALUES ('openai', 'gpt-4o-mini', '', 0);"
        )
    cursor.execute("SELECT id FROM llm_configurations WHERE provider = 'xai';")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO llm_configurations (provider, model_name, api_key, is_active) VALUES ('xai', 'grok-beta', '', 0);"
        )
        
    conn.commit()
    conn.close()
    print("YieldSense AI Database Initialized Successfully with Milestone 3 Schema.")

def hash_password(password: str) -> str:
    """Computes a SHA-256 hash for secure user password storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_user(email: str, password: str, full_name: str, role: str = "farmer", phone: str = "", village: str = "", district: str = "", state: str = "") -> Dict[str, Any]:
    """
    Registers a new user account (farmer or admin) and creates an initial farm profile entry.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role, phone, village, district, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
            (email.lower().strip(), pwd_hash, full_name.strip(), role, phone.strip(), village.strip(), district.strip(), state.strip())
        )
        user_id = cursor.lastrowid
        
        # Create default associated farm profile
        cursor.execute(
            "INSERT INTO farms (user_id, field_name, land_size, land_unit, soil_type, irrigation_method) VALUES (?, 'North Field', 4.5, 'Acres', 'Loam', 'Sprinkler');",
            (user_id,)
        )
        conn.commit()
        
        cursor.execute("SELECT id, email, full_name, role, is_active, phone, village, district, state, onboarding_completed FROM users WHERE id = ?;", (user_id,))
        user_row = dict(cursor.fetchone())
        return user_row
    except sqlite3.IntegrityError:
        raise ValueError("An account with this email address already exists.")
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticates a user by verifying email, password hash, and active status.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    cursor.execute("SELECT id, email, full_name, role, is_active, phone, village, district, state, onboarding_completed FROM users WHERE email = ? AND password_hash = ?;", (email.lower().strip(), pwd_hash))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        user = dict(row)
        if user.get("is_active") == 0:
            raise ValueError("This account has been deactivated by the system administrator.")
        return user
    return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetches user profile details by user ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, is_active, phone, village, district, state, onboarding_completed FROM users WHERE id = ?;", (user_id,))
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

# ----------------------------------------------------------------------------
# Prediction History Operations
# ----------------------------------------------------------------------------
def save_user_prediction(user_id: int, report_id: str, payload: dict, predicted_yield: float, insights: dict) -> Dict[str, Any]:
    """Saves a crop yield prediction result into the user's prediction history database table."""
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
        item["insights"] = json.loads(item["insights_json"]) if item.get("insights_json") else {}
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
        item["insights"] = json.loads(item["insights_json"]) if item.get("insights_json") else {}
        return item
    return None

# ----------------------------------------------------------------------------
# Crop Recommendation History Operations
# ----------------------------------------------------------------------------
def save_user_recommendation(user_id: int, recommended_crop: str, confidence: float, confidence_pct: str,
                             temp: float, humidity: float, ph: float, rainfall: float,
                             top_candidates: list, soil_analysis: dict) -> Dict[str, Any]:
    """Persists a crop suitability analysis result for the authenticated farmer."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO recommendations (
        user_id, recommended_crop, confidence, confidence_pct,
        temperature_c, humidity_pct, soil_ph, rainfall_mm,
        top_candidates_json, soil_analysis_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        user_id, recommended_crop, confidence, confidence_pct,
        temp, humidity, ph, rainfall,
        json.dumps(top_candidates), json.dumps(soil_analysis)
    ))
    rec_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM recommendations WHERE id = ?;", (rec_id,))
    row = dict(cursor.fetchone())
    conn.close()
    row["top_candidates"] = json.loads(row["top_candidates_json"])
    row["soil_analysis"] = json.loads(row["soil_analysis_json"])
    return row

def get_user_recommendation_history(user_id: int) -> List[Dict[str, Any]]:
    """Returns all saved crop recommendation analyses for a farmer."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC;", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        item = dict(r)
        item["top_candidates"] = json.loads(item["top_candidates_json"])
        item["soil_analysis"] = json.loads(item["soil_analysis_json"])
        results.append(item)
    return results

# ----------------------------------------------------------------------------
# Admin Management Operations
# ----------------------------------------------------------------------------
def get_all_farmers() -> List[Dict[str, Any]]:
    """Fetches all registered farmers for admin management with farm details."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.phone, u.village, u.district, u.state, u.created_at,
           f.field_name, f.land_size, f.land_unit, f.soil_type, f.irrigation_method,
           (SELECT COUNT(*) FROM predictions WHERE user_id = u.id) as prediction_count,
           (SELECT COUNT(*) FROM recommendations WHERE user_id = u.id) as recommendation_count
    FROM users u
    LEFT JOIN farms f ON u.id = f.user_id
    WHERE u.role = 'farmer'
    ORDER BY u.created_at DESC;
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def set_user_active_status(user_id: int, is_active: int) -> bool:
    """Enables or disables a farmer account (admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = ? WHERE id = ?;", (is_active, user_id))
    conn.commit()
    conn.close()
    return True

def get_admin_system_stats() -> Dict[str, Any]:
    """Computes high-level system statistics and activity summary for the Admin dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'farmer';")
    total_farmers = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'farmer' AND is_active = 1;")
    active_farmers = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM predictions;")
    total_predictions = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM recommendations;")
    total_recommendations = cursor.fetchone()[0]
    
    # Commonly forecasted crops
    cursor.execute("SELECT crop, COUNT(*) as cnt FROM predictions GROUP BY crop ORDER BY cnt DESC LIMIT 5;")
    top_forecasted_crops = [{"crop": r[0], "count": r[1]} for r in cursor.fetchall()]
    
    # Commonly recommended crops
    cursor.execute("SELECT recommended_crop, COUNT(*) as cnt FROM recommendations GROUP BY recommended_crop ORDER BY cnt DESC LIMIT 5;")
    top_recommended_crops = [{"crop": r[0], "count": r[1]} for r in cursor.fetchall()]
    
    # Recent platform activity
    cursor.execute("""
    SELECT p.id, p.report_id, p.crop, p.predicted_yield, p.created_at, u.full_name as farmer_name, u.email as farmer_email, 'yield_prediction' as activity_type
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC LIMIT 10;
    """)
    recent_activity = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "total_farmers": total_farmers,
        "active_farmers": active_farmers,
        "total_predictions": total_predictions,
        "total_recommendations": total_recommendations,
        "top_forecasted_crops": top_forecasted_crops,
        "top_recommended_crops": top_recommended_crops,
        "recent_activity": recent_activity
    }

# ----------------------------------------------------------------------------
# LLM Provider Configuration Operations
# ----------------------------------------------------------------------------
def get_llm_configs() -> List[Dict[str, Any]]:
    """Returns all LLM provider configs with masked API keys for secure UI display."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, provider, model_name, api_key, is_active, updated_at FROM llm_configurations;")
    rows = cursor.fetchall()
    conn.close()
    
    configs = []
    for r in rows:
        item = dict(r)
        raw_key = item.get("api_key", "")
        # Mask the key for display: e.g., "AIzaSy...****" or "sk-proj...****"
        if raw_key and len(raw_key) > 6:
            item["masked_key"] = raw_key[:4] + "*" * (len(raw_key) - 8) + raw_key[-4:]
            item["has_key"] = True
        elif raw_key:
            item["masked_key"] = "******"
            item["has_key"] = True
        else:
            item["masked_key"] = "Not Configured"
            item["has_key"] = False
        del item["api_key"]  # Never expose raw key in list endpoint
        configs.append(item)
    return configs

def get_active_llm_config() -> Optional[Dict[str, Any]]:
    """Retrieves the currently active LLM provider configuration with raw credentials."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, provider, model_name, api_key, is_active FROM llm_configurations WHERE is_active = 1 LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_llm_config(provider: str, model_name: str, api_key: Optional[str], is_active: bool) -> bool:
    """Updates or switches the active LLM provider configuration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # If is_active is set to True, deactivate others
    if is_active:
        cursor.execute("UPDATE llm_configurations SET is_active = 0;")
        
    if api_key is not None and api_key.strip() != "":
        cursor.execute("""
        INSERT INTO llm_configurations (provider, model_name, api_key, is_active, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(provider) DO UPDATE SET model_name=?, api_key=?, is_active=?, updated_at=CURRENT_TIMESTAMP;
        """, (provider.lower().strip(), model_name.strip(), api_key.strip(), 1 if is_active else 0,
              model_name.strip(), api_key.strip(), 1 if is_active else 0))
    else:
        cursor.execute("""
        UPDATE llm_configurations SET model_name=?, is_active=?, updated_at=CURRENT_TIMESTAMP
        WHERE provider=?;
        """, (model_name.strip(), 1 if is_active else 0, provider.lower().strip()))
        
    conn.commit()
    conn.close()
    return True

# ----------------------------------------------------------------------------
# Chat Message Operations
# ----------------------------------------------------------------------------
def save_chat_message(user_id: int, role: str, content: str, context: dict = None) -> Dict[str, Any]:
    """Persists a chat message in the conversation history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO chat_messages (user_id, role, content, context_json)
    VALUES (?, ?, ?, ?);
    """, (user_id, role, content, json.dumps(context or {})))
    msg_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM chat_messages WHERE id = ?;", (msg_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

def get_user_chat_history(user_id: int, limit: int = 30) -> List[Dict[str, Any]]:
    """Retrieves recent conversation messages for the farmer AI assistant."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, role, content, context_json, created_at
    FROM chat_messages
    WHERE user_id = ?
    ORDER BY created_at ASC LIMIT ?;
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_user_chat_history(user_id: int) -> bool:
    """Clears conversation history for the given farmer."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_messages WHERE user_id = ?;", (user_id,))
    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
