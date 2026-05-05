from datetime import datetime

from pydantic import BaseModel


class AlertPublic(BaseModel):
    id: str
    dataset_id: str
    type: str
    severity: str
    title: str
    message: str
    status: str
    triggered_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}
