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

  // Future dates fall back to the absolute formatter to avoid returning
  // misleading "hace unos segundos" for any negative diff.
  if (diff < 0) return formatDate(iso);
  if (diff < minute) return "hace unos segundos";
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `hace ${mins} ${mins === 1 ? "minuto" : "minutos"}`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  }
  return formatDate(iso);
}
