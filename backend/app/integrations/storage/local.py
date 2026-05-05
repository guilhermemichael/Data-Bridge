from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".json"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/csv",
    "application/json",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@dataclass(frozen=True)
class StoredFile:
    stored_filename: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    path: Path


class LocalStorage:
    def __init__(self, base_dir: str | None = None) -> None:
        self.base_dir = Path(base_dir or settings.upload_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_upload(self, file: UploadFile) -> StoredFile:
        original_name = Path(file.filename or "").name
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file extension.",
            )
        if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported MIME type.",
            )

        content = await file.read()
        size = len(content)
        if size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
        max_size = settings.max_upload_size_mb * 1024 * 1024
        if size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds {settings.max_upload_size_mb} MB.",
            )

        stored_filename = f"import_{uuid4().hex}{extension}"
        path = self.base_dir / stored_filename
        path.write_bytes(content)
        return StoredFile(
            stored_filename=stored_filename,
            original_filename=original_name,
            file_size_bytes=size,
            mime_type=file.content_type or "application/octet-stream",
            path=path,
        )

    def resolve(self, stored_filename: str) -> Path:
        candidate = (self.base_dir / Path(stored_filename).name).resolve()
        base = self.base_dir.resolve()
        if base not in candidate.parents and candidate != base:
            raise ValueError("Resolved file escapes upload directory.")
        return candidate
