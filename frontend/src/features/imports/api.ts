import { apiClient } from "../../services/api-client";

export type ImportJob = {
  id: string;
  dataset_id: string;
  original_filename: string;
  stored_filename: string;
  file_size_bytes: number;
  mime_type: string;
  status: "PENDING" | "VALIDATING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error_message: string | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  health_score: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export async function listImports() {
  const response = await apiClient.get<ImportJob[]>("/imports");
  return response.data;
}

export async function getImportJob(importJobId: string) {
  const response = await apiClient.get<ImportJob>(`/imports/${importJobId}`);
  return response.data;
}

export async function uploadDatasetFile(datasetId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ImportJob>(
    `/datasets/${datasetId}/imports`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}
