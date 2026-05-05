import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileBarChart,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { OperationsChart } from "../components/charts/OperationsChart";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { AlertItem, ImportJob, Metric } from "../types";

const metrics: Metric[] = [
  {
    label: "Active datasets",
    value: "12",
    detail: "Sales, inventory, support and customer operations",
    tone: "info",
    icon: Database,
  },
  {
    label: "Processed imports",
    value: "428",
    detail: "Last processing window completed in 41s",
    tone: "success",
    icon: UploadCloud,
  },
  {
    label: "Average data health",
    value: "89/100",
    detail: "Quality score across active operational datasets",
    tone: "success",
    icon: ShieldCheck,
  },
  {
    label: "Critical alerts",
    value: "3",
    detail: "Two inventory risks and one sales anomaly",
    tone: "danger",
    icon: AlertTriangle,
  },
  {
    label: "Generated reports",
    value: "36",
    detail: "Executive PDFs generated this quarter",
    tone: "neutral",
    icon: FileBarChart,
  },
];

const imports: ImportJob[] = [
  {
    file: "sales_may_2026.csv",
    dataset: "Sales Operations",
    status: "COMPLETED",
    rows: "8,430",
    health: "94/100",
    finishedAt: "2 min ago",
  },
  {
    file: "inventory_week_18.xlsx",
    dataset: "Inventory",
    status: "PROCESSING",
    rows: "2,140",
    health: "Pending",
    finishedAt: "Running",
  },
  {
    file: "support_backlog.json",
    dataset: "Support Tickets",
    status: "VALIDATING",
    rows: "1,902",
    health: "Pending",
    finishedAt: "Running",
  },
  {
    file: "customers_q2.csv",
    dataset: "Customer Base",
    status: "COMPLETED",
    rows: "18,204",
    health: "87/100",
    finishedAt: "31 min ago",
  },
];

const alerts: AlertItem[] = [
  {
    title: "Inventory stock below threshold",
    message: "17 products are under the minimum operational stock level.",
    severity: "CRITICAL",
    dataset: "Inventory",
  },
  {
    title: "Sales volume dropped",
    message: "Monthly sales volume is 28% below the previous period.",
    severity: "HIGH",
    dataset: "Sales Operations",
  },
  {
    title: "Support tickets increased",
    message: "New support tickets increased 19% week over week.",
    severity: "MEDIUM",
    dataset: "Support Tickets",
  },
];

const statusTone = {
  COMPLETED: "success",
  PROCESSING: "info",
  FAILED: "danger",
  VALIDATING: "warning",
} as const;

const severityTone = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
} as const;

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Import throughput and quality
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monthly processing volume compared with data health.
              </p>
            </div>
            <StatusBadge label="Near real-time" tone="info" />
          </div>
          <OperationsChart />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Data lineage</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current path from raw file to decision surface.
              </p>
            </div>
            <CheckCircle2 className="text-emerald-300" size={18} />
          </div>
          <div className="space-y-3">
            {[
              "Raw file stored",
              "Import job registered",
              "Schema detected",
              "Records normalized",
              "Analytics snapshots",
              "Dashboard and PDF reports",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-xs text-cyan-100">
                  {index + 1}
                </div>
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-base font-semibold text-white">
              Latest import jobs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Dataset</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Rows</th>
                  <th className="px-5 py-3 font-medium">Health</th>
                  <th className="px-5 py-3 font-medium">Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {imports.map((item) => (
                  <tr key={item.file} className="hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {item.file}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{item.dataset}</td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={item.status}
                        tone={statusTone[item.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-300">{item.rows}</td>
                    <td className="px-5 py-4 text-slate-300">{item.health}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {item.finishedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-base font-semibold text-white">Open alerts</h2>
          </div>
          <div className="space-y-3 p-5">
            {alerts.map((alert) => (
              <article
                key={alert.title}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <StatusBadge
                    label={alert.severity}
                    tone={severityTone[alert.severity]}
                  />
                  <span className="text-xs text-slate-500">{alert.dataset}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {alert.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {alert.message}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
