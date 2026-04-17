import type { LeadSource } from "@/domain/lead";
import { LEAD_SOURCES, LEAD_SOURCE_LABEL } from "@/domain/lead";
import type {
  AiSummary,
  AiSummaryDataset,
  AiSummaryFilters,
} from "@/domain/ai";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function pickTopSource(
  bySource: Record<LeadSource, number>,
): LeadSource | null {
  let top: LeadSource | null = null;
  for (const src of LEAD_SOURCES) {
    if (top === null || bySource[src] > bySource[top]) top = src;
  }
  return top && bySource[top] > 0 ? top : null;
}

function computeWeekOverWeek(
  last: number,
  previous: number,
): { direction: "up" | "down" | "flat"; pct: number } {
  if (previous === 0) {
    return {
      direction: last > 0 ? "up" : "flat",
      pct: last > 0 ? 100 : 0,
    };
  }
  const pct = ((last - previous) / previous) * 100;
  return {
    direction: pct > 1 ? "up" : pct < -1 ? "down" : "flat",
    pct: Math.round(pct),
  };
}

function buildFilterScope(filters: AiSummaryFilters): string {
  const parts: string[] = [];
  if (filters.source !== "all") {
    parts.push(`fuente = ${LEAD_SOURCE_LABEL[filters.source]}`);
  }
  if (filters.from && filters.to) {
    parts.push(`rango ${filters.from} → ${filters.to}`);
  } else if (filters.from) {
    parts.push(`desde ${filters.from}`);
  } else if (filters.to) {
    parts.push(`hasta ${filters.to}`);
  }
  if (parts.length === 0) return "toda la base";
  return parts.join(", ");
}

/**
 * Deterministic, locally-computable summary that mirrors the shape an LLM
 * would produce. Always available — the app is never blocked on a missing
 * `OPENAI_API_KEY`.
 *
 * The text is intentionally terse and actionable: the goal is to give a
 * team lead something they can read in 20 seconds and act on.
 */
export function generateHeuristicSummary(
  dataset: AiSummaryDataset,
  filters: AiSummaryFilters,
  now: Date = new Date(),
): AiSummary {
  const topSource = pickTopSource(dataset.bySource);
  const scope = buildFilterScope(filters);
  const wow = computeWeekOverWeek(
    dataset.lastSevenDays,
    dataset.previousSevenDays,
  );

  const headline =
    dataset.total === 0
      ? `Sin datos suficientes para ${scope}.`
      : `${dataset.total} leads en ${scope} · ${dataset.lastSevenDays} nuevos en los últimos 7 días`;

  const wowText =
    dataset.total === 0
      ? ""
      : wow.direction === "up"
        ? `Eso es ${wow.pct}% por encima de la semana previa (${dataset.previousSevenDays}).`
        : wow.direction === "down"
          ? `Eso representa ${Math.abs(wow.pct)}% menos que la semana previa (${dataset.previousSevenDays}).`
          : `La velocidad de captación se mantiene similar a la semana previa (${dataset.previousSevenDays}).`;

  const sourceText = topSource
    ? `La fuente con mayor aporte es ${LEAD_SOURCE_LABEL[topSource]} con ${dataset.bySource[topSource]} leads (${Math.round(
        (dataset.bySource[topSource] / dataset.total) * 100,
      )}% del total en scope).`
    : "";

  const budgetText =
    dataset.withBudget > 0
      ? `Presupuesto promedio: ${formatUsd(dataset.averageBudget)} sobre ${dataset.withBudget} leads con presupuesto declarado (${dataset.withoutBudget} sin información de presupuesto).`
      : `Ningún lead en el scope reportó presupuesto declarado todavía.`;

  const topProductText =
    dataset.topProducts.length > 0
      ? `Los productos con mayor interés son: ${dataset.topProducts
          .map((p) => `${p.label} (${p.count})`)
          .join(", ")}.`
      : "";

  const analysis = [headline, wowText, sourceText, budgetText, topProductText]
    .filter(Boolean)
    .join(" ");

  const recommendations: string[] = [];

  if (topSource) {
    recommendations.push(
      `Duplicar la inversión o el tempo de publicación en ${LEAD_SOURCE_LABEL[topSource]}, que ya concentra la mayoría del volumen.`,
    );
  }

  if (wow.direction === "down" && dataset.total > 0) {
    recommendations.push(
      "Revisar campañas activas: la captación cayó en la última semana respecto a la anterior.",
    );
  } else if (wow.direction === "up") {
    recommendations.push(
      "Acelerar la respuesta comercial: hay un pico de leads frescos que exigen follow-up rápido.",
    );
  }

  if (dataset.withoutBudget > dataset.withBudget && dataset.total > 0) {
    recommendations.push(
      "Agregar la pregunta de presupuesto al formulario o en el primer contacto: más del 50% de los leads no la reporta.",
    );
  }

  if (dataset.topProducts.length > 0) {
    recommendations.push(
      `Preparar material y ofertas dedicadas para el producto "${dataset.topProducts[0].label}", que lidera el interés.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Recolectar más leads para poder hacer un análisis estadísticamente relevante.",
    );
  }

  return {
    id: `ai_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: now.toISOString(),
    provider: "heuristic",
    filters,
    dataset,
    headline,
    analysis,
    topSource,
    recommendations,
  };
}
