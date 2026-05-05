import type { LucideIcon } from "lucide-react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
  icon: LucideIcon;
};

export type ImportJob = {
  file: string;
  dataset: string;
  status: "COMPLETED" | "PROCESSING" | "FAILED" | "VALIDATING";
  rows: string;
  health: string;
  finishedAt: string;
};

export type AlertItem = {
  title: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  dataset: string;
};
