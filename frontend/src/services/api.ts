const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function fetchHealth(): Promise<"online" | "offline"> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}
