import { describe, it, expect } from "vitest";

import type { Lead } from "@/domain/lead";
import { applyLeadFilters, computeStats } from "./filter-leads";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: `ld_${Math.random().toString(36).slice(2, 8)}`,
    nombre: "Lead",
    email: "lead@example.com",
    fuente: "instagram",
    fecha_creacion: "2026-01-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("applyLeadFilters", () => {
  const base: Lead[] = [
    makeLead({
      id: "1",
      nombre: "Ana García",
      email: "ana@acme.com",
      fuente: "instagram",
      fecha_creacion: "2026-01-10T10:00:00.000Z",
    }),
    makeLead({
      id: "2",
      nombre: "Luis Pérez",
      email: "luis@other.io",
      fuente: "facebook",
      fecha_creacion: "2026-01-08T10:00:00.000Z",
    }),
    makeLead({
      id: "3",
      nombre: "María López",
      email: "maria@acme.com",
      fuente: "referido",
      fecha_creacion: "2026-01-05T10:00:00.000Z",
    }),
    makeLead({
      id: "4",
      nombre: "Otro",
      email: "x@acme.com",
      fuente: "landing_page",
      fecha_creacion: "2026-01-02T10:00:00.000Z",
    }),
  ];

  it("filters by q against nombre and email (case insensitive)", () => {
    const out = applyLeadFilters(base, { q: "acme" });
    expect(out.data.map((l) => l.id).sort()).toEqual(["1", "3", "4"]);
  });

  it("filters by source", () => {
    const out = applyLeadFilters(base, { source: "facebook" });
    expect(out.data).toHaveLength(1);
    expect(out.data[0].id).toBe("2");
  });

  it("filters by from/to date range (inclusive)", () => {
    const out = applyLeadFilters(base, {
      from: "2026-01-05T00:00:00.000Z",
      to: "2026-01-09T00:00:00.000Z",
    });
    expect(out.data.map((l) => l.id).sort()).toEqual(["2", "3"]);
  });

  it("sorts by fecha_desc by default and supports fecha_asc", () => {
    const desc = applyLeadFilters(base, {});
    expect(desc.data.map((l) => l.id)).toEqual(["1", "2", "3", "4"]);
    const asc = applyLeadFilters(base, { sort: "fecha_asc" });
    expect(asc.data.map((l) => l.id)).toEqual(["4", "3", "2", "1"]);
  });

  it("paginates without mutating the source array", () => {
    const snapshot = [...base];
    const page1 = applyLeadFilters(base, { page: 1, pageSize: 2 });
    const page2 = applyLeadFilters(base, { page: 2, pageSize: 2 });
    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.total).toBe(4);
    // Ensures we cloned before sorting.
    expect(base).toEqual(snapshot);
  });
});

describe("computeStats", () => {
  it("returns zeros and null topSource for empty input", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.averageBudget).toBe(0);
    expect(stats.topSource).toBeNull();
    expect(stats.lastSevenDays).toBe(0);
    expect(stats.previousSevenDays).toBe(0);
  });

  it("counts by source and picks the top source deterministically", () => {
    const leads: Lead[] = [
      makeLead({ fuente: "instagram" }),
      makeLead({ fuente: "instagram" }),
      makeLead({ fuente: "facebook" }),
    ];
    const stats = computeStats(leads);
    expect(stats.bySource.instagram).toBe(2);
    expect(stats.bySource.facebook).toBe(1);
    expect(stats.topSource).toBe("instagram");
  });

  it("averages only leads with a declared budget", () => {
    const leads: Lead[] = [
      makeLead({ presupuesto: 1000 }),
      makeLead({ presupuesto: 3000 }),
      makeLead({ presupuesto: undefined }),
    ];
    const stats = computeStats(leads);
    expect(stats.averageBudget).toBe(2000);
  });
});
