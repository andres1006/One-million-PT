"use client";

import { Sparkles, BrainCircuit, Target, Lightbulb } from "lucide-react";

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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Resumen ejecutivo
          </CardTitle>
          <CardDescription>{summary.headline}</CardDescription>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1 font-mono text-[11px]">
          <BrainCircuit className="h-3 w-3" />
          {summary.provider === "openai" ? "OpenAI" : "Heurístico"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Análisis
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">
            {summary.analysis}
          </p>
        </section>

        {summary.topSource && (
          <section className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fuente principal:</span>
            <span className="font-medium">
              {LEAD_SOURCE_LABEL[summary.topSource]}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {summary.dataset.bySource[summary.topSource] ?? 0} leads
            </span>
          </section>
        )}

        <Separator />

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70"
                />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground">
          Generado el {formatDate(summary.generatedAt)} · basado en{" "}
          {summary.dataset.total} leads en scope
        </p>
      </CardContent>
    </Card>
  );
}
