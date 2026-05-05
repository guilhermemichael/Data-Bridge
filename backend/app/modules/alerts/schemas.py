from datetime import datetime

from pydantic import BaseModel


class AlertPublic(BaseModel):
    id: str
    organization_id: str
    dataset_id: str | None
    type: str
    severity: str
    title: str
    message: str
    status: str
    metadata_payload: dict
    triggered_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}
