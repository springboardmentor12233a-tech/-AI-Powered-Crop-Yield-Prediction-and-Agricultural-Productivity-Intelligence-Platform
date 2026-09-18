"""
YieldSense AI — Configuration
Loads settings from .env file using pydantic-settings.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    SECRET_KEY: str = "yieldsense-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./yieldsense.db"
    GROQ_API_KEY: str = ""
    DATASET_PATH: str = "../data/crop_yield.csv"
    MODEL_DIR: str = "./saved_models"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
