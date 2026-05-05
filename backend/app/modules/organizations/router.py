from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.core.utils import slugify
from app.database.models import Organization, OrganizationMember, User
from app.modules.organizations.schemas import OrganizationCreate, OrganizationPublic
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("", response_model=OrganizationPublic, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    organization = Organization(name=payload.name, slug=slugify(payload.name))
    db.add(organization)
    db.flush()
    db.add(
        OrganizationMember(
            user_id=current_user.id,
            organization_id=organization.id,
            role="OWNER",
        )
    )
    record_audit(
        db,
        action="ORGANIZATION_CREATED",
        entity_type="organization",
        entity_id=organization.id,
        organization_id=organization.id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(organization)
    return organization


@router.get("", response_model=list[OrganizationPublic])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Organization]:
    organization_ids = [
        row.organization_id
        for row in db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    ]
    if not organization_ids:
        return []
    return (
        db.query(Organization)
        .filter(Organization.id.in_(organization_ids))
        .order_by(Organization.created_at.desc())
        .all()
    )


@router.get("/{organization_id}", response_model=OrganizationPublic)
def get_organization(
    organization_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    require_organization_member(db, current_user, organization_id)
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return organization
