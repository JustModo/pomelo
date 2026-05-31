import { useEffect, useState } from "react";
import { api, streamRequest } from "@/api/index.js";
import type { ConfigSnapshot } from "@/types.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, Database, Code, Globe } from "lucide-react";

export default function SetupPage() {
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);

  // Form states
  const [mongoMode, setMongoMode] = useState<"self" | "external">("self");
  const [mongoUri, setMongoUri] = useState("mongodb://mongo:27017/pomelo");
  const [mongoSaving, setMongoSaving] = useState(false);

  const [judgeMode, setJudgeMode] = useState<"self" | "external">("self");
  const [judgeUrl, setJudgeUrl] = useState("http://judge0-server:2358");
  const [judgeSaving, setJudgeSaving] = useState(false);

  const [domain, setDomain] = useState("localhost");
  const [protocol, setProtocol] = useState<"http" | "https">("http");
  const [domainSaving, setDomainSaving] = useState(false);

  // Status/Log state
  const [actionLog, setActionLog] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const c = await api.getConfig();
      setConfig(c);
      const env = parseEnv(c.appEnv);
      
      if (env.MONGODB_URI) {
        const isSelf = env.MONGODB_URI.includes("mongo:27017");
        setMongoMode(isSelf ? "self" : "external");
        setMongoUri(env.MONGODB_URI);
      }
      if (env.JUDGE0_URL) {
        const isSelf = env.JUDGE0_URL.includes("judge0-server");
        setJudgeMode(isSelf ? "self" : "external");
        setJudgeUrl(env.JUDGE0_URL);
      }
      if (env.DOMAIN) setDomain(env.DOMAIN);
      if (env.PROTOCOL) setProtocol(env.PROTOCOL as "http" | "https");
    } catch {}
  }

  function updateEnvContent(content: string, updates: Record<string, string>) {
    const lines = (content || "").split(/\r?\n/);
    const newLines = [];
    const updatedKeys = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        newLines.push(line);
        continue;
      }
      const idx = trimmed.indexOf("=");
      if (idx === -1) {
        newLines.push(line);
        continue;
      }
      const key = trimmed.slice(0, idx).trim();
      if (key in updates) {
        newLines.push(`${key}=${updates[key]}`);
        updatedKeys.add(key);
      } else {
        newLines.push(line);
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }

    return newLines.join("\n");
  }

  function buildCaddyfile(dom: string, proto: string) {
    if (proto === "https") {
      return [
        `https://${dom} {`,
        "  encode zstd gzip",
        "  reverse_proxy client:3000",
        "}",
        "",
      ].join("\n");
    }
    return [
      "{",
      "  auto_https off",
      "}",
      "",
      `http://${dom}:80 {`,
      "  encode zstd gzip",
      "  reverse_proxy client:3000",
      "}",
      "",
    ].join("\n");
  }

  async function performRestart() {
    setActionLog("Restarting containers to apply changes...\n");
    try {
      const result = await streamRequest("/restart", { method: "POST" });
      setActionLog((prev) => (prev ?? "") + result.output + `\n[${result.exitCode === 0 ? "Done" : "Failed"}]`);
    } catch (err: any) {
      setActionLog((prev) => (prev ?? "") + `\nError: ${err.message}`);
    }
  }

  async function handleSaveMongo() {
    setMongoSaving(true);
    try {
      const finalMongoUri = mongoMode === "self" ? "mongodb://mongo:27017/pomelo" : mongoUri;
      const newEnv = updateEnvContent(config?.appEnv || "", { MONGODB_URI: finalMongoUri });
      await api.updateConfig({ appEnv: newEnv });
      await loadConfig();
      await performRestart();
    } catch (err: any) {
      setActionLog(`Error: ${err.message}`);
    }
    setMongoSaving(false);
  }

  async function handleSaveJudge() {
    setJudgeSaving(true);
    try {
      const finalJudgeUrl = judgeMode === "self" ? "http://judge0-server:2358" : judgeUrl;
      const newEnv = updateEnvContent(config?.appEnv || "", { JUDGE0_URL: finalJudgeUrl });
      await api.updateConfig({ appEnv: newEnv });
      await loadConfig();
      await performRestart();
    } catch (err: any) {
      setActionLog(`Error: ${err.message}`);
    }
    setJudgeSaving(false);
  }

  async function handleSaveDomain() {
    setDomainSaving(true);
    try {
      const newEnv = updateEnvContent(config?.appEnv || "", { DOMAIN: domain, PROTOCOL: protocol });
      const newCaddy = buildCaddyfile(domain, protocol);
      await api.updateConfig({ appEnv: newEnv, caddyfile: newCaddy });
      await loadConfig();
      await performRestart();
    } catch (err: any) {
      setActionLog(`Error: ${err.message}`);
    }
    setDomainSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Configuration Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure the core services for your Pomelo deployment. Saving any section will automatically restart the required containers to apply the changes.
        </p>
      </div>

      {actionLog && (
        <div className="bg-muted border rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide">Deployment Output</h4>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setActionLog(null)}>Dismiss</Button>
          </div>
          <pre className="text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">{actionLog}</pre>
        </div>
      )}

      <div className="space-y-10">
        {/* MongoDB Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-medium">MongoDB</h3>
          </div>
          <div className="pl-7 space-y-5">
            <RadioGroup value={mongoMode} onValueChange={(v) => setMongoMode(v as "self" | "external")} className="gap-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="self" id="mongo-self" className="mt-0.5" />
                <div>
                  <Label htmlFor="mongo-self" className="cursor-pointer">Self-hosted (Docker)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Uses the bundled MongoDB container. Recommended for most setups.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="external" id="mongo-ext" className="mt-0.5" />
                <div>
                  <Label htmlFor="mongo-ext" className="cursor-pointer">External MongoDB</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect to your own MongoDB Atlas or self-managed instance.</p>
                </div>
              </div>
            </RadioGroup>
            {mongoMode === "external" && (
              <div className="space-y-2">
                <Label htmlFor="mongo-uri">MongoDB URI</Label>
                <Input
                  id="mongo-uri"
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                  placeholder="mongodb+srv://user:pass@cluster.example.com/pomelo"
                  className="font-mono text-xs"
                />
              </div>
            )}
            <Button onClick={handleSaveMongo} disabled={mongoSaving}>
              {mongoSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save & Restart
            </Button>
          </div>
        </section>

        <Separator />

        {/* Judge0 Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <h3 className="text-lg font-medium">Judge0 Engine</h3>
          </div>
          <div className="pl-7 space-y-5">
            <RadioGroup value={judgeMode} onValueChange={(v) => setJudgeMode(v as "self" | "external")} className="gap-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="self" id="judge-self" className="mt-0.5" />
                <div>
                  <Label htmlFor="judge-self" className="cursor-pointer">Self-hosted (Docker)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Runs Judge0 server and workers in Docker. Requires privileged mode.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="external" id="judge-ext" className="mt-0.5" />
                <div>
                  <Label htmlFor="judge-ext" className="cursor-pointer">External Judge0</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect to a separately hosted Judge0 instance.</p>
                </div>
              </div>
            </RadioGroup>
            {judgeMode === "external" && (
              <div className="space-y-2">
                <Label htmlFor="judge-url">Judge0 URL</Label>
                <Input
                  id="judge-url"
                  value={judgeUrl}
                  onChange={(e) => setJudgeUrl(e.target.value)}
                  placeholder="https://judge0.example.com:2358"
                  className="font-mono text-xs"
                />
              </div>
            )}
            <Button onClick={handleSaveJudge} disabled={judgeSaving}>
              {judgeSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save & Restart
            </Button>
          </div>
        </section>

        <Separator />

        {/* Domain Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <h3 className="text-lg font-medium">Domain & Protocol</h3>
          </div>
          <div className="pl-7 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                The domain where Pomelo will be accessible. Use <code className="text-xs bg-muted px-1 rounded">localhost</code> for local development.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label>Protocol</Label>
              <RadioGroup value={protocol} onValueChange={(v) => setProtocol(v as "http" | "https")} className="gap-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="http" id="proto-http" className="mt-0.5" />
                  <div>
                    <Label htmlFor="proto-http" className="cursor-pointer">HTTP</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">No SSL. Suitable for local or internal use.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="https" id="proto-https" className="mt-0.5" />
                  <div>
                    <Label htmlFor="proto-https" className="cursor-pointer">HTTPS</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Caddy will automatically provision SSL certificates via Let's Encrypt.</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleSaveDomain} disabled={domainSaving}>
              {domainSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save & Restart
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}
