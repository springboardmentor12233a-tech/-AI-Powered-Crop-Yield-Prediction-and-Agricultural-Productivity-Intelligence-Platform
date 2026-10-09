import os
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "ICRISAT_District_Level_Data.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "backend",
    "models",
    "agri_yield_xgboost.joblib"
)

METADATA_PATH = os.path.join(
    BASE_DIR,
    "backend",
    "models",
    "model_metadata.json"
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "backend",
    "data"
)
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, "users.json")
PREDICTIONS_FILE = os.path.join(DATA_DIR, "predictions.json")
ADMIN_OPERATIONS_FILE = os.path.join(DATA_DIR, "admin_operations.json")


# ============================================================
# GROQ CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
)

# ============================================================
# JWT AUTHENTICATION CONFIGURATION
# ============================================================

JWT_SECRET = os.getenv("JWT_SECRET", "agriyield_ai_jwt_secret_key_2026_super_secure")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
