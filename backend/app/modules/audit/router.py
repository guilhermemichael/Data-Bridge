from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.database.models import AuditLog, OrganizationMember, User
from app.modules.audit.schemas import AuditLogPublic

router = APIRouter()


@router.get("", response_model=list[AuditLogPublic])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AuditLog]:
    organization_ids = [
        membership.organization_id
        for membership in db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    ]
    if not organization_ids:
        return []
    return (
        db.query(AuditLog)
        .filter(AuditLog.organization_id.in_(organization_ids))
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
