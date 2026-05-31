import { useState } from "react";
import { streamRequest } from "@/api/index.js";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [uninstallMode, setUninstallMode] = useState("keep-data");
  const [uninstallLog, setUninstallLog] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  async function handleUninstall() {
    setUninstalling(true);
    setUninstallLog("Starting uninstall...\n");
    try {
      const result = await streamRequest("/uninstall", {
        method: "POST",
        body: JSON.stringify({ mode: uninstallMode }),
      });
      setUninstallLog((prev) => (prev ?? "") + result.output + `\n[${result.exitCode === 0 ? "Done" : "Failed"}]`);
    } catch (err: any) {
      setUninstallLog((prev) => (prev ?? "") + `\nError: ${err.message}`);
    }
    setUninstalling(false);
    setConfirmUninstall(false);
  }

  return (
    <div className="max-w-2xl">
      <section className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground">Uninstall Mode</Label>
            <RadioGroup value={uninstallMode} onValueChange={setUninstallMode} className="gap-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="keep-data" id="mode-keep" className="mt-0.5" />
                <div>
                  <Label htmlFor="mode-keep" className="cursor-pointer">Soft Uninstall (Keep Data)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Removes the application containers but keeps all configuration files, databases, and user uploads intact. Use this to reset the app safely.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="full" id="mode-full" className="mt-0.5 border-destructive text-destructive" />
                <div>
                  <Label htmlFor="mode-full" className="cursor-pointer text-destructive">Hard Uninstall (Delete Everything)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Completely removes the application, configuration, and <strong className="text-foreground">all user data</strong>. This action is destructive and cannot be undone.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            {!confirmUninstall ? (
              <Button
                variant="destructive"
                onClick={() => setConfirmUninstall(true)}
                disabled={uninstalling}
              >
                <Trash2 className="h-4 w-4" />
                Uninstall Pomelo
              </Button>
            ) : (
              <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 p-4 rounded-md">
                <p className="text-sm text-destructive font-medium">Are you absolutely sure?</p>
                <Button variant="destructive" onClick={handleUninstall} disabled={uninstalling}>
                  {uninstalling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uninstalling ? "Uninstalling..." : "Yes, Uninstall"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmUninstall(false)} disabled={uninstalling}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {uninstallLog && (
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-auto max-h-64 whitespace-pre-wrap border">
              {uninstallLog}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
