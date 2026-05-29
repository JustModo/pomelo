import { useEffect, useMemo, useState } from "react";
import { api } from "./api/index.js";
import type { ConfigSnapshot, Release, Status, StorageUsage } from "./types.js";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "releases", label: "Releases" },
  { id: "environment", label: "Environment" },
  { id: "storage", label: "Storage" },
  { id: "logs", label: "Logs" },
  { id: "repair", label: "Repair" },
  { id: "settings", label: "Settings" },
];

export default function App() {
  const [route, setRoute] = useHashRoute("dashboard");
  const [status, setStatus] = useState<Status | null>(null);
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus();
    refreshConfig();
    refreshStorage();
  }, []);

  const releases = useMemo(() => status?.releases ?? [], [status]);

  async function refreshStatus() {
    try {
      setStatus(await api.getStatus());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshConfig() {
    try {
      setConfig(await api.getConfig());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshStorage() {
    try {
      setStorage(await api.getStorage());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      setMessage(null);
      await action();
      setMessage(successMessage);
      await refreshStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Pomelo</div>
        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={route === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setRoute(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="meta">{status?.currentVersion ?? "No release"}</div>
          <div className="meta">{status?.dockerAvailable ? "Docker ready" : "Docker down"}</div>
        </div>
      </aside>
      <main className="content">
        <header className="header">
          <div>
            <div className="title">{NAV.find((item) => item.id === route)?.label}</div>
            <div className="subtitle">Local control plane</div>
          </div>
          <button className="ghost" type="button" onClick={refreshStatus}>
            Refresh
          </button>
        </header>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {route === "dashboard" && (
          <DashboardPage status={status} onAction={runAction} />
        )}
        {route === "releases" && (
          <ReleasesPage
            releases={releases}
            onRefresh={refreshStatus}
            onAction={runAction}
          />
        )}
        {route === "environment" && (
          <EnvironmentPage
            config={config}
            onSave={async (payload) => {
              await api.updateConfig(payload);
              await refreshConfig();
              setMessage("Configuration saved");
            }}
            onValidate={async () => {
              const result = await api.validateConfig();
              if (result.envErrors?.length) {
                setError(result.envErrors.join("\n"));
              } else {
                setMessage("Configuration looks good");
              }
            }}
          />
        )}
        {route === "storage" && <StoragePage storage={storage} />}
        {route === "logs" && <LogsPage />}
        {route === "repair" && (
          <RepairPage onRepair={() => runAction(api.repair, "Repair finished")} />
        )}
        {route === "settings" && (
          <SettingsPage
            config={config}
            onSave={async (payload) => {
              await api.updateConfig({ configJson: payload });
              await refreshConfig();
              setMessage("Settings updated");
            }}
          />
        )}
      </main>
    </div>
  );
}

function DashboardPage({
  status,
  onAction,
}: {
  status: Status | null;
  onAction: (action: () => Promise<unknown>, message: string) => void;
}) {
  return (
    <section className="grid">
      <div className="card">
        <div className="card-title">System</div>
        <div className="stat">{status?.currentVersion ?? "No release"}</div>
        <div className="muted">Docker: {status?.dockerAvailable ? "Ready" : "Offline"}</div>
        <div className="muted">
          Operation: {status?.operation?.status ?? "idle"}
        </div>
      </div>
      <div className="card">
        <div className="card-title">Containers</div>
        <div className="stat">{status?.containers?.length ?? 0}</div>
        <div className="muted">Active services detected</div>
      </div>
      <div className="card">
        <div className="card-title">Quick Actions</div>
        <div className="actions">
          <button onClick={() => onAction(api.start, "Services started")}>Start</button>
          <button onClick={() => onAction(api.stop, "Services stopped")}>Stop</button>
          <button onClick={() => onAction(api.restart, "Services restarted")}>Restart</button>
        </div>
      </div>
    </section>
  );
}

function ReleasesPage({
  releases,
  onRefresh,
  onAction,
}: {
  releases: Release[];
  onRefresh: () => void;
  onAction: (action: () => Promise<unknown>, message: string) => void;
}) {
  const [version, setVersion] = useState("");

  return (
    <section className="stack">
      <div className="card">
        <div className="card-title">Install or Upgrade</div>
        <div className="row">
          <input
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            placeholder="v1.2.0 or latest"
          />
          <button onClick={() => onAction(() => api.install(version), "Install started")}>Install</button>
          <button onClick={() => onAction(() => api.upgrade(version), "Upgrade started")}>Upgrade</button>
          <button onClick={() => onAction(() => api.rollback(version), "Rollback started")}>Rollback</button>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Installed Releases</div>
        <div className="list">
          {releases.map((release) => (
            <div key={release.version} className={release.current ? "list-item active" : "list-item"}>
              <div>
                <div className="strong">{release.version}</div>
                <div className="muted">{release.modifiedAt}</div>
              </div>
              <div className="actions">
                {!release.current && (
                  <button
                    className="ghost"
                    onClick={() => onAction(() => api.removeRelease(release.version), "Release removed")}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="row">
          <button className="ghost" onClick={onRefresh}>
            Refresh
          </button>
          <button className="ghost" onClick={() => onAction(api.pruneReleases, "Releases pruned")}>
            Prune
          </button>
        </div>
      </div>
    </section>
  );
}

function EnvironmentPage({
  config,
  onSave,
  onValidate,
}: {
  config: ConfigSnapshot | null;
  onSave: (payload: Partial<ConfigSnapshot>) => Promise<void>;
  onValidate: () => Promise<void>;
}) {
  const [appEnv, setAppEnv] = useState(config?.appEnv ?? "");
  const [configJson, setConfigJson] = useState(
    JSON.stringify(config?.configJson ?? {}, null, 2)
  );
  const [caddyfile, setCaddyfile] = useState(config?.caddyfile ?? "");
  const [judge0, setJudge0] = useState(config?.judge0 ?? "");

  useEffect(() => {
    setAppEnv(config?.appEnv ?? "");
    setConfigJson(JSON.stringify(config?.configJson ?? {}, null, 2));
    setCaddyfile(config?.caddyfile ?? "");
    setJudge0(config?.judge0 ?? "");
  }, [config]);

  return (
    <section className="stack">
      <div className="card">
        <div className="card-title">app.env</div>
        <textarea value={appEnv} onChange={(event) => setAppEnv(event.target.value)} rows={12} />
      </div>
      <div className="card">
        <div className="card-title">config.json</div>
        <textarea
          value={configJson}
          onChange={(event) => setConfigJson(event.target.value)}
          rows={10}
        />
      </div>
      <div className="card">
        <div className="card-title">Caddyfile</div>
        <textarea
          value={caddyfile}
          onChange={(event) => setCaddyfile(event.target.value)}
          rows={10}
        />
      </div>
      <div className="card">
        <div className="card-title">Judge0 Config</div>
        <textarea
          value={judge0}
          onChange={(event) => setJudge0(event.target.value)}
          rows={8}
        />
      </div>
      <div className="row">
        <button
          onClick={() =>
            onSave({
              appEnv,
              configJson: safeJson(configJson),
              caddyfile,
              judge0,
            })
          }
        >
          Save
        </button>
        <button className="ghost" onClick={onValidate}>
          Validate
        </button>
      </div>
    </section>
  );
}

function StoragePage({ storage }: { storage: StorageUsage | null }) {
  return (
    <section className="grid">
      <div className="card">
        <div className="card-title">Database</div>
        <div className="stat">{formatBytes(storage?.database?.bytes ?? 0)}</div>
      </div>
      <div className="card">
        <div className="card-title">Uploads</div>
        <div className="stat">{formatBytes(storage?.uploads?.bytes ?? 0)}</div>
      </div>
      <div className="card">
        <div className="card-title">Backups</div>
        <div className="stat">{formatBytes(storage?.backups?.bytes ?? 0)}</div>
      </div>
    </section>
  );
}

function LogsPage() {
  const [source, setSource] = useState("app");
  const [tail, setTail] = useState(200);
  const [text, setText] = useState("");

  async function refresh() {
    const data = await api.getLogs(source, tail);
    setText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }

  return (
    <section className="stack">
      <div className="row">
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="app">app</option>
          <option value="daemon">daemon</option>
          <option value="judge0-server">judge0-server</option>
          <option value="judge0-workers">judge0-workers</option>
        </select>
        <input
          type="number"
          min={10}
          value={tail}
          onChange={(event) => setTail(Number(event.target.value))}
        />
        <button onClick={refresh}>Load</button>
      </div>
      <div className="card">
        <pre className="log">{text || "No logs yet"}</pre>
      </div>
    </section>
  );
}

function RepairPage({ onRepair }: { onRepair: () => void }) {
  return (
    <section className="card">
      <div className="card-title">Repair</div>
      <p className="muted">
        Runs integrity checks for releases, configuration, permissions, and Docker availability.
      </p>
      <button onClick={onRepair}>Run repair</button>
    </section>
  );
}

function SettingsPage({
  config,
  onSave,
}: {
  config: ConfigSnapshot | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const cfg = (config?.configJson ?? {}) as Record<string, unknown>;
  const [channel, setChannel] = useState(String(cfg.update_channel ?? "stable"));
  const [telemetry, setTelemetry] = useState(Boolean(cfg.telemetry));

  useEffect(() => {
    setChannel(String(cfg.update_channel ?? "stable"));
    setTelemetry(Boolean(cfg.telemetry));
  }, [config]);

  return (
    <section className="stack">
      <div className="card">
        <div className="card-title">Update Channel</div>
        <div className="row">
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="stable">stable</option>
            <option value="beta">beta</option>
            <option value="nightly">nightly</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Telemetry</div>
        <label className="switch">
          <input type="checkbox" checked={telemetry} onChange={(event) => setTelemetry(event.target.checked)} />
          <span>Enable anonymous metrics</span>
        </label>
      </div>
      <div className="row">
        <button onClick={() => onSave({ ...cfg, update_channel: channel, telemetry })}>Save</button>
      </div>
    </section>
  );
}

function useHashRoute(defaultId: string) {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || defaultId);

  useEffect(() => {
    const onChange = () => {
      setRoute(window.location.hash.replace("#", "") || defaultId);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [defaultId]);

  const set = (next: string) => {
    window.location.hash = next;
    setRoute(next);
  };

  return [route, set] as const;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(1)} ${units[idx]}`;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
