import { NextResponse, type NextRequest } from "next/server";

import type { LeadFilters } from "@/domain/lead";
import { leadCreateSchema } from "@/domain/lead.schema";
import { applyLeadFilters } from "@/infrastructure/api/filter-leads";
import {
  createLead,
  listLeadsSnapshot,
} from "@/infrastructure/server/leads-store";
import { dispatchEvent } from "@/infrastructure/server/webhook-dispatcher";

/**
 * Parse a positive-integer query param, falling back to `undefined` when the
 * value is missing, non-numeric (NaN), non-finite, zero, or negative. Letting
 * `undefined` propagate is what allows `applyLeadFilters` to apply its own
 * defaults (`page=1`, `pageSize=DEFAULT_PAGE_SIZE`). Without this, values like
 * `?page=abc` would flow through as `NaN` (since `NaN !== undefined`,
 * destructuring defaults don't kick in) and produce `slice(NaN, NaN)` → [].
 * Negative values like `?page=-1` would turn into `slice(-20, -10)` and return
 * a wrong subset instead of the first page. See Devin Review thread on PR #12.
 */
function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

export function parseFilters(url: URL): LeadFilters {
  const sp = url.searchParams;
  return {
    q: sp.get("q") ?? undefined,
    source: (sp.get("source") as LeadFilters["source"]) ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    page: parsePositiveInt(sp.get("page")),
    pageSize: parsePositiveInt(sp.get("pageSize")),
    sort: (sp.get("sort") as LeadFilters["sort"]) ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl);
  return NextResponse.json(applyLeadFilters(listLeadsSnapshot(), filters));
}

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null);
  const parsed = leadCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const lead = createLead(parsed.data);
  // Fan out to every webhook subscribed to `lead.created`. We await the fan-out
  // so the delivery log is fresh for the UI; every delivery has its own
  // timeout so this remains bounded.
  await dispatchEvent({
    event: "lead.created",
    emittedAt: new Date().toISOString(),
    data: lead,
  });
  return NextResponse.json(lead, { status: 201 });
}
