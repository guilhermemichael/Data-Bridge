import { API_BASE_URL } from "./api-client";

export async function fetchHealth(): Promise<"online" | "offline"> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}
