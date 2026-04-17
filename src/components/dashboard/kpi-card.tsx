"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  delta?: {
    value: number; // percentage change (e.g. 12 means +12%)
    label?: string;
  };
  isLoading?: boolean;
}

function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  isLoading,
}: KpiCardProps) {
  const direction =
    delta === undefined
      ? "flat"
      : delta.value > 0
        ? "up"
        : delta.value < 0
          ? "down"
          : "flat";

  const DirectionIcon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            isLoading && "animate-pulse text-muted-foreground/40",
          )}
        >
          {isLoading ? "—" : value}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                direction === "up" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                direction === "down" &&
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                direction === "flat" && "bg-muted text-muted-foreground",
              )}
              aria-label={`Variación ${formatDelta(delta.value)}`}
            >
              <DirectionIcon className="h-3 w-3" />
              {formatDelta(delta.value)}
            </span>
          )}
          {hint && <span>{hint}</span>}
          {delta?.label && <span>{delta.label}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
