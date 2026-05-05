from datetime import datetime

from pydantic import BaseModel, Field


class DatasetCreate(BaseModel):
    organization_id: str
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    domain_type: str = "GENERIC"


class DatasetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    domain_type: str | None = None
    status: str | None = None


class DatasetPublic(BaseModel):
    id: str
    organization_id: str
    name: str
    description: str | None
    domain_type: str
    status: str
    row_count: int
    health_score: float
    last_imported_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
