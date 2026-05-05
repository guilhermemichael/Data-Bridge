import math
import warnings
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from app.core.utils import utcnow
from app.database.models import (
    Alert,
    AnalyticsSnapshot,
    Dataset,
    DatasetColumn,
    ImportJob,
    ProcessedRecord,
    RawRecord,
)
from app.integrations.storage.local import LocalStorage
from app.services.audit_service import record_audit


@dataclass(frozen=True)
class ColumnProfile:
    name: str
    detected_type: str
    nullable: bool
    sample_values: list[Any]


def process_import_job(import_job_id: str, db: Session) -> ImportJob:
    import_job = db.get(ImportJob, import_job_id)
    if import_job is None:
        raise ValueError(f"Import job {import_job_id} not found.")

    try:
        import_job.status = "VALIDATING"
        import_job.started_at = utcnow()
        db.commit()

        storage = LocalStorage()
        dataframe = read_dataframe(storage.resolve(import_job.stored_filename))
        if dataframe.empty:
            raise ValueError("Imported file does not contain rows.")

        dataframe = dataframe.rename(columns=lambda col: str(col).strip())
        column_profiles = detect_schema(dataframe)

        import_job.status = "PROCESSING"
        db.commit()

        db.query(DatasetColumn).filter(
            DatasetColumn.import_job_id == import_job.id
        ).delete()
        for profile in column_profiles:
            db.add(
                DatasetColumn(
                    dataset_id=import_job.dataset_id,
                    import_job_id=import_job.id,
                    name=profile.name,
                    detected_type=profile.detected_type,
                    nullable=profile.nullable,
                    sample_values=profile.sample_values,
                )
            )

        raw_records, processed_records, row_quality_scores = build_records(
            dataframe,
            import_job,
        )
        db.add_all(raw_records)
        db.add_all(processed_records)

        health_score = calculate_health_score(dataframe, column_profiles)
        invalid_rows = sum(score < 0.75 for score in row_quality_scores)
        valid_rows = len(row_quality_scores) - invalid_rows

        save_analytics_snapshots(db, dataframe, import_job.dataset_id, health_score)
        save_alerts(
            db,
            import_job.dataset_id,
            health_score,
            invalid_rows,
            len(dataframe),
        )

        dataset = db.get(Dataset, import_job.dataset_id)
        if dataset is not None:
            dataset.status = "ACTIVE"
            dataset.row_count = len(dataframe)
            dataset.health_score = health_score
            dataset.last_imported_at = utcnow()

        import_job.status = "COMPLETED"
        import_job.total_rows = len(dataframe)
        import_job.valid_rows = valid_rows
        import_job.invalid_rows = invalid_rows
        import_job.health_score = health_score
        import_job.finished_at = utcnow()
        record_audit(
            db,
            action="IMPORT_COMPLETED",
            entity_type="import_job",
            entity_id=import_job.id,
            organization_id=dataset.organization_id if dataset else None,
            user_id=import_job.uploaded_by,
            metadata={"health_score": health_score, "total_rows": len(dataframe)},
        )
        db.commit()
        db.refresh(import_job)
        return import_job
    except Exception as exc:
        db.rollback()
        import_job = db.get(ImportJob, import_job_id)
        if import_job is not None:
            import_job.status = "FAILED"
            import_job.error_message = str(exc)
            import_job.finished_at = utcnow()
            db.commit()
        raise


def read_dataframe(path: Path) -> pd.DataFrame:
    extension = path.suffix.lower()
    if extension == ".csv":
        return pd.read_csv(path)
    if extension == ".xlsx":
        return pd.read_excel(path)
    if extension == ".json":
        return pd.read_json(path)
    raise ValueError(f"Unsupported file extension: {extension}")


def detect_schema(dataframe: pd.DataFrame) -> list[ColumnProfile]:
    profiles: list[ColumnProfile] = []
    for column in dataframe.columns:
        series = dataframe[column]
        clean_series = series.dropna()
        detected_type = detect_column_type(clean_series)
        samples = [sanitize_value(value) for value in clean_series.head(5).tolist()]
        profiles.append(
            ColumnProfile(
                name=str(column),
                detected_type=detected_type,
                nullable=bool(series.isna().any()),
                sample_values=samples,
            )
        )
    return profiles


def detect_column_type(series: pd.Series) -> str:
    if series.empty:
        return "UNKNOWN"
    if pd.api.types.is_bool_dtype(series):
        return "BOOLEAN"
    if pd.api.types.is_integer_dtype(series):
        return "INTEGER"
    if pd.api.types.is_float_dtype(series):
        return "FLOAT"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "DATETIME"

    parsed_dates = parse_datetime_series(series)
    if parsed_dates.notna().mean() >= 0.8:
        return "DATETIME"

    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().mean() >= 0.8:
        return "FLOAT"

    return "STRING"


