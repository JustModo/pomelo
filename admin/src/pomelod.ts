#!/usr/bin/env bun
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const args = parseArgs(Bun.argv.slice(2));
if (args.root) process.env.POMELO_ROOT = args.root;
if (args.host) process.env.POMELO_HOST = args.host;
if (args.port) process.env.POMELO_PORT = String(args.port);
if (args.appCompose) process.env.POMELO_APP_COMPOSE = args.appCompose;
if (args.judgeCompose) process.env.POMELO_JUDGE0_COMPOSE = args.judgeCompose;

if (args.daemonize) {
  spawnDaemon(args);
  process.exit(0);
}

const paths = getPaths();
ensureBase(paths);

const logFile = join(paths.logsDir, "pomelod.log");
const pidFile = join(paths.runtimeDir, "daemon.pid");
writeFileSync(pidFile, String(process.pid));
logInfo(`pomelod pid ${process.pid}`);

const server = Bun.serve({
  hostname: paths.apiHost,
  port: paths.apiPort,
  fetch: handleRequest,
  idleTimeout: 255,
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logInfo(`pomelod listening on http://${paths.apiHost}:${paths.apiPort}`);

let currentOperation: Record<string, any> = { status: "idle" };

async function handleRequest(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  if (path.startsWith("/api/")) {
    return handleApi(req, url, method);
  }

  return serveUi(path);
}

async function handleApi(req, url, method) {
  try {
    if (method === "GET" && url.pathname === "/api/health") {
      return json({ status: "ok" });
    }

    if (method === "GET" && url.pathname === "/api/status") {
      return json({ status: "ok", data: await getStatus() });
    }

    if (method === "POST" && url.pathname === "/api/start") {
      return streamComposeResponse("start", ["up", "-d"]);
    }

    if (method === "POST" && url.pathname === "/api/stop") {
      return streamComposeResponse("stop", ["stop"]);
    }

    if (method === "POST" && url.pathname === "/api/restart") {
      return streamComposeResponse("restart", ["up", "-d"]);
    }

    if (method === "GET" && url.pathname === "/api/logs") {
      return logsResponse(url.searchParams);
    }

    if (method === "GET" && url.pathname === "/api/config") {
      return json({ status: "ok", data: getConfigSnapshot() });
    }

    if (method === "PUT" && url.pathname === "/api/config") {
      const body = await readJson(req);
      return json({ status: "ok", data: updateConfig(body) });
    }

    if (method === "POST" && url.pathname === "/api/config/validate") {
      return json({ status: "ok", data: validateConfig() });
    }

    if (method === "POST" && url.pathname === "/api/uninstall") {
      const body = await readJson(req);
      return json({ status: "ok", data: await uninstall(body.mode) });
    }

    if (method === "GET" && url.pathname === "/api/storage") {
      return json({ status: "ok", data: await getStorageUsage() });
    }

    return errorResponse("Not found", 1, 404);
  } catch (err) {
    const { message, code } = normalizeError(err);
    return errorResponse(message, code ?? 1, 500);
  }
}

function serveUi(pathname) {
  const dist = paths.uiDistDir;
  if (!existsSync(dist)) {
    return new Response("UI build not found", { status: 404 });
  }

  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(dist, requested);
  if (existsSync(filePath) && !lstatSync(filePath).isDirectory()) {
    return new Response(Bun.file(filePath));
  }

  const indexPath = join(dist, "index.html");
  if (existsSync(indexPath)) {
    return new Response(Bun.file(indexPath));
  }

  return new Response("UI not available", { status: 404 });
}

function json(payload, status = 200) {
  return Response.json(payload, { status });
}

function errorResponse(message, code = 1, status = 400) {
  return Response.json({ status: "error", error: message, code }, { status });
}

function normalizeError(err) {
  if (!err) return { message: "Unknown error" };
  if (typeof err === "string") return { message: err };
  if (err instanceof Error) {
    return { message: err.message, code: (err as any).code };
  }
  return { message: "Unknown error" };
}

async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function parseArgs(argv) {
  const out: Record<string, any> = { daemonize: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--daemon") {
      out.daemonize = true;
      continue;
    }
    if (arg === "--foreground") {
      out.daemonize = false;
      continue;
    }
    if (arg === "--root") {
      out.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--host") {
      out.host = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--port") {
      out.port = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--app-compose") {
      out.appCompose = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--judge-compose") {
      out.judgeCompose = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return out;
}

function spawnDaemon(args) {
  const isCompiled = import.meta.url.includes("$bunfs");
  const scriptPath = fileURLToPath(import.meta.url);
  const cmd = isCompiled ? [process.execPath, "--foreground"] : [process.execPath, scriptPath, "--foreground"];
  if (args.root) cmd.push("--root", args.root);
  if (args.host) cmd.push("--host", args.host);
  if (args.port) cmd.push("--port", String(args.port));
  if (args.appCompose) cmd.push("--app-compose", args.appCompose);
  if (args.judgeCompose) cmd.push("--judge-compose", args.judgeCompose);

  Bun.spawn({
    cmd,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: { ...process.env },
  });
}

function getPaths() {
  const root = process.env.POMELO_ROOT ?? "/opt/pomelo";
  const apiHost = process.env.POMELO_HOST ?? "127.0.0.1";
  const apiPort = Number(process.env.POMELO_PORT ?? "8462");
  const configDir = join(root, "config");
  const dataDir = join(root, "data");
  const runtimeDir = join(root, "runtime");
  const logsDir = join(runtimeDir, "logs");
  const tmpDir = join(runtimeDir, "tmp");
  const uiDistDir = join(root, "app", "admin", "dist");
  const envFile = join(configDir, "app.env");
  const configFile = join(configDir, "config.json");
  const caddyFile = join(configDir, "Caddyfile");
  const judge0File = join(configDir, "judge0.conf");
  return {
    root,
    apiHost,
    apiPort,
    configDir,
    dataDir,
    runtimeDir,
    logsDir,
    tmpDir,
    uiDistDir,
    envFile,
    configFile,
    caddyFile,
    judge0File,
  };
}

function getComposeConfig() {
  return {
    app: process.env.POMELO_APP_COMPOSE ?? "docker/app/docker-compose.yaml",
    judge: process.env.POMELO_JUDGE0_COMPOSE ?? "docker/judge0/docker-compose.yaml",
    project: process.env.POMELO_DOCKER_PROJECT ?? "pomelo",
  };
}

function ensureBase(p) {
  mkdirSync(p.configDir, { recursive: true });
  mkdirSync(p.dataDir, { recursive: true });
  mkdirSync(p.runtimeDir, { recursive: true });
  mkdirSync(p.logsDir, { recursive: true });
  mkdirSync(p.tmpDir, { recursive: true });
}

function logInfo(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  appendFileSync(logFile, line);
}

function logError(message) {
  const line = `[${new Date().toISOString()}] ERROR: ${message}\n`;
  appendFileSync(logFile, line);
}

function shutdown(signal) {
  logInfo(`pomelod shutting down (${signal})`);
  try {
    unlinkSync(join(paths.runtimeDir, "daemon.pid"));
  } catch { }
  server.stop();
  process.exit(0);
}

async function run(cmd: string, args: string[], options: Record<string, any> = {}) {
  const proc = Bun.spawn({
    cmd: [cmd, ...args],
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const code = await proc.exited;
  return { code, stdout, stderr };
}

async function dockerAvailable() {
  const res = await run("docker", ["info"]);
  return res.code === 0;
}

function composeArgs(releaseDir, extraArgs) {
  const cfg = getComposeConfig();
  return [
    "compose",
    "--project-name",
    cfg.project,
    "--env-file",
    paths.envFile,
    "-f",
    cfg.app,
    "-f",
    cfg.judge,
    "--project-directory",
    releaseDir,
    ...extraArgs,
  ];
}

async function compose(releaseDir, extraArgs) {
  return run("docker", composeArgs(releaseDir, extraArgs), { cwd: releaseDir });
}




async function streamComposeResponse(operation: string, composeExtraArgs: string[]) {
  // Check exclusivity
  if (currentOperation.status === "running") {
    return errorResponse("Another operation is in progress", 1);
  }

  // Check docker
  if (!(await dockerAvailable())) {
    return errorResponse("Docker unavailable", 3, 503);
  }

  const releaseDir = getCurrentReleaseDir();

  // Ensure config for start/restart
  if (operation === "start" || operation === "restart") {
    ensureConfigDefaults(releaseDir);
  }

  currentOperation = { status: "running", name: operation, startedAt: new Date().toISOString() };

  const proc = Bun.spawn({
    cmd: ["docker", ...composeArgs(releaseDir, composeExtraArgs)],
    cwd: releaseDir,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const encoder = new TextEncoder();
  let stdoutDone = false;
  let stderrDone = false;

  const stream = new ReadableStream({
    start(controller) {
      const tryClose = (exitCode: number) => {
        if (stdoutDone && stderrDone) {
          currentOperation = { status: "idle" };
          controller.enqueue(encoder.encode(`\n[POMELO_EXIT:${exitCode}]\n`));
          controller.close();
        }
      };

      proc.stdout.pipeTo(new WritableStream({
        write(chunk) { controller.enqueue(chunk); },
        close() { stdoutDone = true; },
      }));
      proc.stderr.pipeTo(new WritableStream({
        write(chunk) { controller.enqueue(chunk); },
        close() { stderrDone = true; },
      }));

      proc.exited.then((exitCode) => {
        // Wait briefly for pipes to flush
        setTimeout(() => {
          stdoutDone = true;
          stderrDone = true;
          tryClose(exitCode);
        }, 100);
      });
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}





function getCurrentReleaseDir() {
  return join(paths.root, "app");
}

async function getStatus() {
  const current = "local";
  const dockerOk = await dockerAvailable();
  let containers = [];
  {
    const res = await compose(join(paths.root, "app"), ["ps", "--format", "json"]);
    if (res.code === 0 && res.stdout.trim()) {
      try {
        containers = JSON.parse(res.stdout);
      } catch {
        containers = [];
      }
    }
  }

  return {
    currentVersion: current,
    dockerAvailable: dockerOk,
    releases: [],
    containers,
    operation: currentOperation,
  };
}

async function getStorageUsage() {
  const targets = {
    database: join(paths.dataDir, "database"),
    uploads: join(paths.dataDir, "uploads"),
    backups: join(paths.dataDir, "backups"),
  };
  const usage = {};
  for (const [key, dir] of Object.entries(targets)) {
    usage[key] = await diskUsage(dir);
  }
  return usage;
}

async function diskUsage(path) {
  if (!existsSync(path)) return { bytes: 0 };
  const res = await run("du", ["-sk", path]);
  if (res.code !== 0 || !res.stdout.trim()) return { bytes: 0 };
  const sizeKb = Number(res.stdout.trim().split(/\s+/)[0]);
  return { bytes: sizeKb * 1024 };
}

async function logsResponse(params) {
  const source = params.get("source") ?? "app";
  const follow = params.get("follow") === "1";
  const tail = Number(params.get("tail") ?? "200");

  if (source === "daemon") {
    const content = tailFile(logFile, tail);
    return new Response(content, { headers: { "content-type": "text/plain" } });
  }

  const releaseDir = getCurrentReleaseDir();

  const serviceArgs = source === "app" ? [] : [source];
  const args = ["logs", "--no-color", "--tail", String(tail), ...serviceArgs];
  if (follow) args.splice(1, 0, "--follow");

  const proc = Bun.spawn({
    cmd: ["docker", ...composeArgs(releaseDir, args)],
    cwd: releaseDir,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const stream = new ReadableStream({
    start(controller) {
      proc.stdout.pipeTo(
        new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
        })
      );
      proc.stderr.pipeTo(
        new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
        })
      );
      proc.exited.then(() => controller.close());
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain" } });
}

function tailFile(path, lines) {
  if (!existsSync(path)) return "";
  const content = readFileSync(path, "utf8");
  const parts = content.split(/\r?\n/);
  return parts.slice(-lines).join("\n");
}

function getConfigSnapshot() {
  const appEnv = existsSync(paths.envFile) ? readFileSync(paths.envFile, "utf8") : "";
  const configJson = readJsonFile(paths.configFile) ?? {};
  const caddyfile = existsSync(paths.caddyFile) ? readFileSync(paths.caddyFile, "utf8") : "";
  const judge0 = existsSync(paths.judge0File) ? readFileSync(paths.judge0File, "utf8") : "";
  return { appEnv, configJson, caddyfile, judge0 };
}

function updateConfig(payload) {
  if (typeof payload.appEnv === "string") {
    writeFileSync(paths.envFile, payload.appEnv);
  }
  if (payload.configJson && typeof payload.configJson === "object") {
    writeFileSync(paths.configFile, JSON.stringify(payload.configJson, null, 2));
  }
  if (typeof payload.caddyfile === "string") {
    writeFileSync(paths.caddyFile, payload.caddyfile);
  }
  if (typeof payload.judge0 === "string") {
    writeFileSync(paths.judge0File, payload.judge0);
  }
  return { saved: true };
}

function validateConfig() {
  const appEnv = existsSync(paths.envFile) ? readFileSync(paths.envFile, "utf8") : "";
  const envErrors = validateEnv(appEnv);
  return { envErrors };
}

function readJsonFile(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function validateEnv(content) {
  const env = parseEnv(content);
  const required = [
    "DOMAIN",
    "AUTH_SECRET",
    "MONGODB_URI",
    "JUDGE0_URL",
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
  ];
  const errors = [];
  for (const key of required) {
    if (!env[key]) errors.push(`${key} is required`);
  }
  return errors;
}

function parseEnv(content) {
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function isValidPort(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && num < 65536;
}




function ensureConfigDefaults(releaseDir) {
  if (!existsSync(paths.envFile)) {
    writeFileSync(paths.envFile, defaultEnv());
  }

  if (!existsSync(paths.configFile)) {
    writeFileSync(paths.configFile, "{}\n");
  }

  if (!existsSync(paths.caddyFile)) {
    const caddy = join(releaseDir, "config", "caddy", "Caddyfile");
    if (existsSync(caddy)) {
      writeFileSync(paths.caddyFile, readFileSync(caddy, "utf8"));
    } else {
      writeFileSync(paths.caddyFile, defaultCaddyfile());
    }
  }

  if (!existsSync(paths.judge0File)) {
    const judge0 = join(releaseDir, "config", "judge0", "judge0.conf");
    if (existsSync(judge0)) {
      writeFileSync(paths.judge0File, readFileSync(judge0, "utf8"));
    }
  }
}

function genSecret(length = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function defaultEnv() {
  return [
    "# Auto-generated by pomelod fallback",
    "DOMAIN=localhost",
    `AUTH_SECRET=${genSecret(64)}`,
    "MONGODB_URI=mongodb://mongo:27017/pomelo",
    "JUDGE0_URL=http://judge0-server:2358",
    `POSTGRES_PASSWORD=${genSecret(64)}`,
    `REDIS_PASSWORD=${genSecret(64)}`,
    "",
  ].join("\n");
}

function upsertEnv(text, key, value) {
  const lines = text.split(/\r?\n/);
  let found = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  return next.join("\n");
}

function defaultCaddyfile() {
  return [
    "{",
    "  auto_https off",
    "}",
    "",
    ":80 {",
    "  encode zstd gzip",
    "  @api path /api/*",
    "  reverse_proxy @api server:8080",
    "  reverse_proxy client:3000",
    "}",
    "",
  ].join("\n");
}


async function requireDocker() {
  if (!(await dockerAvailable())) {
    throw createError("Docker unavailable", 3);
  }
}

async function runExclusive(name, fn) {
  if (currentOperation.status === "running") {
    throw createError("Another operation is in progress", 1);
  }
  currentOperation = { status: "running", name, startedAt: new Date().toISOString() };
  try {
    return await fn();
  } finally {
    currentOperation = { status: "idle" };
  }
}

function createError(message, code) {
  const err = new Error(message);
  (err as any).code = code;
  return err;
}


async function uninstall(mode = "default") {
  // 1. Stop Docker services
  const currentDir = getCurrentReleaseDir();
  let output = "";
  if (currentDir && existsSync(currentDir)) {
    try {
      const res = await compose(currentDir, ["down"]);
      output = (res.stderr + "\n" + res.stdout).trim();
    } catch (e) { }
  }

  // 2. Clean up systemd service (disable + remove — don't stop, we ARE the service)
  const serviceFile = "/etc/systemd/system/pomelod.service";
  try {
    await run("systemctl", ["disable", "pomelod"]);
  } catch (e) { }
  try {
    if (existsSync(serviceFile)) {
      unlinkSync(serviceFile);
      logInfo("Removed systemd service file");
    }
  } catch (e) { }
  try {
    await run("systemctl", ["daemon-reload"]);
  } catch (e) { }

  // 3. Remove CLI symlink
  const cliSymlink = "/usr/local/bin/pomelo";
  try {
    if (existsSync(cliSymlink)) {
      unlinkSync(cliSymlink);
      logInfo("Removed CLI symlink");
    }
  } catch (e) { }

  // 4. Remove application files
  try {
    rmSync(join(paths.root, "app"), { recursive: true, force: true });
  } catch (e) { }
  try {
    rmSync(paths.runtimeDir, { recursive: true, force: true });
  } catch (e) { }
  if (mode === "full") {
    try {
      rmSync(paths.dataDir, { recursive: true, force: true });
      rmSync(paths.configDir, { recursive: true, force: true });
    } catch (e) { }
  }
  if (mode !== "keep-data" && mode !== "full") {
    try {
      rmSync(paths.configDir, { recursive: true, force: true });
    } catch (e) { }
  }
  return { status: "uninstalled", mode, output };
}
