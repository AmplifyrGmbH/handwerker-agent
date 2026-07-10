from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://agentuser:agentpass2024@localhost:5432/handwerkerdb"

    APIFY_API_TOKEN: str = ""

    GEMINI_API_KEY: str = ""

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "website-agent-bilder"
    R2_PUBLIC_URL: str = ""

    INSTANTLY_KEY: str = ""
    INSTANTLY_CAMPAIGN_ID: str = ""

    LANDING_DOMAIN: str = "ihr-ki-agent.ch"
    CHAT_API_URL: str = "https://handwerker-api.amplifyr-digital.ch/api/v1/chat/message"

    INSTANTLY_DRY_RUN: bool = False

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()
