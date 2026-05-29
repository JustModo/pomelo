#!/usr/bin/env bun
import { existsSync } from "fs";

const API_BASE = process.env.POMELO_API_URL ?? "http://127.0.0.1:8462";
const DAEMON_BIN = process.env.POMELO_DAEMON_BIN ?? "/opt/pomelo/installer/bin/pomelod";

const args = Bun.argv.slice(2);

await main();

async function main() {
  if (args.length === 0 || ["-h", "--help"].includes(args[0])) {
    printUsage();
    return;
  }

  const cmd = args[0];
  const rest = args.slice(1);

  switch (cmd) {
    case "start":
      return callDaemon("POST", "/api/start");
    case "stop":
      return callDaemon("POST", "/api/stop");
    case "restart":
      return callDaemon("POST", "/api/restart");
    case "status":
      return callDaemon("GET", "/api/status");
    case "logs":
      return handleLogs(rest);
    case "ui":
      return openUi();
    case "uninstall":
      return handleUninstall(rest);
    default:
      exitWithError(`Unknown command: ${cmd}`, 1);
  }
}

function printUsage() {
  console.log(
    [
      "pomelo <command> [options]",
      "",
      "Commands:",
      "  start | stop | restart | status",
      "  logs [daemon|app|judge0-server|judge0-workers] [--follow] [--tail N]",
      "  ui",
      "  uninstall [--keep-data|--full]"
    ].join("\n")
  );
}

async function callDaemon(method: string, path: string, body?: any) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message = payload?.error || payload?.message || payload || "Unknown error";
      exitWithError(message, payload?.code || res.status);
      return;
    }

    if (payload?.data !== undefined) {
      printJson(payload.data);
    } else if (payload && typeof payload === "object") {
      printJson(payload);
    } else if (payload) {
      console.log(payload);
    }
  } catch (err) {
    exitWithError("Daemon unavailable", 2);
  }
}



async function handleLogs(rest) {
  const follow = rest.includes("--follow");
  const tailIndex = rest.indexOf("--tail");
  const tail = tailIndex >= 0 ? Number(rest[tailIndex + 1]) : 200;
  const source = rest.find((arg) => !arg.startsWith("--")) ?? "app";

  const query = new URLSearchParams({ source, tail: String(tail) });
  if (follow) query.set("follow", "1");

  const url = `${API_BASE}/api/logs?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      exitWithError("Failed to fetch logs", res.status);
      return;
    }
    if (!follow) {
      const text = await res.text();
      console.log(text);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(value);
    }
  } catch {
    exitWithError("Daemon unavailable", 2);
  }
}

async function openUi() {
  await ensureDaemon();
  const url = API_BASE.replace(/\/api$/, "");
  const opener = await which("xdg-open");
  if (!opener) {
    console.log(url);
    return;
  }
  Bun.spawn({ cmd: [opener, url], stdout: "ignore", stderr: "ignore" });
}



async function handleUninstall(rest) {
  let mode = "default";
  if (rest.includes("--keep-data")) mode = "keep-data";
  if (rest.includes("--full")) mode = "full";
  return callDaemon("POST", "/api/uninstall", { mode });
}

async function ensureDaemon() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) return;
  } catch {}
  await startDaemon();
}

async function startDaemon() {
  if (await daemonAlive()) {
    console.log("pomelod is already running");
    return;
  }
  if (!existsSync(DAEMON_BIN)) {
    exitWithError(`Daemon binary not found at ${DAEMON_BIN}`, 1);
  }
  Bun.spawn({
    cmd: [DAEMON_BIN, "--daemon"],
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: { ...process.env },
  });
  await waitForDaemon();
}





async function daemonAlive() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForDaemon(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await daemonAlive()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  exitWithError("pomelod did not start", 2);
}

async function which(cmd) {
  try {
    const proc = Bun.spawn({ cmd: ["which", cmd], stdout: "pipe", stderr: "ignore" });
    const output = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code === 0) return output.trim();
  } catch {}
  return null;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function exitWithError(message, code) {
  console.error(message);
  process.exit(code ?? 1);
}
