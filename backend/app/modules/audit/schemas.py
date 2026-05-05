from datetime import datetime

from pydantic import BaseModel


class AuditLogPublic(BaseModel):
    id: str
    organization_id: str | None
    user_id: str | None
    action: str
    entity_type: str
    entity_id: str | None
    metadata_payload: dict
    created_at: datetime

    model_config = {"from_attributes": True}
