import { apiClient } from "../../services/api-client";

export type RecentImportItem = {
  id: string;
  dataset_id: string;
  dataset_name: string;
  original_filename: string;
  status: "COMPLETED" | "PROCESSING" | "FAILED" | "VALIDATING" | "PENDING";
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  health_score: number;
  created_at: string;
  finished_at: string | null;
};

export type OverviewTimePoint = {
  period: string;
  value: number;
};

export type SeverityCount = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  count: number;
};

export type AnalyticsOverview = {
  active_datasets: number;
  processed_imports: number;
  average_data_health_score: number;
  critical_alerts: number;
  generated_reports: number;
  recent_imports: RecentImportItem[];
  imports_timeseries: OverviewTimePoint[];
  health_score_trend: OverviewTimePoint[];
  alerts_by_severity: SeverityCount[];
};

export type MetricItem = {
  key: string;
  value: number;
  dimensions: Record<string, unknown>;
};

export type AnalyticsSummary = {
  dataset_id: string;
  metrics: MetricItem[];
};

export type HealthBreakdown = {
  dataset_id: string;
  score: number;
  completeness: number;
  validity: number;
  uniqueness: number;
  consistency: number;
  freshness: number;
};

export async function getAnalyticsOverview() {
  const response = await apiClient.get<AnalyticsOverview>("/analytics/overview");
  return response.data;
}

export async function getDatasetAnalyticsSummary(datasetId: string) {
  const response = await apiClient.get<AnalyticsSummary>(
    `/datasets/${datasetId}/analytics/summary`,
  );
  return response.data;
}

export async function getDatasetHealthBreakdown(datasetId: string) {
  const response = await apiClient.get<HealthBreakdown>(
    `/datasets/${datasetId}/analytics/health-breakdown`,
  );
  return response.data;
}
