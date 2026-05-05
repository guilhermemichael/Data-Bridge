from app.core.config import settings
from app.integrations.storage.local import LocalStorage


def get_upload_storage() -> LocalStorage:
    if settings.storage_backend != "local":
        raise ValueError(
            f"Unsupported storage backend: {settings.storage_backend}. "
            "Only 'local' is implemented in this portfolio version.",
        )
    return LocalStorage()
