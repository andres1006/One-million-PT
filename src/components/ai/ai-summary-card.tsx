"use client";

import {
  Sparkles,
  BrainCircuit,
  Target,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

import type { AiSummary } from "@/domain/ai";
import { LEAD_SOURCE_LABEL } from "@/domain/lead";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatters";

interface Props {
  summary: AiSummary;
}

export function AiSummaryCard({ summary }: Props) {
  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm">
      {/* Hairline gradient accent on top */}
      <span
        aria-hidden
        className="accent-gradient absolute inset-x-0 top-0 h-px opacity-80"
      />
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="accent-gradient grid h-7 w-7 place-items-center rounded-lg text-white shadow-sm ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Resumen ejecutivo
          </CardTitle>
          <CardDescription>{summary.headline}</CardDescription>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 gap-1 border-primary/30 bg-primary/5 font-mono text-[11px] text-primary"
        >
          <BrainCircuit className="h-3 w-3" />
          {summary.provider === "openai" ? "OpenAI" : "Heurístico"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {summary.warning && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{summary.warning}</span>
          </div>
        )}
        <section>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Análisis
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">
            {summary.analysis}
          </p>
        </section>

        {summary.topSource && (
          <section className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Fuente principal:</span>
            <span className="font-medium">
              {LEAD_SOURCE_LABEL[summary.topSource]}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {summary.dataset.bySource[summary.topSource] ?? 0} leads
            </span>
          </section>
        )}

        <Separator />

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            Recomendaciones
          </h3>
          <ul className="flex flex-col gap-2">
            {summary.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm leading-relaxed"
              >
                <span
                  aria-hidden
                  className="accent-gradient mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="font-mono text-[11px] text-muted-foreground">
          Generado el {formatDate(summary.generatedAt)} · basado en{" "}
          {summary.dataset.total} leads en scope
        </p>
      </CardContent>
    </Card>
  );
}
