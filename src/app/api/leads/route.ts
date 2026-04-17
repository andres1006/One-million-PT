import { NextResponse, type NextRequest } from "next/server";

import type { LeadFilters } from "@/domain/lead";
import { leadCreateSchema } from "@/domain/lead.schema";
import { applyLeadFilters } from "@/infrastructure/api/filter-leads";
import {
  createLead,
  listLeadsSnapshot,
} from "@/infrastructure/server/leads-store";
import { dispatchEvent } from "@/infrastructure/server/webhook-dispatcher";

function parseFilters(url: URL): LeadFilters {
  const sp = url.searchParams;
  return {
    q: sp.get("q") ?? undefined,
    source: (sp.get("source") as LeadFilters["source"]) ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
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
