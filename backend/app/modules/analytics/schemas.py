from pydantic import BaseModel


class MetricItem(BaseModel):
    key: str
    value: float
    dimensions: dict


class AnalyticsSummary(BaseModel):
    dataset_id: str
    metrics: list[MetricItem]


class TimeSeriesPoint(BaseModel):
    period: str
    value: float


class TimeSeriesResponse(BaseModel):
    dataset_id: str
    points: list[TimeSeriesPoint]


class RecentImportItem(BaseModel):
    id: str
    dataset_id: str
    dataset_name: str
    original_filename: str
    status: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    health_score: float
    created_at: str
    finished_at: str | None


class SeverityCount(BaseModel):
    severity: str
    count: int


class OverviewTimePoint(BaseModel):
    period: str
    value: float


class AnalyticsOverview(BaseModel):
    active_datasets: int
    processed_imports: int
    average_data_health_score: float
    critical_alerts: int
    generated_reports: int
    recent_imports: list[RecentImportItem]
    imports_timeseries: list[OverviewTimePoint]
    health_score_trend: list[OverviewTimePoint]
    alerts_by_severity: list[SeverityCount]


class HealthBreakdown(BaseModel):
    dataset_id: str
    score: float
    completeness: float
    validity: float
    uniqueness: float
    consistency: float
    freshness: float
