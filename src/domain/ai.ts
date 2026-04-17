import type { LeadSource } from "./lead";

/**
 * Shape of a generated AI summary.
 *
 * Kept intentionally structured (not a single markdown blob) so the UI can
 * render each section with its own styling/animation and the heuristic
 * fallback produces the exact same contract as the LLM variant.
 */
export interface AiSummary {
  id: string;
  /** ISO date when the summary was generated. */
  generatedAt: string;
  /** Provider that generated it — useful to debug history items. */
  provider: "heuristic" | "openai";
  /** Filters that were applied to the dataset when generating the summary. */
  filters: AiSummaryFilters;
  /** Snapshot of the stats we based the analysis on. */
  dataset: AiSummaryDataset;
  /** Human-readable sections. */
  headline: string;
  analysis: string;
  topSource: LeadSource | null;
  recommendations: string[];
}

export interface AiSummaryFilters {
  source: LeadSource | "all";
  from: string | null;
  to: string | null;
}

export interface AiSummaryDataset {
  total: number;
  bySource: Record<LeadSource, number>;
  averageBudget: number;
  lastSevenDays: number;
  previousSevenDays: number;
  withBudget: number;
  withoutBudget: number;
  topProducts: Array<{ label: string; count: number }>;
}
