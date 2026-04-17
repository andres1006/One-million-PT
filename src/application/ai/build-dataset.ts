import type { Lead, LeadSource } from "@/domain/lead";
import { LEAD_SOURCES } from "@/domain/lead";
import type { AiSummaryDataset, AiSummaryFilters } from "@/domain/ai";

const DAY_MS = 24 * 60 * 60 * 1000;

function filterLeads(leads: Lead[], filters: AiSummaryFilters): Lead[] {
  let out = leads;
  if (filters.source !== "all") {
    out = out.filter((l) => l.fuente === filters.source);
  }
  if (filters.from) {
    const fromMs = new Date(filters.from).getTime();
    out = out.filter((l) => new Date(l.fecha_creacion).getTime() >= fromMs);
  }
  if (filters.to) {
    const toMs = new Date(filters.to).getTime();
    out = out.filter((l) => new Date(l.fecha_creacion).getTime() <= toMs);
  }
  return out;
}

/**
 * Builds the dataset snapshot that the summary engine (heuristic or LLM)
 * will reason about. Pure function — easy to test.
 */
export function buildAiDataset(
  leads: Lead[],
  filters: AiSummaryFilters,
  now = Date.now(),
): AiSummaryDataset {
  const scope = filterLeads(leads, filters);

  const bySource = LEAD_SOURCES.reduce<Record<LeadSource, number>>(
    (acc, src) => {
      acc[src] = 0;
      return acc;
    },
    {} as Record<LeadSource, number>,
  );

  let budgetSum = 0;
  let withBudget = 0;
  let lastSeven = 0;
  let prevSeven = 0;
  const productCounts = new Map<string, number>();

  for (const lead of scope) {
    bySource[lead.fuente] += 1;
    if (typeof lead.presupuesto === "number") {
      budgetSum += lead.presupuesto;
      withBudget += 1;
    }
    const age = now - new Date(lead.fecha_creacion).getTime();
    if (age <= 7 * DAY_MS) lastSeven += 1;
    else if (age <= 14 * DAY_MS) prevSeven += 1;

    const product = lead.producto_interes?.trim();
    if (product) {
      productCounts.set(product, (productCounts.get(product) ?? 0) + 1);
    }
  }

  const topProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));

  return {
    total: scope.length,
    bySource,
    averageBudget: withBudget ? Math.round(budgetSum / withBudget) : 0,
    lastSevenDays: lastSeven,
    previousSevenDays: prevSeven,
    withBudget,
    withoutBudget: scope.length - withBudget,
    topProducts,
  };
}
