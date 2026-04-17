"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AiSummary } from "@/domain/ai";
import { AI_SUMMARY_HISTORY_LIMIT, STORAGE_KEYS } from "@/lib/constants";

interface AiHistoryState {
  history: AiSummary[];
  add: (summary: AiSummary) => void;
  clear: () => void;
}

/**
 * Keeps the last N generated summaries in localStorage so the user can
 * compare runs. Only the most recent `AI_SUMMARY_HISTORY_LIMIT` entries
 * are retained to avoid unbounded growth.
 */
export const useAiHistory = create<AiHistoryState>()(
  persist(
    (set) => ({
      history: [],
      add: (summary) =>
        set((state) => ({
          history: [summary, ...state.history].slice(
            0,
            AI_SUMMARY_HISTORY_LIMIT,
          ),
        })),
      clear: () => set({ history: [] }),
    }),
    { name: STORAGE_KEYS.aiHistory },
  ),
);
