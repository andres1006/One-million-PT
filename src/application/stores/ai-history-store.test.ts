import { describe, it, expect, beforeEach } from "vitest";

import type { AiSummary } from "@/domain/ai";
import { AI_SUMMARY_HISTORY_LIMIT } from "@/lib/constants";
import { useAiHistory } from "./ai-history-store";

function makeSummary(id: string): AiSummary {
  return {
    id,
    generatedAt: new Date().toISOString(),
    provider: "heuristic",
    filters: { source: "all", from: null, to: null },
    dataset: {
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
    },
    headline: `summary ${id}`,
    analysis: "analysis",
    topSource: null,
    recommendations: ["r1"],
  };
}

beforeEach(() => {
  useAiHistory.getState().clear();
  // Reset localStorage state too (persist middleware writes here).
  window.localStorage.clear();
});

describe("useAiHistory", () => {
  it("starts empty", () => {
    expect(useAiHistory.getState().history).toEqual([]);
  });

  it("prepends new summaries so latest is first", () => {
    useAiHistory.getState().add(makeSummary("a"));
    useAiHistory.getState().add(makeSummary("b"));
    expect(useAiHistory.getState().history.map((s) => s.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it(`caps history at AI_SUMMARY_HISTORY_LIMIT (${AI_SUMMARY_HISTORY_LIMIT})`, () => {
    for (let i = 0; i < AI_SUMMARY_HISTORY_LIMIT + 3; i += 1) {
      useAiHistory.getState().add(makeSummary(`s${i}`));
    }
    expect(useAiHistory.getState().history).toHaveLength(
      AI_SUMMARY_HISTORY_LIMIT,
    );
    // Oldest entries dropped; newest kept at the front.
    expect(useAiHistory.getState().history[0].id).toBe(
      `s${AI_SUMMARY_HISTORY_LIMIT + 2}`,
    );
  });

  it("clear() wipes the history", () => {
    useAiHistory.getState().add(makeSummary("x"));
    useAiHistory.getState().clear();
    expect(useAiHistory.getState().history).toEqual([]);
  });
});
