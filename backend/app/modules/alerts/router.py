from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.core.utils import utcnow
from app.database.models import Alert, OrganizationMember, User
from app.modules.alerts.schemas import AlertPublic
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=list[AlertPublic])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Alert]:
    organization_ids = [
        membership.organization_id
        for membership in db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    ]
    if not organization_ids:
        return []
    return (
        db.query(Alert)
        .filter(Alert.organization_id.in_(organization_ids))
        .order_by(Alert.created_at.desc())
        .all()
    )


@router.patch("/{alert_id}/resolve", response_model=AlertPublic)
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found.",
        )
    organization_id = alert.organization_id
    require_organization_member(
        db,
        current_user,
        organization_id,
        roles={"OWNER", "ADMIN", "ANALYST"},
    )
    alert.status = "RESOLVED"
    alert.resolved_at = utcnow()
    record_audit(
        db,
        action="ALERT_RESOLVED",
        entity_type="alert",
        entity_id=alert.id,
        organization_id=organization_id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(alert)
    return alert
