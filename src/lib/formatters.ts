/**
 * Pure formatting helpers — no React, no side-effects.
 * Kept in `lib` so they can be unit-tested in isolation.
 */

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string, locale: string = "es-CO"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "hace unos segundos";
  if (diff < hour) return `hace ${Math.floor(diff / minute)} min`;
  if (diff < day) return `hace ${Math.floor(diff / hour)} h`;
  if (diff < 7 * day) return `hace ${Math.floor(diff / day)} días`;
  return formatDate(iso);
}
