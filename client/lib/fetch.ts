import { auth } from "@/auth";
import { getBaseUrl } from "@/lib/env";

export async function fetchBackend(endpoint: string, options: RequestInit = {}) {
  const session = await auth();
  const token = session?.backendToken;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Only set Content-Type to application/json if body is string (JSON stringified) and no content type is present
  if (!headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    return res.json();
  }
  
  return {
    success: res.ok,
    message: await res.text(),
  };
}
