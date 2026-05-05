import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { OverviewTimePoint } from "../../features/analytics/api";

type OperationsChartProps = {
  importsTimeseries?: OverviewTimePoint[];
  healthScoreTrend?: OverviewTimePoint[];
};

function buildChartData({
  importsTimeseries = [],
  healthScoreTrend = [],
}: OperationsChartProps) {
  if (!importsTimeseries.length && !healthScoreTrend.length) {
    return [];
  }

  const periods = Array.from(
    new Set([
      ...importsTimeseries.map((point) => point.period),
      ...healthScoreTrend.map((point) => point.period),
    ]),
  ).sort();

  return periods.map((period) => ({
    month: period,
    imports:
      importsTimeseries.find((point) => point.period === period)?.value ?? 0,
    health:
      healthScoreTrend.find((point) => point.period === period)?.value ?? 0,
  }));
}

export function OperationsChart(props: OperationsChartProps) {
  const data = buildChartData(props);

  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
        No analytics trend yet. Upload a dataset to generate chart data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 10 }}>
        <defs>
          <linearGradient id="imports" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="health" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #1e293b",
            borderRadius: 8,
            color: "#f8fafc",
          }}
        />
        <Area
          dataKey="imports"
          stroke="#06b6d4"
          fill="url(#imports)"
          strokeWidth={2}
        />
        <Area
          dataKey="health"
          stroke="#8b5cf6"
          fill="url(#health)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
