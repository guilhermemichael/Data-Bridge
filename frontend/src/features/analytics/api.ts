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

export async function getAnalyticsOverview() {
  const response = await apiClient.get<AnalyticsOverview>("/analytics/overview");
  return response.data;
}
