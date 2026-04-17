import { describe, it, expect, beforeEach } from "vitest";

import { useLeadsFilters } from "./leads-filters-store";

function reset() {
  // The store is created once; this mirrors a fresh session.
  useLeadsFilters.getState().reset();
}

describe("useLeadsFilters", () => {
  beforeEach(reset);

  it("has safe defaults", () => {
    const s = useLeadsFilters.getState();
    expect(s.q).toBe("");
    expect(s.source).toBe("all");
    expect(s.from).toBeNull();
    expect(s.to).toBeNull();
    expect(s.page).toBe(1);
    expect(s.sort).toBe("fecha_desc");
  });

  it("resets page to 1 on filter changes (q/source/date/sort)", () => {
    useLeadsFilters.getState().setPage(3);
    useLeadsFilters.getState().setQ("ana");
    expect(useLeadsFilters.getState().page).toBe(1);

    useLeadsFilters.getState().setPage(4);
    useLeadsFilters.getState().setSource("instagram");
    expect(useLeadsFilters.getState().page).toBe(1);
  });

  describe("hydrateFromParams", () => {
    it("reads q, source, dates and page from URL", () => {
      const sp = new URLSearchParams({
        q: "luis",
        source: "facebook",
        from: "2026-01-01",
        to: "2026-01-31",
        page: "3",
        sort: "fecha_asc",
      });
      useLeadsFilters.getState().hydrateFromParams(sp);
      const s = useLeadsFilters.getState();
      expect(s.q).toBe("luis");
      expect(s.source).toBe("facebook");
      expect(s.from).toBe("2026-01-01");
      expect(s.to).toBe("2026-01-31");
      expect(s.page).toBe(3);
      expect(s.sort).toBe("fecha_asc");
    });

    it("ignores unknown sources (defaults to 'all')", () => {
      const sp = new URLSearchParams({ source: "tiktok" });
      useLeadsFilters.getState().hydrateFromParams(sp);
      expect(useLeadsFilters.getState().source).toBe("all");
    });

    it("floors non-integer page values to avoid pagination offset bugs", () => {
      // Regression test for Devin Review comment on PR #2 / #3.
      const sp = new URLSearchParams({ page: "2.5" });
      useLeadsFilters.getState().hydrateFromParams(sp);
      expect(useLeadsFilters.getState().page).toBe(2);
    });

    it("falls back to page=1 for non-positive or NaN values", () => {
      let sp = new URLSearchParams({ page: "0" });
      useLeadsFilters.getState().hydrateFromParams(sp);
      expect(useLeadsFilters.getState().page).toBe(1);

      sp = new URLSearchParams({ page: "not-a-number" });
      useLeadsFilters.getState().hydrateFromParams(sp);
      expect(useLeadsFilters.getState().page).toBe(1);
    });
  });

  describe("toSearchParams", () => {
    it("only emits non-default params", () => {
      useLeadsFilters.getState().setQ("ana");
      const params = useLeadsFilters.getState().toSearchParams();
      expect(params.get("q")).toBe("ana");
      expect(params.get("source")).toBeNull();
    });

    it("round-trips through hydrateFromParams", () => {
      useLeadsFilters.getState().setQ("ana");
      useLeadsFilters.getState().setSource("instagram");
      useLeadsFilters.getState().setDateRange("2026-01-01", "2026-01-31");
      const params = useLeadsFilters.getState().toSearchParams();

      reset();
      useLeadsFilters.getState().hydrateFromParams(params);
      const s = useLeadsFilters.getState();
      expect(s.q).toBe("ana");
      expect(s.source).toBe("instagram");
      expect(s.from).toBe("2026-01-01");
      expect(s.to).toBe("2026-01-31");
    });
  });
});
