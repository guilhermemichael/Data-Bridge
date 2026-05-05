import { apiClient } from "../../services/api-client";

export type Alert = {
  id: string;
  organization_id: string;
  dataset_id: string | null;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  message: string;
  status: "OPEN" | "RESOLVED" | "ACKNOWLEDGED" | "IGNORED";
  metadata_payload: Record<string, unknown>;
  triggered_at: string;
  resolved_at: string | null;
};

export async function listAlerts() {
  const response = await apiClient.get<Alert[]>("/alerts");
  return response.data;
}

export async function resolveAlert(alertId: string) {
  const response = await apiClient.patch<Alert>(`/alerts/${alertId}/resolve`);
  return response.data;
}
