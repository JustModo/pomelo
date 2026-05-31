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
  containers: ContainerInfo[];
  operation?: {
    status: "idle" | "running";
    name?: string;
    startedAt?: string;
  };
};

export type ContainerInfo = {
  Name?: string;
  name?: string;
  State?: string;
  state?: string;
  Status?: string;
  status?: string;
  Health?: string;
  Image?: string;
  Service?: string;
};

export interface ConfigSnapshot {
  appEnv: string;
  configYaml: string;
  caddyfile: string;
  judge0: string;
};

export type StorageUsage = {
  database: { bytes: number };
  uploads: { bytes: number };
  backups: { bytes: number };
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: "admin" | "user";
};
