"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: Array<{ date: string; count: number }>;
}

function formatShortDate(iso: string): string {
  // iso is YYYY-MM-DD
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function DailyTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: formatShortDate(d.date),
    fullDate: d.date,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 12, bottom: 8, left: -12 }}
      >
        <defs>
          <linearGradient id="omc-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          formatter={(value) => [String(value), "Leads"]}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.fullDate ?? ""
          }
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--foreground))"
          strokeWidth={2}
          fill="url(#omc-trend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
