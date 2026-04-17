import { describe, expect, it } from "vitest";

import { parseFilters } from "./route";

/**
 * Regression tests for the Devin Review finding on PR #12:
 * `parseFilters` used `sp.get("page") ? Number(...) : undefined`, which let
 * `NaN` and negative values reach `applyLeadFilters`. The destructuring
 * default `page = 1` does NOT rescue `NaN` (NaN !== undefined), so the API
 * would return `slice(NaN, NaN)` → [] for `?page=abc` and a wrong
 * sub-slice for `?page=-1`. The helper now clamps to positive integers and
 * falls back to `undefined` so the downstream defaults apply.
 */
describe("parseFilters (GET /api/leads query parsing)", () => {
  function call(search: string) {
    return parseFilters(new URL(`http://localhost/api/leads${search}`));
  }

  it("returns undefined for non-numeric page/pageSize so defaults kick in", () => {
    const f = call("?page=abc&pageSize=xyz");
    expect(f.page).toBeUndefined();
    expect(f.pageSize).toBeUndefined();
  });

  it("rejects negative page/pageSize (prevents slice(-N, -M) subset bug)", () => {
    const f = call("?page=-1&pageSize=-20");
    expect(f.page).toBeUndefined();
    expect(f.pageSize).toBeUndefined();
  });

  it("rejects zero page/pageSize", () => {
    const f = call("?page=0&pageSize=0");
    expect(f.page).toBeUndefined();
    expect(f.pageSize).toBeUndefined();
  });

  it("rejects Infinity", () => {
    const f = call("?page=Infinity&pageSize=-Infinity");
    expect(f.page).toBeUndefined();
    expect(f.pageSize).toBeUndefined();
  });

  it("accepts and floors positive numeric values", () => {
    const f = call("?page=2&pageSize=50");
    expect(f.page).toBe(2);
    expect(f.pageSize).toBe(50);
  });

  it("floors fractional positive values", () => {
    const f = call("?page=2.9&pageSize=10.4");
    expect(f.page).toBe(2);
    expect(f.pageSize).toBe(10);
  });

  it("leaves unrelated filters untouched", () => {
    const f = call("?q=Maria&source=instagram&from=2026-01-01&to=2026-02-01");
    expect(f.q).toBe("Maria");
    expect(f.source).toBe("instagram");
    expect(f.from).toBe("2026-01-01");
    expect(f.to).toBe("2026-02-01");
    expect(f.page).toBeUndefined();
    expect(f.pageSize).toBeUndefined();
  });
});
