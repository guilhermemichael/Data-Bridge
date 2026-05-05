from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.utils import slugify
from app.database.models import Organization, OrganizationMember, User
from app.modules.auth.password import hash_password, verify_password
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.modules.auth.tokens import create_access_token
from app.services.audit_service import record_audit

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    organization_name = payload.organization_name or f"{payload.full_name}'s Workspace"
    organization = Organization(
        name=organization_name,
        slug=slugify(organization_name),
    )
    db.add(organization)
    db.flush()

    db.add(
        OrganizationMember(
            user_id=user.id,
            organization_id=organization.id,
            role="OWNER",
        )
    )
    record_audit(
        db,
        action="USER_REGISTERED",
        entity_type="user",
        entity_id=user.id,
        organization_id=organization.id,
        user_id=user.id,
    )
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    record_audit(
        db,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
    )
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
