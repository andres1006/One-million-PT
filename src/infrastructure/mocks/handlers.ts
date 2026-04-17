import { http, HttpResponse, delay } from "msw";

import type { Lead, LeadFilters } from "@/domain/lead";
import {
  leadCreateSchema,
  leadUpdateSchema,
} from "@/domain/lead.schema";
import {
  applyLeadFilters,
  computeStats,
} from "@/infrastructure/api/filter-leads";
import { LEADS_SEED } from "@/infrastructure/mocks/seed";

/**
 * In-memory store for MSW. Initial content is the seed; CRUD mutates this
 * array so the UI feels real during a dev session.
 */
let leads: Lead[] = structuredClone(LEADS_SEED);

function genId(): string {
  return `ld_${Math.random().toString(36).slice(2, 10)}`;
}

function parseFilters(url: URL): LeadFilters {
  const sp = url.searchParams;
  return {
    q: sp.get("q") ?? undefined,
    source:
      (sp.get("source") as LeadFilters["source"]) ??
      undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    sort: (sp.get("sort") as LeadFilters["sort"]) ?? undefined,
  };
}

export const handlers = [
  http.get("/api/leads", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    return HttpResponse.json(applyLeadFilters(leads, parseFilters(url)));
  }),

  http.get("/api/leads/stats", async () => {
    await delay(100);
    return HttpResponse.json(computeStats(leads));
  }),

  http.get("/api/leads/:id", async ({ params }) => {
    await delay(100);
    const lead = leads.find((l) => l.id === params.id);
    if (!lead) {
      return HttpResponse.json({ message: "Lead no encontrado" }, { status: 404 });
    }
    return HttpResponse.json(lead);
  }),

  http.post("/api/leads", async ({ request }) => {
    await delay(200);
    const body = await request.json();
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { message: "Datos inválidos", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const lead: Lead = {
      id: genId(),
      fecha_creacion: now,
      ...parsed.data,
    };
    leads = [lead, ...leads];
    return HttpResponse.json(lead, { status: 201 });
  }),

  http.patch("/api/leads/:id", async ({ request, params }) => {
    await delay(200);
    const body = await request.json();
    const parsed = leadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { message: "Datos inválidos", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const idx = leads.findIndex((l) => l.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Lead no encontrado" }, { status: 404 });
    }
    leads[idx] = { ...leads[idx], ...parsed.data };
    return HttpResponse.json(leads[idx]);
  }),

  http.delete("/api/leads/:id", async ({ params }) => {
    await delay(150);
    const before = leads.length;
    leads = leads.filter((l) => l.id !== params.id);
    if (leads.length === before) {
      return HttpResponse.json({ message: "Lead no encontrado" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
