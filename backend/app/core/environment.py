from app.core.config import settings


def is_production() -> bool:
    return settings.app_env == "production"


def is_development() -> bool:
    return settings.app_env == "development"


def is_test() -> bool:
    return settings.app_env == "test"
