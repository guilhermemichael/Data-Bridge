import { apiClient } from "../../services/api-client";

export type Report = {
  id: string;
  organization_id: string;
  dataset_id: string;
  generated_by: string;
  title: string;
  file_path: string | null;
  status: "GENERATED" | "PENDING" | "GENERATING" | "FAILED";
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
};

export async function listReports() {
  const response = await apiClient.get<Report[]>("/reports");
  return response.data;
}

export async function createReport(datasetId: string, title?: string) {
  const response = await apiClient.post<Report>(`/datasets/${datasetId}/reports`, {
    title,
  });
  return response.data;
}

export async function downloadReportBlob(reportId: string) {
  const response = await apiClient.get(`/reports/${reportId}/download`, {
    responseType: "blob",
  });
  return response.data as Blob;
}
