import type { Metric } from "../../types";

const toneGlow = {
  success: "from-emerald-400/20",
  warning: "from-yellow-400/20",
  danger: "from-red-400/20",
  info: "from-cyan-400/20",
  neutral: "from-slate-400/20",
};

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <section className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-5 shadow-2xl shadow-black/20">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneGlow[metric.tone]} to-transparent`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {metric.label}
          </p>
          <strong className="mt-3 block text-2xl font-semibold text-slate-50">
            {metric.value}
          </strong>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-cyan-200">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{metric.detail}</p>
    </section>
  );
}
