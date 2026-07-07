const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const API_URL = `${BASE}/api`;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const detail = (data && (data as any).detail) || "Something went wrong";
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
