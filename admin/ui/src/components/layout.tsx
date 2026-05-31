import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/api/index.js";
import type { Status } from "@/types.js";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Settings2,
  Container,
  FileText,
  HardDrive,
  ScrollText,
  Users,
  Rocket,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/setup", icon: Rocket, label: "Setup" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { to: "/containers", icon: Container, label: "Containers" },
      { to: "/environment", icon: FileText, label: "Environment" },
      { to: "/logs", icon: ScrollText, label: "Logs" },
      { to: "/storage", icon: HardDrive, label: "Storage" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/users", icon: Users, label: "Accounts" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: Settings2, label: "Settings" },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/setup": "Setup Wizard",
  "/containers": "Containers",
  "/environment": "Environment",
  "/logs": "Logs",
  "/storage": "Storage",
  "/users": "Accounts",
  "/settings": "Settings",
};

export default function Layout() {
  const location = useLocation();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api.getStatus().then(setStatus).catch(() => {});
  }, []);

  const pageTitle = ROUTE_TITLES[location.pathname] ?? "Pomelo";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5">
          <h1 className="text-lg font-bold tracking-tight">Pomelo</h1>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">Admin Panel</p>
        </div>

        <Separator className="bg-sidebar-muted" />

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <Separator className="bg-sidebar-muted" />

        <div className="px-5 py-3 space-y-1">
          <p className="text-[11px] font-mono text-sidebar-foreground/50">
            {status?.currentVersion ?? "No release"}
          </p>
          <p className="text-[11px] font-mono text-sidebar-foreground/50">
            Docker: {status?.dockerAvailable ? "Ready" : "Offline"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="shrink-0 px-8 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{pageTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Deployment control plane</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
