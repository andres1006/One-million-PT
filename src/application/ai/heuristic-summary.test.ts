import { describe, it, expect } from "vitest";

import type { AiSummaryDataset, AiSummaryFilters } from "@/domain/ai";
import { generateHeuristicSummary } from "./heuristic-summary";

function makeDataset(overrides: Partial<AiSummaryDataset> = {}): AiSummaryDataset {
  return {
    total: 20,
    bySource: {
      instagram: 10,
      facebook: 5,
      landing_page: 3,
      referido: 2,
      otro: 0,
    },
    averageBudget: 1200,
    lastSevenDays: 8,
    previousSevenDays: 4,
    withBudget: 15,
    withoutBudget: 5,
    topProducts: [
      { label: "Camiseta", count: 7 },
      { label: "Gorra", count: 3 },
    ],
    ...overrides,
  };
}

const BASE_FILTERS: AiSummaryFilters = {
  source: "all",
  from: null,
  to: null,
};

describe("generateHeuristicSummary", () => {
  it("produces a well-formed AiSummary with provider=heuristic", () => {
    const out = generateHeuristicSummary(
      makeDataset(),
      BASE_FILTERS,
      new Date("2026-01-10T12:00:00.000Z"),
    );
    expect(out.provider).toBe("heuristic");
    expect(out.topSource).toBe("instagram");
    expect(out.headline).toContain("20 leads");
    expect(out.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it("does NOT duplicate the headline inside analysis", () => {
    const out = generateHeuristicSummary(makeDataset(), BASE_FILTERS);
    expect(out.analysis).not.toContain(out.headline);
  });

  it("reports WoW increase when last week is higher than previous", () => {
    const out = generateHeuristicSummary(
      makeDataset({ lastSevenDays: 10, previousSevenDays: 5 }),
      BASE_FILTERS,
    );
    expect(out.analysis).toMatch(/por encima/);
  });

  it("reports WoW decrease when last week is lower", () => {
    const out = generateHeuristicSummary(
      makeDataset({ lastSevenDays: 3, previousSevenDays: 10 }),
      BASE_FILTERS,
    );
    expect(out.analysis).toMatch(/menos/);
  });

  it("handles empty dataset with a 'Sin datos' headline and no crash", () => {
    const out = generateHeuristicSummary(
      makeDataset({
        total: 0,
        bySource: {
          instagram: 0,
          facebook: 0,
          landing_page: 0,
          referido: 0,
          otro: 0,
        },
        averageBudget: 0,
        lastSevenDays: 0,
        previousSevenDays: 0,
        withBudget: 0,
        withoutBudget: 0,
        topProducts: [],
      }),
      BASE_FILTERS,
    );
    expect(out.topSource).toBeNull();
    expect(out.headline).toMatch(/Sin datos/);
    expect(out.recommendations.length).toBeGreaterThan(0);
  });

  it("reflects the source filter inside the headline scope", () => {
    const out = generateHeuristicSummary(makeDataset(), {
      source: "facebook",
      from: null,
      to: null,
    });
    expect(out.headline).toMatch(/Facebook/);
  });
});
