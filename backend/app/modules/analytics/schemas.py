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
