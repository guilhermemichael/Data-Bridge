import { apiClient } from "../../services/api-client";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  organization_name?: string;
};

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<TokenResponse>("/auth/login", payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<TokenResponse>("/auth/register", payload);
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}
