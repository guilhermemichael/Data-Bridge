from datetime import datetime

from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str | None = None


class ReportPublic(BaseModel):
    id: str
    dataset_id: str
    generated_by: str
    title: str
    file_path: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
