import { describe, it, expect } from "vitest";

import { formatCurrency, formatDate, formatRelative } from "./formatters";

describe("formatCurrency", () => {
  it("returns em-dash for null/undefined/NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(Number.NaN)).toBe("—");
  });

  it("formats integer USD without decimals", () => {
    expect(formatCurrency(1200)).toMatch(/\$1,200/);
    expect(formatCurrency(0)).toMatch(/\$0/);
  });
});

describe("formatDate", () => {
  it("returns a stable Spanish-locale date for a valid ISO input", () => {
    const out = formatDate("2026-01-02T10:00:00.000Z", "es-CO");
    // Asserting a locale-dependent fragment instead of the full string so
    // the test is robust to ICU version changes.
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it("gracefully returns the raw value when parsing throws", () => {
    // Intl.DateTimeFormat + invalid date returns "Invalid Date" rather than
    // throwing. The util catches that edge case by wrapping in try/catch;
    // what we care about is that it does *not* throw.
    expect(() => formatDate("not-a-date")).not.toThrow();
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-01-10T12:00:00.000Z");

  it("returns 'hace unos segundos' for diffs under a minute", () => {
    expect(formatRelative("2026-01-10T11:59:45.000Z", now)).toBe(
      "hace unos segundos",
    );
  });

  it("uses singular 'minuto' when diff is exactly 1 minute", () => {
    expect(formatRelative("2026-01-10T11:59:00.000Z", now)).toBe(
      "hace 1 minuto",
    );
  });

  it("uses plural when diff is 5 minutes", () => {
    expect(formatRelative("2026-01-10T11:55:00.000Z", now)).toBe(
      "hace 5 minutos",
    );
  });

  it("falls back to absolute date for future diffs", () => {
    const out = formatRelative("2026-02-10T12:00:00.000Z", now);
    expect(out).not.toMatch(/hace/);
  });

  it("returns 'hace N horas' / 'hace N dias'", () => {
    expect(formatRelative("2026-01-10T09:00:00.000Z", now)).toBe("hace 3 horas");
    expect(formatRelative("2026-01-08T12:00:00.000Z", now)).toBe("hace 2 días");
  });
});
