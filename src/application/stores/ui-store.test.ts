import { beforeEach, describe, expect, it } from "vitest";

import { useUiStore } from "./ui-store";

describe("useUiStore", () => {
  beforeEach(() => {
    // Reset both in-memory state and persisted copy for deterministic tests.
    useUiStore.setState({ sidebarCollapsed: false });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("omc-ui-store");
    }
  });

  it("starts expanded by default", () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggleSidebar flips the collapsed state", () => {
    const { toggleSidebar } = useUiStore.getState();
    toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setSidebarCollapsed forces the state regardless of previous value", () => {
    const { setSidebarCollapsed } = useUiStore.getState();
    setSidebarCollapsed(true);
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    setSidebarCollapsed(true); // idempotent
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    setSidebarCollapsed(false);
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });
});
