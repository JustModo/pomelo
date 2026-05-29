const API_BASE = "/api";

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = payload?.error || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload?.data ?? payload;
}
