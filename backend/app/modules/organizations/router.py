from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.core.utils import slugify
from app.database.models import Organization, OrganizationMember, User
from app.modules.organizations.schemas import (
    OrganizationCreate,
    OrganizationMemberCreate,
    OrganizationMemberPublic,
    OrganizationMemberUpdate,
    OrganizationPublic,
    OrganizationUpdate,
)
from app.services.audit_service import record_audit

router = APIRouter()


def _organization_or_404(db: Session, organization_id: str) -> Organization:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return organization


def _member_with_user_or_404(
    db: Session,
    organization_id: str,
    member_id: str,
) -> tuple[OrganizationMember, User]:
    row = (
        db.query(OrganizationMember, User)
        .join(User, OrganizationMember.user_id == User.id)
        .filter(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == organization_id,
        )
        .first()
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found.",
        )
    return row


def _member_public(
    membership: OrganizationMember,
    user: User,
) -> OrganizationMemberPublic:
    return OrganizationMemberPublic(
        id=membership.id,
        organization_id=membership.organization_id,
        user_id=membership.user_id,
        role=membership.role,
        user_email=user.email,
        user_full_name=user.full_name,
        created_at=membership.created_at,
    )


def _owner_count(db: Session, organization_id: str) -> int:
    return (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.role == "OWNER",
        )
        .count()
    )


def _ensure_owner_can_be_changed(
    db: Session,
    organization_id: str,
    membership: OrganizationMember,
) -> None:
    if membership.role == "OWNER" and _owner_count(db, organization_id) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The organization must keep at least one owner.",
        )


def _ensure_actor_can_manage_target_owner(
    actor_membership: OrganizationMember,
    target_membership: OrganizationMember | None = None,
    target_role: str | None = None,
) -> None:
    if actor_membership.role == "OWNER":
        return
    target_is_owner = (
        target_membership is not None and target_membership.role == "OWNER"
    )
    if target_role == "OWNER" or target_is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can manage owner memberships.",
        )


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
    return _organization_or_404(db, organization_id)


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
    organization = _organization_or_404(db, organization_id)
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
    return [_member_public(membership, user) for membership, user in rows]


@router.post(
    "/{organization_id}/members",
    response_model=OrganizationMemberPublic,
    status_code=status.HTTP_201_CREATED,
)
def add_organization_member(
    organization_id: str,
    payload: OrganizationMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationMemberPublic:
    actor_membership = require_organization_member(
        db,
        current_user,
        organization_id,
        roles={"OWNER", "ADMIN"},
    )
    _organization_or_404(db, organization_id)
    _ensure_actor_can_manage_target_owner(actor_membership, target_role=payload.role)

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    existing = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user.id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already belongs to this organization.",
        )

    membership = OrganizationMember(
        organization_id=organization_id,
        user_id=user.id,
        role=payload.role,
    )
    db.add(membership)
    db.flush()
    record_audit(
        db,
        action="ORGANIZATION_MEMBER_ADDED",
        entity_type="organization_member",
        entity_id=membership.id,
        organization_id=organization_id,
        user_id=current_user.id,
        metadata={"member_user_id": user.id, "role": payload.role},
    )
    db.commit()
    db.refresh(membership)
    return _member_public(membership, user)


@router.patch(
    "/{organization_id}/members/{member_id}",
    response_model=OrganizationMemberPublic,
)
def update_organization_member(
    organization_id: str,
    member_id: str,
    payload: OrganizationMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationMemberPublic:
    actor_membership = require_organization_member(
        db,
        current_user,
        organization_id,
        roles={"OWNER", "ADMIN"},
    )
    _organization_or_404(db, organization_id)
    membership, user = _member_with_user_or_404(db, organization_id, member_id)
    _ensure_actor_can_manage_target_owner(
        actor_membership,
        target_membership=membership,
        target_role=payload.role,
    )
    if membership.role == "OWNER" and payload.role != "OWNER":
        _ensure_owner_can_be_changed(db, organization_id, membership)

    membership.role = payload.role
    record_audit(
        db,
        action="ORGANIZATION_MEMBER_ROLE_UPDATED",
        entity_type="organization_member",
        entity_id=membership.id,
        organization_id=organization_id,
        user_id=current_user.id,
        metadata={"member_user_id": user.id, "role": payload.role},
    )
    db.commit()
    db.refresh(membership)
    return _member_public(membership, user)


@router.delete(
    "/{organization_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_organization_member(
    organization_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    actor_membership = require_organization_member(
        db,
        current_user,
        organization_id,
        roles={"OWNER", "ADMIN"},
    )
    _organization_or_404(db, organization_id)
    membership, user = _member_with_user_or_404(db, organization_id, member_id)
    if membership.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own membership.",
        )
    _ensure_actor_can_manage_target_owner(
        actor_membership,
        target_membership=membership,
    )
    _ensure_owner_can_be_changed(db, organization_id, membership)

    record_audit(
        db,
        action="ORGANIZATION_MEMBER_REMOVED",
        entity_type="organization_member",
        entity_id=membership.id,
        organization_id=organization_id,
        user_id=current_user.id,
        metadata={"member_user_id": user.id, "role": membership.role},
    )
    db.delete(membership)
    db.commit()
