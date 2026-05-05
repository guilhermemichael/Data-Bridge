from datetime import datetime

from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str | None = None


class ReportPublic(BaseModel):
    id: str
    organization_id: str
    dataset_id: str
    generated_by: str
    title: str
    file_path: str | None
    status: str
    error_message: str | None
    created_at: datetime
    finished_at: datetime | None

    model_config = {"from_attributes": True}
