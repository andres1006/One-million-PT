/**
 * Core Lead domain types.
 *
 * Kept framework-agnostic so the same contract can be reused by the UI,
 * the mock layer (MSW) and (eventually) a real HTTP backend.
 */

export const LEAD_SOURCES = [
  "instagram",
  "facebook",
  "landing_page",
  "referido",
  "otro",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  landing_page: "Landing Page",
  referido: "Referido",
  otro: "Otro",
};

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fuente: LeadSource;
  producto_interes?: string;
  presupuesto?: number;
  fecha_creacion: string; // ISO-8601
}

export interface LeadFilters {
  q?: string;
  source?: LeadSource;
  from?: string; // ISO
  to?: string; // ISO
  page?: number;
  pageSize?: number;
  sort?: "fecha_desc" | "fecha_asc";
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeadStats {
  total: number;
  bySource: Record<LeadSource, number>;
  averageBudget: number;
  lastSevenDays: number;
  previousSevenDays: number;
  topSource: LeadSource | null;
  /**
   * Leads created per day for the last 14 days, ordered oldest → newest.
   * Dates are ISO YYYY-MM-DD.
   */
  daily: Array<{ date: string; count: number }>;
}
