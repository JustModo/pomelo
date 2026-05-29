export type Release = {
  version: string;
  path: string;
  current: boolean;
  modifiedAt: string;
};

export type Status = {
  currentVersion: string | null;
  dockerAvailable: boolean;
  releases: Release[];
  containers: Array<Record<string, unknown>>;
  operation?: {
    status: "idle" | "running";
    name?: string;
    startedAt?: string;
  };
};

export type ConfigSnapshot = {
  appEnv: string;
  configJson: Record<string, unknown>;
  caddyfile: string;
  judge0: string;
};

export type StorageUsage = {
  database: { bytes: number };
  uploads: { bytes: number };
  backups: { bytes: number };
};
