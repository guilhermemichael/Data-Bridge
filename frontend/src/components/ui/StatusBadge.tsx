import { clsx } from "clsx";

import type { StatusTone } from "../../types";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneClass: Record<StatusTone, string> = {
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-yellow-400/30 bg-yellow-400/10 text-yellow-100",
  danger: "border-red-400/30 bg-red-400/10 text-red-100",
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  neutral: "border-slate-500/30 bg-slate-500/10 text-slate-200",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {label}
    </span>
  );
}
