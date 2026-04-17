import { NextResponse } from "next/server";
import { z } from "zod";

import { LEAD_SOURCES, type LeadSource } from "@/domain/lead";
import type { AiSummary, AiSummaryDataset } from "@/domain/ai";
import { generateHeuristicSummary } from "@/application/ai/heuristic-summary";

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
 * is configured it tries OpenAI first, and silently falls back to the
 * deterministic heuristic if the call fails (so a broken network or a
 * rate-limited key never surfaces as a 500 to the user).
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
}) satisfies z.ZodType<
  Record<(typeof LEAD_SOURCES)[number], number>
>;

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

async function tryOpenAI(
  dataset: AiSummaryDataset,
  filters: z.infer<typeof filtersSchema>,
): Promise<AiSummary | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "Eres un analista de marketing que trabaja con leads de una agencia.",
    "Con base en el siguiente snapshot, genera un resumen ejecutivo en español.",
    "Responde SÓLO con un objeto JSON válido con las claves:",
    "- headline (string, máx 120 caracteres)",
    "- analysis (string, 2-3 frases)",
    "- topSource (una de: instagram, facebook, landing_page, referido, otro, o null)",
    "- recommendations (array de 2-4 strings accionables)",
    "",
    `Filtros: ${JSON.stringify(filters)}`,
    `Dataset: ${JSON.stringify(dataset)}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You return strictly valid JSON matching the requested schema, in Spanish.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Partial<AiSummary>;
    if (
      typeof parsed.headline !== "string" ||
      typeof parsed.analysis !== "string" ||
      !Array.isArray(parsed.recommendations)
    ) {
      return null;
    }

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
      // Validate against known sources so a hallucinated label
      // (e.g. "google_ads") doesn't break LEAD_SOURCE_LABEL lookups.
      topSource: coerceTopSource(parsed.topSource),
      recommendations: parsed.recommendations.filter(
        (r): r is string => typeof r === "string" && r.trim().length > 0,
      ),
    };
  } catch {
    return null;
  }
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

  const openAi = await tryOpenAI(dataset, filters);
  if (openAi) return NextResponse.json(openAi);

  return NextResponse.json(
    generateHeuristicSummary(dataset, typedFilters),
  );
}
