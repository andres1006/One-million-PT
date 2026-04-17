"use client";

import { History, Trash2 } from "lucide-react";

import type { AiSummary } from "@/domain/ai";
import { LEAD_SOURCE_LABEL } from "@/domain/lead";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Props {
  history: AiSummary[];
  activeId?: string;
  onSelect: (summary: AiSummary) => void;
  onClear: () => void;
}

export function AiHistoryList({
  history,
  activeId,
  onSelect,
  onClear,
}: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historial
          </CardTitle>
          <CardDescription>
            Últimos resúmenes guardados localmente.
          </CardDescription>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Limpiar historial"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no se ha generado ningún resumen.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((item) => {
              const scopeLabel =
                item.filters.source === "all"
                  ? "Todas las fuentes"
                  : LEAD_SOURCE_LABEL[item.filters.source];
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={cn(
                      "group flex w-full flex-col gap-1 rounded-md border bg-background p-3 text-left text-sm transition-colors hover:bg-accent",
                      isActive &&
                        "border-foreground/70 bg-accent ring-1 ring-foreground/20",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {scopeLabel}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {item.provider}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.headline}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelative(item.generatedAt)} · {item.dataset.total}{" "}
                      leads
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
