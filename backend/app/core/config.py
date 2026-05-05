from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Data-Bridge"
    app_env: str = "development"
    app_debug: bool = True
    auto_create_tables: bool = True

    api_v1_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+psycopg://databridge:databridge@localhost:5432/databridge"
    )
    redis_url: str = "redis://localhost:6379/0"
    celery_task_always_eager: bool = False

    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    cors_origins: list[str] = ["http://localhost:5173"]

    storage_backend: str = "local"
    upload_dir: str = "storage/uploads"
    report_dir: str = "storage/reports"
    max_upload_size_mb: int = 25

    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
