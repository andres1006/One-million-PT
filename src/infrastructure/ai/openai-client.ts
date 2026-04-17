import type { AiSummaryDataset } from "@/domain/ai";

/**
 * Minimal shape we need from the OpenAI response. The route handler is
 * responsible for validating `topSource` against `LEAD_SOURCES` and
 * trimming empty recommendations — this client only checks structural
 * invariants so that we can fail early with a clear reason.
 */
export interface OpenAiParsedSummary {
  headline: string;
  analysis: string;
  topSource: string | null;
  recommendations: string[];
}

export type OpenAiOutcome =
  | { status: "ok"; parsed: OpenAiParsedSummary }
  | { status: "no_key"; reason: "OPENAI_API_KEY no configurada" }
  | { status: "http_error"; reason: string }
  | { status: "invalid_response"; reason: string }
  | { status: "network_error"; reason: string };

interface CallInput {
  dataset: AiSummaryDataset;
  filters: {
    source: string;
    from: string | null;
    to: string | null;
  };
}

function buildPrompt(input: CallInput): string {
  return [
    "Eres un analista de marketing que trabaja con leads de una agencia.",
    "Con base en el siguiente snapshot, genera un resumen ejecutivo en español.",
    "Responde SÓLO con un objeto JSON válido con las claves:",
    "- headline (string, máx 120 caracteres)",
    "- analysis (string, 2-3 frases)",
    "- topSource (una de: instagram, facebook, landing_page, referido, otro, o null)",
    "- recommendations (array de 2-4 strings accionables)",
    "",
    `Filtros: ${JSON.stringify(input.filters)}`,
    `Dataset: ${JSON.stringify(input.dataset)}`,
  ].join("\n");
}

function isParsedShapeValid(value: unknown): value is OpenAiParsedSummary {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.headline === "string" &&
    typeof v.analysis === "string" &&
    (v.topSource === null || typeof v.topSource === "string") &&
    Array.isArray(v.recommendations)
  );
}

/**
 * Thin wrapper around OpenAI's Chat Completions API.
 *
 * Returns a tagged union instead of throwing / returning `null`, so the
 * caller can distinguish "no key configured" (expected — use heuristic
 * silently) from "key invalid / rate limited / malformed response"
 * (unexpected — surface a warning so the operator can fix it).
 */
export async function callOpenAi(input: CallInput): Promise<OpenAiOutcome> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: "no_key", reason: "OPENAI_API_KEY no configurada" };
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const body = {
    model,
    temperature: 0.3,
    response_format: { type: "json_object" as const },
    messages: [
      {
        role: "system" as const,
        content:
          "You return strictly valid JSON matching the requested schema, in Spanish.",
      },
      { role: "user" as const, content: buildPrompt(input) },
    ],
  };

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "fetch failed";
    return { status: "network_error", reason };
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const payload = (await res.json()) as { error?: { message?: string } };
      if (payload.error?.message) detail = `${res.status}: ${payload.error.message}`;
    } catch {
      // Ignore JSON parse errors — keep the status-only detail.
    }
    return { status: "http_error", reason: detail };
  }

  let json: { choices?: Array<{ message?: { content?: string } }> };
  try {
    json = (await res.json()) as typeof json;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "JSON inválido";
    return { status: "invalid_response", reason };
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    return {
      status: "invalid_response",
      reason: "OpenAI devolvió una respuesta vacía",
    };
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(content);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "JSON del modelo inválido";
    return { status: "invalid_response", reason };
  }

  if (!isParsedShapeValid(parsedUnknown)) {
    return {
      status: "invalid_response",
      reason: "El JSON devuelto no cumple el contrato esperado",
    };
  }

  return { status: "ok", parsed: parsedUnknown };
}
