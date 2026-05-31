import { useEffect, useState } from "react";
import { api } from "@/api/index.js";
import type { ConfigSnapshot } from "@/types.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, CheckCircle, AlertCircle } from "lucide-react";

export default function EnvironmentPage() {
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);
  const [tab, setTab] = useState("appenv");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable values
  const [appEnv, setAppEnv] = useState("");
  const [configYaml, setConfigYaml] = useState("");
  const [caddyfile, setCaddyfile] = useState("");
  const [judge0, setJudge0] = useState("");

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      setAppEnv(c.appEnv);
      setConfigYaml(c.configYaml);
      setCaddyfile(c.caddyfile);
      setJudge0(c.judge0);
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateConfig({ appEnv, configYaml, caddyfile, judge0 });
      setMessage({ type: "success", text: "Configuration saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
    setSaving(false);
  }

  async function handleValidate() {
    setMessage(null);
    try {
      const result = await api.validateConfig();
      if (result.envErrors?.length) {
        setMessage({ type: "error", text: result.envErrors.join("\n") });
      } else {
        setMessage({ type: "success", text: "Configuration is valid." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="appenv">app.env</TabsTrigger>
          <TabsTrigger value="config">config.yaml</TabsTrigger>
          <TabsTrigger value="caddy">Caddyfile</TabsTrigger>
          <TabsTrigger value="judge0">Judge0 Config</TabsTrigger>
        </TabsList>

        <TabsContent value="appenv">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Main environment variables for the application. Contains database URIs, secrets, and service URLs.
            </p>
            <Textarea
              value={appEnv}
              onChange={(e) => setAppEnv(e.target.value)}
              rows={16}
              className="text-xs"
            />
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Application configuration in YAML format. Includes settings like update channel and telemetry.
            </p>
            <Textarea
              value={configYaml}
              onChange={(e) => setConfigYaml(e.target.value)}
              rows={12}
              className="text-xs font-mono"
            />
          </div>
        </TabsContent>

        <TabsContent value="caddy">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Caddy reverse proxy configuration. Controls domain routing, SSL, and proxy rules.
            </p>
            <Textarea
              value={caddyfile}
              onChange={(e) => setCaddyfile(e.target.value)}
              rows={12}
              className="text-xs"
            />
          </div>
        </TabsContent>

        <TabsContent value="judge0">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Judge0 code execution engine configuration file.
            </p>
            <Textarea
              value={judge0}
              onChange={(e) => setJudge0(e.target.value)}
              rows={10}
              className="text-xs"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <pre className="whitespace-pre-wrap text-xs">{message.text}</pre>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save All"}
        </Button>
        <Button variant="outline" onClick={handleValidate}>
          <CheckCircle className="h-4 w-4" />
          Validate
        </Button>
      </div>
    </div>
  );
}
