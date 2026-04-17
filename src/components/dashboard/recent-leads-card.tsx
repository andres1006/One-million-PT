"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Lead } from "@/domain/lead";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/leads/source-badge";
import { formatRelative } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  leads: Lead[] | undefined;
  isLoading?: boolean;
}

export function RecentLeadsCard({ leads, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Últimos leads</CardTitle>
          <CardDescription>
            Los 5 registros más recientes de la base.
          </CardDescription>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20" />
              </li>
            ))}
          </ul>
        ) : !leads || leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay leads.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {leads.slice(0, 5).map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {lead.nombre}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {lead.email}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <SourceBadge source={lead.fuente} />
                  <span
                    className="hidden text-xs text-muted-foreground sm:block"
                    title={lead.fecha_creacion}
                  >
                    {formatRelative(lead.fecha_creacion)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
