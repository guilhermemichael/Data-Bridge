from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.core.utils import slugify
from app.database.models import Organization, OrganizationMember, User
from app.modules.organizations.schemas import (
    OrganizationCreate,
    OrganizationMemberPublic,
    OrganizationPublic,
    OrganizationUpdate,
)
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


@router.patch("/{organization_id}", response_model=OrganizationPublic)
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    require_organization_member(
        db,
        current_user,
        organization_id,
        roles={"OWNER", "ADMIN"},
    )
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    organization.name = payload.name
    organization.slug = slugify(payload.name)
    record_audit(
        db,
        action="ORGANIZATION_UPDATED",
        entity_type="organization",
        entity_id=organization.id,
        organization_id=organization.id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(organization)
    return organization


@router.get(
    "/{organization_id}/members",
    response_model=list[OrganizationMemberPublic],
)
def list_organization_members(
    organization_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrganizationMemberPublic]:
    require_organization_member(db, current_user, organization_id)
    rows = (
        db.query(OrganizationMember, User)
        .join(User, OrganizationMember.user_id == User.id)
        .filter(OrganizationMember.organization_id == organization_id)
        .order_by(OrganizationMember.created_at.asc())
        .all()
    )
    return [
        OrganizationMemberPublic(
            id=membership.id,
            organization_id=membership.organization_id,
            user_id=membership.user_id,
            role=membership.role,
            user_email=user.email,
            user_full_name=user.full_name,
            created_at=membership.created_at,
        )
        for membership, user in rows
    ]
