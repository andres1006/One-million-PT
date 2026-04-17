"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global UI preferences. Currently tracks only whether the sidebar is
 * collapsed (icon-only) — persisted in localStorage so the user's
 * layout choice survives reloads.
 *
 * Kept intentionally small and decoupled from the leads / ai stores:
 * it has a different lifecycle (user preference, rarely changes)
 * and no cross-dependencies.
 */
interface UiStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed: boolean) =>
        set({ sidebarCollapsed }),
    }),
    { name: "omc-ui-store" },
  ),
);
