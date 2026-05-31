import { useState } from "react";
import { api } from "@/api/index.js";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";

const SOURCES = [
  { value: "daemon", label: "Daemon" },
  { value: "client", label: "Client" },
  { value: "server", label: "Server" },
  { value: "mongo", label: "Mongo" },
  { value: "caddy", label: "Caddy" },
  { value: "judge0-server", label: "Judge0 Server" },
  { value: "judge0-workers", label: "Judge0 Workers" },
  { value: "judge0-db", label: "Judge0 Database" },
  { value: "judge0-redis", label: "Judge0 Redis" },
];

export default function LogsPage() {
  const [source, setSource] = useState("client");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getLogs(source, 500);
      setText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err: any) {
      setText(`Error: ${err.message}`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Source</label>
          <Select
            value={source}
            onValueChange={setSource}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadLogs} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Load"}
        </Button>
      </div>

      <Separator />

      {/* Log Output */}
      <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-auto max-h-[calc(100vh-280px)] min-h-[200px] whitespace-pre-wrap text-foreground/80">
        {text || "No logs loaded. Select a source and click Load."}
      </pre>
    </div>
  );
}
