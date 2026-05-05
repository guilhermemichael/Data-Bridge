from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.database.models import Dataset, OrganizationMember, User
from app.modules.datasets.schemas import DatasetCreate, DatasetPublic, DatasetUpdate
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("", response_model=DatasetPublic, status_code=status.HTTP_201_CREATED)
def create_dataset(
    payload: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dataset:
    require_organization_member(
        db,
        current_user,
        payload.organization_id,
        roles={"OWNER", "ADMIN", "ANALYST"},
    )
    dataset = Dataset(
        organization_id=payload.organization_id,
        name=payload.name,
        description=payload.description,
        domain_type=payload.domain_type.upper(),
        created_by=current_user.id,
    )
    db.add(dataset)
    db.flush()
    record_audit(
        db,
        action="DATASET_CREATED",
        entity_type="dataset",
        entity_id=dataset.id,
        organization_id=dataset.organization_id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("", response_model=list[DatasetPublic])
def list_datasets(
    organization_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Dataset]:
    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    )
    organization_ids = {membership.organization_id for membership in memberships}
    if organization_id is not None:
        require_organization_member(db, current_user, organization_id)
        organization_ids = {organization_id}
    if not organization_ids:
        return []
    return (
        db.query(Dataset)
        .filter(Dataset.organization_id.in_(organization_ids))
        .order_by(Dataset.created_at.desc())
        .all()
    )


@router.get("/{dataset_id}", response_model=DatasetPublic)
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    return dataset


@router.patch("/{dataset_id}", response_model=DatasetPublic)
def update_dataset(
    dataset_id: str,
    payload: DatasetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(
        db,
        current_user,
        dataset.organization_id,
        roles={"OWNER", "ADMIN", "ANALYST"},
    )
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(dataset, field, value.upper() if field == "domain_type" else value)
    record_audit(
        db,
        action="DATASET_UPDATED",
        entity_type="dataset",
        entity_id=dataset.id,
        organization_id=dataset.organization_id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(
        db,
        current_user,
        dataset.organization_id,
        roles={"OWNER", "ADMIN"},
    )
    dataset.status = "ARCHIVED"
    record_audit(
        db,
        action="DATASET_ARCHIVED",
        entity_type="dataset",
        entity_id=dataset.id,
        organization_id=dataset.organization_id,
        user_id=current_user.id,
    )
    db.commit()
