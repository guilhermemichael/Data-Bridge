from sqlalchemy.orm import Session

from app.database.models import AuditLog


def record_audit(
    db: Session,
    *,
    action: str,
    entity_type: str,
    organization_id: str | None = None,
    user_id: str | None = None,
    entity_id: str | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    log = AuditLog(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_payload=metadata or {},
    )
    db.add(log)
    return log
