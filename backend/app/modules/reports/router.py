from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.database.models import Dataset, OrganizationMember, Report, User
from app.modules.reports.schemas import ReportCreate, ReportPublic
from app.services.report_service import generate_report

router = APIRouter()


@router.post(
    "/datasets/{dataset_id}/reports",
    response_model=ReportPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    dataset_id: str,
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Report:
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
    report = generate_report(
        db,
        dataset=dataset,
        generated_by=current_user.id,
        title=payload.title,
    )
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=list[ReportPublic])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Report]:
    organization_ids = [
        membership.organization_id
        for membership in db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    ]
    dataset_ids = [
        dataset.id
        for dataset in db.query(Dataset)
        .filter(Dataset.organization_id.in_(organization_ids))
        .all()
    ]
    if not dataset_ids:
        return []
    return (
        db.query(Report)
        .filter(Report.dataset_id.in_(dataset_ids))
        .order_by(Report.created_at.desc())
        .all()
    )


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    dataset = db.get(Dataset, report.dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    if report.file_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found.",
        )

    path = Path(report.file_path)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found.",
        )
    return FileResponse(path, media_type="application/pdf", filename=path.name)
