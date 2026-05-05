from datetime import datetime

from pydantic import BaseModel


class ImportJobPublic(BaseModel):
    id: str
    dataset_id: str
    original_filename: str
    stored_filename: str
    file_size_bytes: int
    mime_type: str
    status: str
    error_message: str | None
    total_rows: int
    valid_rows: int
    invalid_rows: int
    health_score: float
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
