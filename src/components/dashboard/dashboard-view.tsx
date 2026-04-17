"use client";

import {
  Activity,
  Banknote,
  TrendingUp,
  Users,
} from "lucide-react";

import { LEAD_SOURCE_LABEL } from "@/domain/lead";
import {
  useLeadStats,
  useLeadsList,
} from "@/application/hooks/useLeads";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";

import { KpiCard } from "./kpi-card";
import { SourceBarChart } from "./source-bar-chart";
import { DailyTrendChart } from "./daily-trend-chart";
import { RecentLeadsCard } from "./recent-leads-card";

function computeDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function DashboardView() {
  const statsQ = useLeadStats();
  const recentQ = useLeadsList({ page: 1, pageSize: 5, sort: "fecha_desc" });

  const stats = statsQ.data;
  const isLoading = statsQ.isLoading;
  const isError = statsQ.isError;

  const wowDelta = stats
    ? computeDelta(stats.lastSevenDays, stats.previousSevenDays)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {isError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            No se pudo cargar el resumen. Intenta refrescar la página.
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Indicadores clave"
      >
        <KpiCard
          label="Total de leads"
          value={stats?.total ?? 0}
          icon={Users}
          isLoading={isLoading}
          hint="En toda la base"
        />
        <KpiCard
          label="Presupuesto promedio"
          value={
            stats ? formatCurrency(stats.averageBudget) : formatCurrency(0)
          }
          icon={Banknote}
          isLoading={isLoading}
          hint="Solo leads con presupuesto"
        />
        <KpiCard
          label="Últimos 7 días"
          value={stats?.lastSevenDays ?? 0}
          icon={Activity}
          delta={
            stats
              ? {
                  value: wowDelta,
                  label: "vs semana previa",
                }
              : undefined
          }
          isLoading={isLoading}
        />
        <KpiCard
          label="Fuente principal"
          value={
            stats?.topSource ? LEAD_SOURCE_LABEL[stats.topSource] : "—"
          }
          icon={TrendingUp}
          isLoading={isLoading}
          hint={
            stats?.topSource
              ? `${stats.bySource[stats.topSource] ?? 0} leads`
              : undefined
          }
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tendencia (14 días)</CardTitle>
            <CardDescription>
              Leads creados por día en las últimas dos semanas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : stats ? (
              <DailyTrendChart data={stats.daily} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Leads por fuente</CardTitle>
            <CardDescription>
              Distribución acumulada por canal de origen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : stats ? (
              <SourceBarChart bySource={stats.bySource} />
            ) : null}
          </CardContent>
        </Card>
      </section>

      {/* Recent leads */}
      <section>
        <RecentLeadsCard
          leads={recentQ.data?.data}
          isLoading={recentQ.isLoading}
        />
      </section>
    </div>
  );
}
