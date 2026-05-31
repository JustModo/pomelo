import { request } from "./client.js";
import type { ConfigSnapshot, CreateUserPayload, Status, StorageUsage, UpdateUserPayload, User } from "../types.js";

export const api = {
  // Health & Status
  getStatus: () => request<Status>("/status"),

  // Lifecycle
  start: (onChunk?: (text: string) => void) => streamRequest("/start", { method: "POST", onChunk }),
  stop: (onChunk?: (text: string) => void) => streamRequest("/stop", { method: "POST", onChunk }),
  restart: (onChunk?: (text: string) => void) => streamRequest("/restart", { method: "POST", onChunk }),

  // Config
  getConfig: () => request<ConfigSnapshot>("/config"),
  updateConfig: (payload: Partial<ConfigSnapshot>) =>
    request("/config", { method: "PUT", body: JSON.stringify(payload) }),
  validateConfig: () =>
    request<{ envErrors: string[] }>("/config/validate", { method: "POST" }),

  // Storage
  getStorage: () => request<StorageUsage>("/storage"),

  // Logs
  getLogs: async (source: string, tail = 200) => {
    const res = await fetch(
      `/api/logs?source=${encodeURIComponent(source)}&tail=${tail}`,
    );
    if (!res.ok) throw new Error("Failed to load logs");
    return res.text();
  },

  // Uninstall
  uninstall: (mode: string) =>
    streamRequest("/uninstall", { method: "POST", body: JSON.stringify({ mode }) }),

  // Users
  listUsers: () => request<User[]>("/users"),
  createUser: (data: CreateUserPayload) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: UpdateUserPayload) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request(`/users/${id}`, { method: "DELETE" }),
};

/**
 * Stream a response from the daemon and return the full output text + exit code.
 */
export async function streamRequest(
  path: string,
  options?: RequestInit & { onChunk?: (text: string) => void }
): Promise<{ output: string; exitCode: number }> {
  const res = await fetch(`/api${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || payload?.message || "Request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) return { output: "", exitCode: 0 };

  const decoder = new TextDecoder();
  let output = "";
  let exitCode = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const exitMatch = text.match(/\[POMELO_EXIT:(\d+)\]/);
    
    let chunkOutput = text;
    if (exitMatch) {
      exitCode = parseInt(exitMatch[1], 10);
      chunkOutput = text.replace(/\n?\[POMELO_EXIT:\d+\]\n?/g, "");
    }
    
    output += chunkOutput;
    if (options?.onChunk && chunkOutput) {
      options.onChunk(chunkOutput);
    }
  }

  return { output, exitCode };
}
