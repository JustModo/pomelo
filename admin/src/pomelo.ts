#!/usr/bin/env bun
import { existsSync } from "fs";

const API_BASE = process.env.POMELO_API_URL ?? "http://127.0.0.1:8462";
const DAEMON_BIN = process.env.POMELO_DAEMON_BIN ?? "/opt/pomelo/installer/bin/pomelod"; // will use $POMELO_ROOT/app/admin/bin/pomelod in reality if not set, wait, wait, DAEMON_BIN should use POMELO_ROOT if available. Let's fix that too.
const APP_ROOT = process.env.POMELO_ROOT ?? "/opt/pomelo";
const DEFAULT_DAEMON_BIN = `${APP_ROOT}/app/admin/bin/pomelod`;

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function logInfo(msg: string) { console.log(`${colors.blue}[INFO]${colors.reset}    ${msg}`); }
function logSuccess(msg: string) { console.log(`${colors.green}[  OK  ]${colors.reset}  ${msg}`); }
function logWarn(msg: string) { console.log(`${colors.yellow}[WARN]${colors.reset}    ${msg}`); }
function logError(msg: string) { console.error(`${colors.red}[ERROR]${colors.reset}   ${msg}`); }
function logStep(msg: string) { console.log(`\n${colors.bold}${colors.cyan}──── ${msg} ────${colors.reset}`); }

function printBanner() {
  console.log("");
  console.log(`${colors.bold}${colors.green}  ╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  ║                 ${colors.reset}${colors.bold}Pomelo CLI${colors.green}                    ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  ╚═══════════════════════════════════════════════╝${colors.reset}`);
  console.log("");
}

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
      logStep("Starting Pomelo Services");
      return handleStreamingCommand("POST", "/api/start", "Services started successfully");
    case "stop":
      logStep("Stopping Pomelo Services");
      return handleStreamingCommand("POST", "/api/stop", "Services stopped successfully");
    case "restart":
      logStep("Restarting Pomelo Services");
      return handleStreamingCommand("POST", "/api/restart", "Services restarted successfully");
    case "status":
      return handleStatus();
    case "logs":
      return handleLogs(rest);
    case "ui":
      return openUi();
    case "uninstall":
      logStep("Uninstalling Pomelo");
      return handleUninstall(rest);
    default:
      exitWithError(`Unknown command: ${cmd}`, 1);
  }
}

function printUsage() {
  printBanner();
  console.log(`${colors.bold}Usage:${colors.reset}`);
  console.log(`  pomelo <command> [options]`);
  console.log("");
  console.log(`${colors.bold}Commands:${colors.reset}`);
  console.log(`  ${colors.cyan}start${colors.reset}      Start all services`);
  console.log(`  ${colors.cyan}stop${colors.reset}       Stop all services`);
  console.log(`  ${colors.cyan}restart${colors.reset}    Restart all services`);
  console.log(`  ${colors.cyan}status${colors.reset}     Check service and system status`);
  console.log(`  ${colors.cyan}logs${colors.reset}       View logs (daemon, app, judge0-server, judge0-workers)`);
  console.log(`  ${colors.cyan}ui${colors.reset}         Open the admin panel in browser`);
  console.log(`  ${colors.cyan}uninstall${colors.reset}  Uninstall Pomelo (use --full to remove data)`);
  console.log("");
  console.log(`${colors.bold}Options for 'logs':${colors.reset}`);
  console.log(`  pomelo logs [source] [--follow] [--tail N]`);
  console.log(`  (Default source is 'app')`);
  console.log("");
}

async function fetchDaemon(method: string, path: string, body?: any) {
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
      throw new Error(message);
    }
    return payload;
  } catch (err: any) {
    if (err.message === "fetch failed" || err.message.includes("Connection refused")) {
      exitWithError("Pomelo daemon is unavailable. Is it running?", 2);
    }
    exitWithError(err.message || "Unknown error", 1);
  }
}

async function handleSimpleCommand(method: string, path: string, successMessage: string, body?: any) {
  const payload = await fetchDaemon(method, path, body);
  if (payload?.data?.output) {
    console.log("");
    console.log(payload.data.output);
    console.log("");
  }
  logSuccess(successMessage);
}