def build_records(
    dataframe: pd.DataFrame,
    import_job: ImportJob,
) -> tuple[list[RawRecord], list[ProcessedRecord], list[float]]:
    raw_records: list[RawRecord] = []
    processed_records: list[ProcessedRecord] = []
    row_quality_scores: list[float] = []
    column_count = max(len(dataframe.columns), 1)

    for row_offset, (_, row) in enumerate(dataframe.iterrows(), start=2):
        payload = {
            str(key): sanitize_value(value)
            for key, value in row.to_dict().items()
        }
        missing_values = sum(value is None for value in payload.values())
        quality_score = max(0.0, 1.0 - (missing_values / column_count))
        row_quality_scores.append(quality_score)
        raw_records.append(
            RawRecord(
                import_job_id=import_job.id,
                row_number=row_offset,
                payload=payload,
            )
        )
        processed_records.append(
            ProcessedRecord(
                dataset_id=import_job.dataset_id,
                import_job_id=import_job.id,
                payload=payload,
                quality_score=quality_score,
            )
        )
    return raw_records, processed_records, row_quality_scores


def sanitize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if isinstance(value, datetime | date):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            return value.item()
        except ValueError:
            return str(value)
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def calculate_health_score(
    dataframe: pd.DataFrame,
    column_profiles: list[ColumnProfile],
) -> float:
    rows = max(len(dataframe), 1)
    columns = max(len(dataframe.columns), 1)
    total_cells = rows * columns
    null_ratio = float(dataframe.isna().sum().sum()) / total_cells
    duplicate_ratio = float(dataframe.duplicated().sum()) / rows
    unknown_ratio = (
        sum(profile.detected_type == "UNKNOWN" for profile in column_profiles) / columns
    )

    score = 100.0
    score -= null_ratio * 20
    score -= duplicate_ratio * 15
    score -= unknown_ratio * 10
    return round(max(0.0, min(100.0, score)), 2)


def save_analytics_snapshots(
    db: Session,
    dataframe: pd.DataFrame,
    dataset_id: str,
    health_score: float,
) -> None:
    db.query(AnalyticsSnapshot).filter(
        AnalyticsSnapshot.dataset_id == dataset_id
    ).delete()

    snapshots = [
        AnalyticsSnapshot(
            dataset_id=dataset_id,
            metric_key="row_count",
            metric_value=float(len(dataframe)),
            dimensions={},
        ),
        AnalyticsSnapshot(
            dataset_id=dataset_id,
            metric_key="column_count",
            metric_value=float(len(dataframe.columns)),
            dimensions={},
        ),
        AnalyticsSnapshot(
            dataset_id=dataset_id,
            metric_key="health_score",
            metric_value=health_score,
            dimensions={},
        ),
    ]

    numeric_columns = dataframe.select_dtypes(include="number").columns.tolist()
    for column in numeric_columns[:6]:
        snapshots.append(
            AnalyticsSnapshot(
                dataset_id=dataset_id,
                metric_key=f"sum_{column}",
                metric_value=float(dataframe[column].fillna(0).sum()),
                dimensions={"column": str(column), "aggregation": "sum"},
            )
        )
        snapshots.append(
            AnalyticsSnapshot(
                dataset_id=dataset_id,
                metric_key=f"avg_{column}",
                metric_value=float(dataframe[column].fillna(0).mean()),
                dimensions={"column": str(column), "aggregation": "average"},
            )
        )

    date_column = find_date_column(dataframe)
    if date_column is not None:
        periods = pd.to_datetime(
            dataframe[date_column],
            errors="coerce",
        ).dt.to_period("M")
        grouped = periods.value_counts().sort_index()
        for period, value in grouped.items():
            snapshots.append(
                AnalyticsSnapshot(
                    dataset_id=dataset_id,
                    metric_key="records_over_time",
                    metric_value=float(value),
                    dimensions={"period": str(period), "series": "count"},
                )
            )

    db.add_all(snapshots)


def find_date_column(dataframe: pd.DataFrame) -> str | None:
    for column in dataframe.columns:
        parsed = parse_datetime_series(dataframe[column])
        if parsed.notna().mean() >= 0.8:
            return str(column)
    return None


def parse_datetime_series(series: pd.Series) -> pd.Series:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        return pd.to_datetime(series, errors="coerce")


def save_alerts(
    db: Session,
    dataset_id: str,
    health_score: float,
    invalid_rows: int,
    total_rows: int,
) -> None:
    alerts: list[Alert] = []
    if health_score < 70:
        alerts.append(
            Alert(
                dataset_id=dataset_id,
                type="DATA_QUALITY_ALERT",
                severity="CRITICAL" if health_score < 50 else "HIGH",
                title="Data Health Score below target",
                message=f"Dataset health score is {health_score:.1f}/100.",
            )
        )
    if invalid_rows > 0:
        alerts.append(
            Alert(
                dataset_id=dataset_id,
                type="VALIDATION_ALERT",
                severity="MEDIUM",
                title="Rows need review",
                message=f"{invalid_rows} of {total_rows} rows have low quality.",
            )
        )
    if total_rows == 0:
        alerts.append(
            Alert(
                dataset_id=dataset_id,
                type="SYSTEM_ALERT",
                severity="HIGH",
                title="Empty dataset",
                message="The imported file did not produce processable rows.",
            )
        )
    db.add_all(alerts)
