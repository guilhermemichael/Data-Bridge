from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.database.models import AnalyticsSnapshot, Dataset, User
from app.modules.analytics.schemas import (
    AnalyticsSummary,
    MetricItem,
    TimeSeriesPoint,
    TimeSeriesResponse,
)

router = APIRouter()


@router.get("/datasets/{dataset_id}/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsSummary:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    snapshots = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.dataset_id == dataset_id)
        .order_by(AnalyticsSnapshot.metric_key.asc())
        .all()
    )
    return AnalyticsSummary(
        dataset_id=dataset_id,
        metrics=[
            MetricItem(
                key=snapshot.metric_key,
                value=snapshot.metric_value,
                dimensions=snapshot.dimensions or {},
            )
            for snapshot in snapshots
            if snapshot.metric_key != "records_over_time"
        ],
    )


@router.get(
    "/datasets/{dataset_id}/analytics/timeseries",
    response_model=TimeSeriesResponse,
)
def analytics_timeseries(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimeSeriesResponse:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)
    snapshots = (
        db.query(AnalyticsSnapshot)
        .filter(
            AnalyticsSnapshot.dataset_id == dataset_id,
            AnalyticsSnapshot.metric_key == "records_over_time",
        )
        .all()
    )
    points = sorted(
        [
            TimeSeriesPoint(
                period=str(snapshot.dimensions.get("period", "unknown")),
                value=snapshot.metric_value,
            )
            for snapshot in snapshots
        ],
        key=lambda item: item.period,
    )
    return TimeSeriesResponse(dataset_id=dataset_id, points=points)
