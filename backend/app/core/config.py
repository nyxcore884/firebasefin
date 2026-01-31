from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Financial AI Platform"
    API_V1_STR: str = "/api/v1"
    
    # Google Cloud / Firebase Config
    PROJECT_ID: str = os.environ.get("PROJECT_ID", "studio-9381016045-4d625")
    LOCATION: str = os.environ.get("LOCATION", "us-central1")
    BIGQUERY_DATASET: str = "sgp_analytics"
    
    # Google Cloud Credentials
    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    # Organization Constants
    SGG_ID: str = "SGG-001"
    SGP_ID: str = "SGP-001"
    
    # Models
    GEMINI_PRO_MODEL: str = "gemini-1.5-pro"
    GEMINI_FLASH_MODEL: str = "gemini-1.5-flash"
    GEMINI_FLASH_LITE_MODEL: str = "gemini-1.5-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
