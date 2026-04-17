import { describe, it, expect } from "vitest";

import type { Lead } from "@/domain/lead";
import { buildAiDataset } from "./build-dataset";

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: `ld_${Math.random().toString(36).slice(2, 8)}`,
    nombre: "Lead",
    email: "lead@example.com",
    fuente: "instagram",
    fecha_creacion: "2026-01-08T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildAiDataset", () => {
  const now = new Date("2026-01-10T12:00:00.000Z").getTime();

  it("aggregates totals, bySource and last/prev 7-day windows", () => {
    const leads: Lead[] = [
      lead({ fuente: "instagram", fecha_creacion: "2026-01-08T10:00:00.000Z" }),
      lead({ fuente: "instagram", fecha_creacion: "2026-01-05T10:00:00.000Z" }),
      lead({ fuente: "facebook", fecha_creacion: "2025-12-30T10:00:00.000Z" }),
    ];
    const ds = buildAiDataset(
      leads,
      { source: "all", from: null, to: null },
      now,
    );
    expect(ds.total).toBe(3);
    expect(ds.bySource.instagram).toBe(2);
    expect(ds.bySource.facebook).toBe(1);
    expect(ds.lastSevenDays).toBe(2);
    expect(ds.previousSevenDays).toBe(1);
  });

  it("applies the source filter before aggregating", () => {
    const leads: Lead[] = [
      lead({ fuente: "instagram" }),
      lead({ fuente: "facebook" }),
    ];
    const ds = buildAiDataset(
      leads,
      { source: "facebook", from: null, to: null },
      now,
    );
    expect(ds.total).toBe(1);
    expect(ds.bySource.facebook).toBe(1);
    expect(ds.bySource.instagram).toBe(0);
  });

  it("separates withBudget / withoutBudget and rounds averageBudget", () => {
    const leads: Lead[] = [
      lead({ presupuesto: 1000 }),
      lead({ presupuesto: 2500 }),
      lead({ presupuesto: undefined }),
    ];
    const ds = buildAiDataset(
      leads,
      { source: "all", from: null, to: null },
      now,
    );
    expect(ds.withBudget).toBe(2);
    expect(ds.withoutBudget).toBe(1);
    // Math.round((1000 + 2500) / 2) = 1750
    expect(ds.averageBudget).toBe(1750);
  });

  it("returns top 3 products sorted by frequency", () => {
    const leads: Lead[] = [
      lead({ producto_interes: "Camiseta" }),
      lead({ producto_interes: "Camiseta" }),
      lead({ producto_interes: "Pantalón" }),
      lead({ producto_interes: "Gorra" }),
      lead({ producto_interes: "Gorra" }),
      lead({ producto_interes: "Gorra" }),
      lead({ producto_interes: "Buzo" }),
    ];
    const ds = buildAiDataset(
      leads,
      { source: "all", from: null, to: null },
      now,
    );
    expect(ds.topProducts).toHaveLength(3);
    expect(ds.topProducts[0]).toEqual({ label: "Gorra", count: 3 });
    expect(ds.topProducts[1]).toEqual({ label: "Camiseta", count: 2 });
  });
});
