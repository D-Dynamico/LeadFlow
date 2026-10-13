from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env vars listed in .env.example (WORKFLOWS.md, Setup)."""

    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow"
    test_database_url: str = "postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow_test"
    frontend_origin: str = "http://localhost:3000"
    seed_on_start: bool = False
    log_level: str = "info"


@lru_cache
def get_settings() -> Settings:
    return Settings()
