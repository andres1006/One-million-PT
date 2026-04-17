"use client";

import { useMutation } from "@tanstack/react-query";

import type {
  AiSummary,
  AiSummaryDataset,
  AiSummaryFilters,
} from "@/domain/ai";

interface GenerateInput {
  dataset: AiSummaryDataset;
  filters: AiSummaryFilters;
}

async function generate({ dataset, filters }: GenerateInput): Promise<AiSummary> {
  const res = await fetch("/api/ai-summary", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataset, filters }),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudo generar el resumen");
  }
  return (await res.json()) as AiSummary;
}

export function useGenerateAiSummary() {
  return useMutation({ mutationFn: generate });
}
