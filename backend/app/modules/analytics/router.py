from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_organization_member
from app.database.models import (
    Alert,
    AnalyticsSnapshot,
    Dataset,
    ImportJob,
    OrganizationMember,
    ProcessedRecord,
    Report,
    User,
)
from app.modules.analytics.schemas import (
    AnalyticsOverview,
    AnalyticsSummary,
    HealthBreakdown,
    MetricItem,
    OverviewTimePoint,
    RecentImportItem,
    SeverityCount,
    TimeSeriesPoint,
    TimeSeriesResponse,
)

router = APIRouter()


@router.get("/analytics/overview", response_model=AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsOverview:
    organization_ids = [
        membership.organization_id
        for membership in db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    ]
    if not organization_ids:
        return AnalyticsOverview(
            active_datasets=0,
            processed_imports=0,
            average_data_health_score=0.0,
            critical_alerts=0,
            generated_reports=0,
            recent_imports=[],
            imports_timeseries=[],
            health_score_trend=[],
            alerts_by_severity=[],
        )

    datasets = (
        db.query(Dataset)
        .filter(Dataset.organization_id.in_(organization_ids))
        .all()
    )
    dataset_ids = [dataset.id for dataset in datasets]
    if not dataset_ids:
        return AnalyticsOverview(
            active_datasets=0,
            processed_imports=0,
            average_data_health_score=0.0,
            critical_alerts=0,
            generated_reports=0,
            recent_imports=[],
            imports_timeseries=[],
            health_score_trend=[],
            alerts_by_severity=[],
        )

    active_datasets = sum(dataset.status == "ACTIVE" for dataset in datasets)
    average_score = (
        sum(dataset.health_score for dataset in datasets) / len(datasets)
        if datasets
        else 0.0
    )
    processed_imports = (
        db.query(ImportJob)
        .filter(
            ImportJob.dataset_id.in_(dataset_ids),
            ImportJob.status == "COMPLETED",
        )
        .count()
    )
    critical_alerts = (
        db.query(Alert)
        .filter(
            Alert.organization_id.in_(organization_ids),
            Alert.severity == "CRITICAL",
            Alert.status == "OPEN",
        )
        .count()
    )
    generated_reports = (
        db.query(Report)
        .filter(
            Report.organization_id.in_(organization_ids),
            Report.status == "GENERATED",
        )
        .count()
    )

    recent_import_rows = (
        db.query(ImportJob, Dataset.name)
        .join(Dataset, ImportJob.dataset_id == Dataset.id)
        .filter(Dataset.id.in_(dataset_ids))
        .order_by(ImportJob.created_at.desc())
        .limit(8)
        .all()
    )
    recent_imports = [
        RecentImportItem(
            id=import_job.id,
            dataset_id=import_job.dataset_id,
            dataset_name=dataset_name,
            original_filename=import_job.original_filename,
            status=import_job.status,
            total_rows=import_job.total_rows,
            valid_rows=import_job.valid_rows,
            invalid_rows=import_job.invalid_rows,
            health_score=import_job.health_score,
            created_at=import_job.created_at.isoformat(),
            finished_at=(
                import_job.finished_at.isoformat()
                if import_job.finished_at is not None
                else None
            ),
        )
        for import_job, dataset_name in recent_import_rows
    ]

    completed_imports = (
        db.query(ImportJob)
        .filter(
            ImportJob.dataset_id.in_(dataset_ids),
            ImportJob.status == "COMPLETED",
        )
        .order_by(ImportJob.created_at.asc())
        .all()
    )
    imports_timeseries = build_monthly_count_series(completed_imports)
    health_score_trend = build_monthly_average_health_series(completed_imports)

    severity_rows = (
        db.query(Alert.severity, func.count(Alert.id))
        .filter(Alert.organization_id.in_(organization_ids))
        .group_by(Alert.severity)
        .all()
    )
    alerts_by_severity = [
        SeverityCount(severity=severity, count=count)
        for severity, count in severity_rows
    ]

    return AnalyticsOverview(
        active_datasets=active_datasets,
        processed_imports=processed_imports,
        average_data_health_score=round(average_score, 2),
        critical_alerts=critical_alerts,
        generated_reports=generated_reports,
        recent_imports=recent_imports,
        imports_timeseries=imports_timeseries,
        health_score_trend=health_score_trend,
        alerts_by_severity=alerts_by_severity,
    )


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


@router.get(
    "/datasets/{dataset_id}/analytics/health-breakdown",
    response_model=HealthBreakdown,
)
def analytics_health_breakdown(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HealthBreakdown:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    require_organization_member(db, current_user, dataset.organization_id)

    latest_import = (
        db.query(ImportJob)
        .filter(ImportJob.dataset_id == dataset_id)
        .order_by(ImportJob.created_at.desc())
        .first()
    )
    import_ids = (
        select(ImportJob.id)
        .where(ImportJob.dataset_id == dataset_id)
    )

    if latest_import is None or latest_import.total_rows == 0:
        return HealthBreakdown(
            dataset_id=dataset_id,
            score=dataset.health_score,
            completeness=0.0,
            validity=0.0,
            uniqueness=0.0,
            consistency=0.0,
            freshness=0.0,
        )

    records = (
        db.query(ProcessedRecord)
        .filter(ProcessedRecord.import_job_id.in_(import_ids))
        .all()
    )
    total_records = max(len(records), 1)
    completeness = round(
        sum(record.quality_score for record in records) / total_records * 100,
        2,
    )
    validity = round(
        latest_import.valid_rows / max(latest_import.total_rows, 1) * 100,
        2,
    )
    unique_payloads = {str(record.payload) for record in records}
    uniqueness = round(len(unique_payloads) / total_records * 100, 2)
    consistency = round((completeness + validity + uniqueness) / 3, 2)

    freshness = 0.0
    if dataset.last_imported_at is not None:
        imported_at = dataset.last_imported_at
        if imported_at.tzinfo is None:
            imported_at = imported_at.replace(tzinfo=UTC)
        age_days = max((datetime.now(UTC) - imported_at).days, 0)
        freshness = round(max(0.0, 100.0 - age_days * 3), 2)

    score = round(
        completeness * 0.30
        + validity * 0.25
        + uniqueness * 0.20
        + consistency * 0.15
        + freshness * 0.10,
        2,
    )
    return HealthBreakdown(
        dataset_id=dataset_id,
        score=score,
        completeness=completeness,
        validity=validity,
        uniqueness=uniqueness,
        consistency=consistency,
        freshness=freshness,
    )


def build_monthly_count_series(imports: list[ImportJob]) -> list[OverviewTimePoint]:
    counts: dict[str, int] = {}
    for import_job in imports:
        period = import_job.created_at.strftime("%Y-%m")
        counts[period] = counts.get(period, 0) + 1
    return [
        OverviewTimePoint(period=period, value=float(value))
        for period, value in sorted(counts.items())
    ]


def build_monthly_average_health_series(
    imports: list[ImportJob],
) -> list[OverviewTimePoint]:
    buckets: dict[str, list[float]] = {}
    for import_job in imports:
        period = import_job.created_at.strftime("%Y-%m")
        buckets.setdefault(period, []).append(import_job.health_score)
    return [
        OverviewTimePoint(
            period=period,
            value=round(sum(values) / len(values), 2),
        )
        for period, values in sorted(buckets.items())
    ]
