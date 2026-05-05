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

export type UpdateDatasetPayload = {
  name?: string;
  description?: string;
  domain_type?: string;
  status?: string;
};

export type DatasetColumn = {
  id: string;
  dataset_id: string;
  import_job_id: string;
  name: string;
  detected_type: string;
  nullable: boolean;
  sample_values: unknown[];
  created_at: string;
};

export type DatasetPreviewRecord = {
  row_number: number;
  payload: Record<string, unknown>;
  quality_score: number;
};

export type LineageNode = {
  id: string;
  label: string;
  type: string;
  detail: string | null;
};

export type LineageEdge = {
  source: string;
  target: string;
  label: string;
};

export type DatasetLineage = {
  dataset_id: string;
  nodes: LineageNode[];
  edges: LineageEdge[];
};

export async function listDatasets() {
  const response = await apiClient.get<Dataset[]>("/datasets");
  return response.data;
}

export async function getDataset(datasetId: string) {
  const response = await apiClient.get<Dataset>(`/datasets/${datasetId}`);
  return response.data;
}

export async function createDataset(payload: CreateDatasetPayload) {
  const response = await apiClient.post<Dataset>("/datasets", payload);
  return response.data;
}

export async function updateDataset(
  datasetId: string,
  payload: UpdateDatasetPayload,
) {
  const response = await apiClient.patch<Dataset>(`/datasets/${datasetId}`, payload);
  return response.data;
}

export async function archiveDataset(datasetId: string) {
  await apiClient.delete(`/datasets/${datasetId}`);
}

export async function listDatasetColumns(datasetId: string) {
  const response = await apiClient.get<DatasetColumn[]>(
    `/datasets/${datasetId}/columns`,
  );
  return response.data;
}

export async function previewDataset(datasetId: string) {
  const response = await apiClient.get<DatasetPreviewRecord[]>(
    `/datasets/${datasetId}/preview`,
  );
  return response.data;
}

export async function getDatasetLineage(datasetId: string) {
  const response = await apiClient.get<DatasetLineage>(
    `/datasets/${datasetId}/lineage`,
  );
  return response.data;
}
