import {
  Activity,
  Bell,
  Database,
  FileBarChart,
  Gauge,
  History,
  Layers3,
  LogOut,
  Search,
  Settings,
  UploadCloud,
} from "lucide-react";

import { StatusBadge } from "../ui/StatusBadge";

const navigation = [
  { label: "Dashboard", icon: Gauge, active: true },
  { label: "Datasets", icon: Database },
  { label: "Imports", icon: UploadCloud },
  { label: "Analytics", icon: Activity },
  { label: "Alerts", icon: Bell },
  { label: "Reports", icon: FileBarChart },
  { label: "Audit Logs", icon: History },
  { label: "Settings", icon: Settings },
];

type AppShellProps = {
  apiStatus: "online" | "offline";
  userName?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({
  apiStatus,
  userName = "User",
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bridge-bg text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-slate-950/95 px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            <Layers3 size={20} />
          </div>
          <div>
            <strong className="block text-sm font-semibold text-white">
              Data-Bridge
            </strong>
            <span className="text-xs text-slate-500">Operational Intelligence</span>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                  item.active
                    ? "bg-blue-500/15 text-blue-100"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-bridge-bg/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                Production workspace
              </p>
              <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">
                Operational Intelligence
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden min-w-72 items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 md:flex">
                <Search size={15} />
                Search datasets, imports, alerts
              </div>
              <StatusBadge
                label={apiStatus === "online" ? "API online" : "API offline"}
                tone={apiStatus === "online" ? "success" : "danger"}
              />
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-sm font-semibold text-slate-200">
                {userName
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <button
                className="rounded-md border border-slate-800 bg-slate-950 p-2 text-slate-400 transition hover:text-slate-100"
                title="Logout"
                type="button"
                onClick={onLogout}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
