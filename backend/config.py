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


# ============================================================
# GROQ CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)