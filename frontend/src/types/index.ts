import type { LucideIcon } from "lucide-react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
  icon: LucideIcon;
};
