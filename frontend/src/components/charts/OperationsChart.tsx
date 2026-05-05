import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "Jan", imports: 18, health: 82 },
  { month: "Feb", imports: 24, health: 85 },
  { month: "Mar", imports: 31, health: 78 },
  { month: "Apr", imports: 38, health: 88 },
  { month: "May", imports: 45, health: 91 },
  { month: "Jun", imports: 52, health: 89 },
];

export function OperationsChart() {
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