async function handleStreamingCommand(method: string, path: string, successMessage: string) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, { method });

    // If the daemon returned a JSON error (e.g. "Docker unavailable")
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      if (contentType.includes("application/json")) {
        const payload = await res.json();
        exitWithError(payload?.error || "Request failed", payload?.code || 1);
      } else {
        exitWithError(await res.text() || `Request failed (${res.status})`, 1);
      }
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      logSuccess(successMessage);
      return;
    }

    const decoder = new TextDecoder();
    let exitCode = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const text = decoder.decode(value, { stream: true });
        // Check for exit code marker
        const exitMatch = text.match(/\[POMELO_EXIT:(\d+)\]/);
        if (exitMatch) {
          exitCode = parseInt(exitMatch[1], 10);
          // Print everything except the marker line
          const clean = text.replace(/\n?\[POMELO_EXIT:\d+\]\n?/g, "");
          if (clean) process.stdout.write(clean);
        } else {
          process.stdout.write(text);
        }
      }
    }

    console.log("");
    if (exitCode === 0) {
      logSuccess(successMessage);
    } else {
      exitWithError(`Command failed with exit code ${exitCode}`, exitCode);
    }
  } catch (err: any) {
    if (err.message === "fetch failed" || err.message?.includes("Connection refused")) {
      exitWithError("Pomelo daemon is unavailable. Is it running?", 2);
    }
    exitWithError(err.message || "Unknown error", 1);
  }
}

async function handleStatus() {
  logStep("System Status");
  const payload = await fetchDaemon("GET", "/api/status");
  const data = payload?.data;
  
  if (!data) {
    logError("Received invalid status data from daemon.");
    return;
  }

  console.log(`  ${colors.bold}Version:${colors.reset}        ${data.currentVersion || "unknown"}`);
  console.log(`  ${colors.bold}Docker Ready:${colors.reset}   ${data.dockerAvailable ? colors.green + "Yes" + colors.reset : colors.red + "No" + colors.reset}`);
  
  if (data.operation && data.operation.status !== "idle") {
    console.log(`  ${colors.bold}Operation:${colors.reset}      ${colors.yellow}${data.operation.name} (${data.operation.status})${colors.reset}`);
  } else {
    console.log(`  ${colors.bold}Operation:${colors.reset}      ${colors.dim}Idle${colors.reset}`);
  }
  
  console.log("");
  
  if (data.containers && data.containers.length > 0) {
    console.log(`  ${colors.bold}Containers:${colors.reset}`);
    for (const container of data.containers) {
      const name = container.Name || container.name || "unknown";
      const state = container.State || container.state || "unknown";
      const statusStr = container.Status || container.status || "";
      
      const stateColor = state.toLowerCase() === "running" ? colors.green : colors.red;
      console.log(`    ${colors.cyan}${name.padEnd(20)}${colors.reset} ${stateColor}${state.padEnd(10)}${colors.reset} ${colors.dim}${statusStr}${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.dim}No containers are currently running.${colors.reset}`);
  }
  console.log("");
}

async function handleLogs(rest: string[]) {
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
      exitWithError(`Failed to fetch logs: ${res.statusText}`, res.status);
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
  
  logStep("Opening Admin UI");
  console.log(`  ${colors.bold}URL:${colors.reset} ${colors.cyan}${url}${colors.reset}`);
  console.log("");
  
  if (!opener) {
    logInfo("Could not find a browser opener (xdg-open). Please open the URL manually.");
    return;
  }
  
  Bun.spawn({ cmd: [opener, url], stdout: "ignore", stderr: "ignore" });
  logSuccess("Browser opened.");
}

async function handleUninstall(rest: string[]) {
  let mode = "default";
  if (rest.includes("--keep-data")) mode = "keep-data";
  if (rest.includes("--full")) mode = "full";
  
  logWarn("You are about to uninstall Pomelo.");
  if (mode === "full") {
    logWarn(`This will ${colors.red}ALSO delete all data, database, and configurations!${colors.reset}`);
  } else if (mode === "keep-data") {
    logInfo("Data and configuration will be preserved.");
  } else {
    logInfo("Configuration will be deleted, but data preserved.");
  }
  
  process.stdout.write(`\n  ${colors.bold}${colors.magenta}▸${colors.reset} Are you sure you want to proceed? [y/N]: `);
  
  const confirm = await new Promise<string>((resolve) => {
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
  
  if (confirm.toLowerCase() !== "y") {
    console.log("\n  Aborted.");
    process.exit(0);
  }
  
  console.log("");
  await handleSimpleCommand("POST", "/api/uninstall", "Pomelo uninstalled successfully.", { mode });
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
    logInfo("pomelod is already running");
    return;
  }
  const daemonBin = process.env.POMELO_DAEMON_BIN ?? DEFAULT_DAEMON_BIN;
  if (!existsSync(daemonBin)) {
    exitWithError(`Daemon binary not found at ${daemonBin}`, 1);
  }
  logInfo("Starting daemon...");
  Bun.spawn({
    cmd: [daemonBin, "--daemon"],
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

async function which(cmd: string) {
  try {
    const proc = Bun.spawn({ cmd: ["which", cmd], stdout: "pipe", stderr: "ignore" });
    const output = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code === 0) return output.trim();
  } catch {}
  return null;
}

function exitWithError(message: string, code: number) {
  logError(message);
  process.exit(code ?? 1);
}
