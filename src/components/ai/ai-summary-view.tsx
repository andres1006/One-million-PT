"use client";

import { useMemo, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import type { LeadSource } from "@/domain/lead";
import type { AiSummary, AiSummaryFilters } from "@/domain/ai";
import { useLeadsList } from "@/application/hooks/useLeads";
import { useGenerateAiSummary } from "@/application/hooks/useAiSummary";
import { useAiHistory } from "@/application/stores/ai-history-store";
import { buildAiDataset } from "@/application/ai/build-dataset";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AiFiltersBar } from "./ai-filters-bar";
import { AiSummaryCard } from "./ai-summary-card";
import { AiHistoryList } from "./ai-history-list";

const INITIAL_FILTERS: AiSummaryFilters = {
  source: "all",
  from: null,
  to: null,
};

const BULK_PAGE_SIZE = 500;

export function AiSummaryView() {
  // Pull *all* leads so the dataset is computed on the full population for
  // the selected filters — the server route doesn't need raw leads, we just
  // pass the aggregated dataset.
  const leadsQ = useLeadsList({ page: 1, pageSize: BULK_PAGE_SIZE });
  const generate = useGenerateAiSummary();
  const history = useAiHistory((s) => s.history);
  const addToHistory = useAiHistory((s) => s.add);
  const clearHistory = useAiHistory((s) => s.clear);

  const [filters, setFilters] = useState<AiSummaryFilters>(INITIAL_FILTERS);
  const [current, setCurrent] = useState<AiSummary | null>(null);

  const leads = useMemo(() => leadsQ.data?.data ?? [], [leadsQ.data]);

  const dataset = useMemo(
    () => buildAiDataset(leads, filters),
    [leads, filters],
  );

  const onGenerate = () => {
    if (leadsQ.isLoading) return;
    generate.mutate(
      { dataset, filters },
      {
        onSuccess: (summary) => {
          setCurrent(summary);
          addToHistory(summary);
          toast.success(
            summary.provider === "openai"
              ? "Resumen generado con OpenAI"
              : "Resumen generado (modelo heurístico)",
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo generar el resumen",
          );
        },
      },
    );
  };

  const onSelectHistory = (summary: AiSummary) => {
    setCurrent(summary);
    setFilters(summary.filters);
  };

  return (
    <div className="flex flex-col gap-4">
      <AiFiltersBar
        source={filters.source}
        from={filters.from}
        to={filters.to}
        onChange={(next) =>
          setFilters({
            source: next.source as LeadSource | "all",
            from: next.from,
            to: next.to,
          })
        }
        onGenerate={onGenerate}
        isGenerating={generate.isPending || leadsQ.isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section
          className="lg:col-span-2"
          aria-live="polite"
          aria-busy={generate.isPending}
        >
          {current ? (
            <AiSummaryCard summary={current} />
          ) : generate.isPending ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                  Generando resumen…
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Sin resumen aún
                </CardTitle>
                <CardDescription>
                  Ajusta los filtros y pulsa <strong>Generar resumen</strong>{" "}
                  para obtener un análisis ejecutivo con recomendaciones.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  Leads en scope con los filtros actuales: <strong>{dataset.total}</strong>
                </p>
                {dataset.total === 0 && (
                  <p className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    No hay leads para estos filtros — ajusta el rango o la
                    fuente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="lg:col-span-1">
          <AiHistoryList
            history={history}
            activeId={current?.id}
            onSelect={onSelectHistory}
            onClear={() => {
              clearHistory();
              setCurrent(null);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
