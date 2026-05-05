from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.database.models import Dataset, ImportJob, User
from app.integrations.storage.local import LocalStorage
from app.modules.imports.schemas import ImportJobPublic
from app.services.audit_service import record_audit
from app.services.processing_service import process_import_job
from app.workers.tasks import process_import_job_task

router = APIRouter()


@router.post(
    "/datasets/{dataset_id}/imports",
    response_model=ImportJobPublic,
    status_code=status.HTTP_201_CREATED,
)
async def upload_import(
    dataset_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ImportJob:
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

    stored_file = await LocalStorage().save_upload(file)
    import_job = ImportJob(
        dataset_id=dataset.id,
        uploaded_by=current_user.id,
        original_filename=stored_file.original_filename,
        stored_filename=stored_file.stored_filename,
        file_size_bytes=stored_file.file_size_bytes,
        mime_type=stored_file.mime_type,
        status="PENDING",
    )
    db.add(import_job)
    db.flush()
    record_audit(
        db,
        action="FILE_UPLOADED",
        entity_type="import_job",
        entity_id=import_job.id,
        organization_id=dataset.organization_id,
        user_id=current_user.id,
        metadata={"filename": stored_file.original_filename},
    )
    db.commit()
    db.refresh(import_job)

    try:
        process_import_job_task.delay(import_job.id)
        if settings.celery_task_always_eager:
            db.refresh(import_job)
    except Exception:
        if settings.app_env == "development":
            process_import_job(import_job.id, db)
            db.refresh(import_job)
        else:
            import_job.status = "FAILED"
            import_job.error_message = "Could not enqueue import processing task."
            db.commit()
            db.refresh(import_job)

    return import_job


@router.get("/imports/{import_job_id}", response_model=ImportJobPublic)
def get_import_job(
    import_job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ImportJob:
    import_job = db.get(ImportJob, import_job_id)
    if import_job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import job not found.",
        )
    dataset = db.get(Dataset, import_job.dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    return import_job


@router.get("/datasets/{dataset_id}/imports", response_model=list[ImportJobPublic])
def list_dataset_imports(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ImportJob]:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    return (
        db.query(ImportJob)
        .filter(ImportJob.dataset_id == dataset_id)
        .order_by(ImportJob.created_at.desc())
        .all()
    )
