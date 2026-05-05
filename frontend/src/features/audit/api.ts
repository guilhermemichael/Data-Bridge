import { apiClient } from "../../services/api-client";

export type AuditLog = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_payload: Record<string, unknown>;
  created_at: string;
};

export async function listAuditLogs() {
  const response = await apiClient.get<AuditLog[]>("/audit-logs");
  return response.data;
}
