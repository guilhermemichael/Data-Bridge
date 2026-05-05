import { apiClient } from "../../services/api-client";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "ANALYST" | "VIEWER";
  user_email: string;
  user_full_name: string;
  created_at: string;
};

export async function listOrganizations() {
  const response = await apiClient.get<Organization[]>("/organizations");
  return response.data;
}

export async function updateOrganization(organizationId: string, name: string) {
  const response = await apiClient.patch<Organization>(
    `/organizations/${organizationId}`,
    { name },
  );
  return response.data;
}

export async function listOrganizationMembers(organizationId: string) {
  const response = await apiClient.get<OrganizationMember[]>(
    `/organizations/${organizationId}/members`,
  );
  return response.data;
}
