import { request } from "./client.js";
import type { ConfigSnapshot, Release, Status, StorageUsage } from "../types.js";

export const api = {
  getStatus: () => request<Status>("/status"),
  getReleases: () => request<Release[]>("/releases"),
  install: (version: string) =>
    request("/install", { method: "POST", body: JSON.stringify({ version }) }),
  upgrade: (version: string) =>
    request("/upgrade", { method: "POST", body: JSON.stringify({ version }) }),
  rollback: (version: string) =>
    request("/rollback", { method: "POST", body: JSON.stringify({ version }) }),
  start: () => request("/start", { method: "POST" }),
  stop: () => request("/stop", { method: "POST" }),
  restart: () => request("/restart", { method: "POST" }),
  repair: () => request("/repair", { method: "POST" }),
  getConfig: () => request<ConfigSnapshot>("/config"),
  updateConfig: (payload: Partial<ConfigSnapshot>) =>
    request("/config", { method: "PUT", body: JSON.stringify(payload) }),
  validateConfig: () =>
    request<{ envErrors: string[] }>("/config/validate", { method: "POST" }),
  getStorage: () => request<StorageUsage>("/storage"),
  getLogs: async (source: string, tail = 200) => {
    const res = await fetch(
      `/api/logs?source=${encodeURIComponent(source)}&tail=${tail}`,
    );
    if (!res.ok) throw new Error("Failed to load logs");
    return res.text();
  },
  removeRelease: (version: string) =>
    request("/releases/remove", {
      method: "POST",
      body: JSON.stringify({ version }),
    }),
  pruneReleases: () => request("/releases/prune", { method: "POST" }),
};
