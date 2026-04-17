import type {
  Lead,
  LeadFilters,
  LeadStats,
  LeadSource,
  PaginatedLeads,
} from "@/domain/lead";
import { LEAD_SOURCES } from "@/domain/lead";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

/**
 * Pure, deterministic in-memory filtering + pagination.
 * Shared between the MSW handler and the local-storage repository so
 * both implementations behave identically.
 */
export function applyLeadFilters(
  leads: Lead[],
  filters: LeadFilters,
): PaginatedLeads {
  const {
    q,
    source,
    from,
    to,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = "fecha_desc",
  } = filters;

  let result = [...leads];

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    result = result.filter(
      (l) =>
        l.nombre.toLowerCase().includes(needle) ||
        l.email.toLowerCase().includes(needle),
    );
  }

  if (source) {
    result = result.filter((l) => l.fuente === source);
  }

  if (from) {
    const fromMs = new Date(from).getTime();
    result = result.filter(
      (l) => new Date(l.fecha_creacion).getTime() >= fromMs,
    );
  }

  if (to) {
    const toMs = new Date(to).getTime();
    result = result.filter((l) => new Date(l.fecha_creacion).getTime() <= toMs);
  }

  result.sort((a, b) => {
    const diff =
      new Date(b.fecha_creacion).getTime() -
      new Date(a.fecha_creacion).getTime();
    return sort === "fecha_desc" ? diff : -diff;
  });

  const total = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildEmptyDailySeries(
  days: number,
  now = new Date(),
): Array<{ date: string; count: number }> {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const out: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push({ date: toDateKey(d), count: 0 });
  }
  return out;
}

export function computeStats(leads: Lead[]): LeadStats {
  const bySource = LEAD_SOURCES.reduce<Record<LeadSource, number>>(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<LeadSource, number>,
  );

  let budgetSum = 0;
  let budgetCount = 0;
  const now = Date.now();
  let lastSeven = 0;
  let prevSeven = 0;

  const daily = buildEmptyDailySeries(14, new Date(now));
  const dailyIndex = new Map(daily.map((d, i) => [d.date, i]));

  for (const lead of leads) {
    bySource[lead.fuente] += 1;
    if (typeof lead.presupuesto === "number") {
      budgetSum += lead.presupuesto;
      budgetCount += 1;
    }
    const createdAt = new Date(lead.fecha_creacion);
    const age = now - createdAt.getTime();
    if (age <= SEVEN_DAYS_MS) lastSeven += 1;
    else if (age <= SEVEN_DAYS_MS * 2) prevSeven += 1;

    const key = toDateKey(createdAt);
    const idx = dailyIndex.get(key);
    if (idx !== undefined) daily[idx].count += 1;
  }

  const topSource =
    LEAD_SOURCES.reduce<LeadSource | null>((best, src) => {
      if (best === null) return src;
      return bySource[src] > bySource[best] ? src : best;
    }, null) ?? null;

  return {
    total: leads.length,
    bySource,
    averageBudget: budgetCount ? Math.round(budgetSum / budgetCount) : 0,
    lastSevenDays: lastSeven,
    previousSevenDays: prevSeven,
    topSource: leads.length ? topSource : null,
    daily,
  };
}
