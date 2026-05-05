import { apiClient } from "../../services/api-client";

export type Dataset = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  domain_type: string;
  status: string;
  row_count: number;
  health_score: number;
  last_imported_at: string | null;
  created_at: string;
};

export type CreateDatasetPayload = {
  organization_id: string;
  name: string;
  description?: string;
  domain_type: string;
};

export async function listDatasets() {
  const response = await apiClient.get<Dataset[]>("/datasets");
  return response.data;
}

export async function createDataset(payload: CreateDatasetPayload) {
  const response = await apiClient.post<Dataset>("/datasets", payload);
  return response.data;
}
