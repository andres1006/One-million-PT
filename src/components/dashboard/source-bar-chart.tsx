"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LeadSource } from "@/domain/lead";
import { LEAD_SOURCES, LEAD_SOURCE_LABEL } from "@/domain/lead";

interface Props {
  bySource: Record<LeadSource, number>;
}

const SOURCE_COLORS: Record<LeadSource, string> = {
  instagram: "hsl(330 80% 60%)",
  facebook: "hsl(220 80% 60%)",
  landing_page: "hsl(160 70% 45%)",
  referido: "hsl(40 90% 55%)",
  otro: "hsl(220 10% 60%)",
};

export function SourceBarChart({ bySource }: Props) {
  const data = LEAD_SOURCES.map((source) => ({
    name: LEAD_SOURCE_LABEL[source],
    value: bySource[source] ?? 0,
    fill: SOURCE_COLORS[source],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 8, left: 12 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          horizontal={false}
        />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          formatter={(value) => [String(value), "Leads"]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
