import { NextResponse } from "next/server";
import { z } from "zod";

import { LEAD_SOURCES, type LeadSource } from "@/domain/lead";
import type { AiSummary, AiSummaryDataset } from "@/domain/ai";
import { generateHeuristicSummary } from "@/application/ai/heuristic-summary";
import {
  callOpenAi,
  type OpenAiOutcome,
} from "@/infrastructure/ai/openai-client";

function coerceTopSource(value: unknown): LeadSource | null {
  if (typeof value !== "string") return null;
  return (LEAD_SOURCES as readonly string[]).includes(value)
    ? (value as LeadSource)
    : null;
}

/**
 * Next API route that produces an AI summary.
 *
 * The route always returns a well-formed `AiSummary`. If `OPENAI_API_KEY`
 * is configured it tries OpenAI first, and falls back to the deterministic
 * heuristic if the call fails. When a fallback happens **with a key
 * configured**, the response includes a `warning` field so the UI can
 * surface the reason (invalid key, rate limit, network, invalid JSON…)
 * instead of silently degrading.
 *
 * The client sends the precomputed dataset and filters; the server never
 * needs access to the raw lead list. This keeps the route thin and makes
 * it work identically when the underlying storage is MSW, localStorage
 * or a real backend.
 */

const bySourceSchema = z.object({
  instagram: z.number().int().min(0),
  facebook: z.number().int().min(0),
  landing_page: z.number().int().min(0),
  referido: z.number().int().min(0),
  otro: z.number().int().min(0),
}) satisfies z.ZodType<Record<(typeof LEAD_SOURCES)[number], number>>;

const datasetSchema = z.object({
  total: z.number().int().min(0),
  bySource: bySourceSchema,
  averageBudget: z.number().min(0),
  lastSevenDays: z.number().int().min(0),
  previousSevenDays: z.number().int().min(0),
  withBudget: z.number().int().min(0),
  withoutBudget: z.number().int().min(0),
  topProducts: z.array(
    z.object({ label: z.string(), count: z.number().int().min(0) }),
  ),
});

const filtersSchema = z.object({
  source: z.enum([...LEAD_SOURCES, "all"] as [string, ...string[]]),
  from: z.string().nullable(),
  to: z.string().nullable(),
});

const bodySchema = z.object({
  dataset: datasetSchema,
  filters: filtersSchema,
});

function mapOutcomeToSummary(
  outcome: OpenAiOutcome,
  dataset: AiSummaryDataset,
  filters: z.infer<typeof filtersSchema>,
): AiSummary | null {
  if (outcome.status !== "ok") return null;
  const parsed = outcome.parsed;
  const now = new Date();
  return {
    id: `ai_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: now.toISOString(),
    provider: "openai",
    filters: {
      source: filters.source as AiSummary["filters"]["source"],
      from: filters.from,
      to: filters.to,
    },
    dataset,
    headline: parsed.headline,
    analysis: parsed.analysis,
    topSource: coerceTopSource(parsed.topSource),
    recommendations: parsed.recommendations.filter(
      (r): r is string => typeof r === "string" && r.trim().length > 0,
    ),
  };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Payload inválido", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { dataset, filters } = parsed.data;
  const typedFilters = {
    source: filters.source as AiSummary["filters"]["source"],
    from: filters.from,
    to: filters.to,
  };

  const outcome = await callOpenAi({ dataset, filters });

  if (outcome.status === "ok") {
    const summary = mapOutcomeToSummary(outcome, dataset, filters);
    if (summary) return NextResponse.json(summary);
  }

  // Fallback to heuristic. If OpenAI was attempted but failed, include the
  // reason so the UI can surface a visible warning banner and the operator
  // can inspect `Vercel → Function Logs` for the detailed error.
  const fallbackReason = outcome.status === "ok" ? null : outcome.reason;

  if (outcome.status !== "ok" && outcome.status !== "no_key") {
    console.warn(
      `[ai-summary] fallback to heuristic (${outcome.status}): ${fallbackReason}`,
    );
  }

  const warning =
    !fallbackReason || outcome.status === "no_key"
      ? undefined
      : `Fallback al modo heurístico: ${fallbackReason}. Revisa OPENAI_API_KEY en las variables de entorno del servidor.`;

  return NextResponse.json(
    generateHeuristicSummary(dataset, typedFilters, new Date(), warning),
  );
}
