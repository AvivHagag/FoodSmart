from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Set

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    app_name: str = "FoodSmart API"
    api_v1_prefix: str = "/api/v1"
    mongo_uri: str = Field(alias="MONGO_URI")
    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_expire_days: int = 30
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = "gpt-4.1-mini"
    openai_detection_model: str = Field(
        default="gpt-4.1-nano",
        alias="OPENAI_DETECTION_MODEL",
    )
    r2_endpoint_url: str | None = Field(default=None, alias="R2_ENDPOINT_URL")
    r2_access_key_id: str | None = Field(default=None, alias="R2_ACCESS_KEY_ID")
    r2_secret_access_key: str | None = Field(
        default=None, alias="R2_SECRET_ACCESS_KEY"
    )
    r2_bucket_name: str | None = Field(default=None, alias="R2_BUCKET_NAME")
    r2_public_url: str = Field(default="", alias="R2_PUBLIC_URL")
    unsplash_access_key: str | None = Field(
        default=None, alias="UNSPLASH_ACCESS_KEY"
    )
    cors_origins: List[str] = ["*"]
    admin_emails_raw: str = Field(default="", alias="ADMIN_EMAILS")

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def admin_emails(self) -> Set[str]:
        return {
            email.strip().lower()
            for email in self.admin_emails_raw.split(",")
            if email.strip()
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
