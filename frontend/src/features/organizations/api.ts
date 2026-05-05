import { apiClient } from "../../services/api-client";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export async function listOrganizations() {
  const response = await apiClient.get<Organization[]>("/organizations");
  return response.data;
}
