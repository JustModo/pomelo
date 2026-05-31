import { useEffect, useState } from "react";
import { api } from "@/api/index.js";
import type { StorageUsage } from "@/types.js";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Database, Upload, Archive, RefreshCw } from "lucide-react";

export default function StoragePage() {
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setStorage(await api.getStorage());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  const items = [
    { label: "Database", icon: Database, bytes: storage?.database?.bytes ?? 0, desc: "MongoDB data files" },
    { label: "Uploads", icon: Upload, bytes: storage?.uploads?.bytes ?? 0, desc: "User uploaded content" },
    { label: "Backups", icon: Archive, bytes: storage?.backups?.bytes ?? 0, desc: "System backups" },
  ];

  const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Disk usage for persistent data directories.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Separator />

      {/* Total */}
      <div>
        <p className="text-sm text-muted-foreground">Total Usage</p>
        <p className="text-3xl font-semibold mt-1">{formatBytes(totalBytes)}</p>
      </div>

      <Separator />

      {/* Breakdown */}
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-4">
            <div className="mt-0.5 p-2 rounded-md bg-muted">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-lg font-semibold">{formatBytes(item.bytes)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              {totalBytes > 0 && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/20 rounded-full transition-all"
                    style={{ width: `${Math.max(1, (item.bytes / totalBytes) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
