"use client";

import { create } from "zustand";

import type { LeadFilters, LeadSource } from "@/domain/lead";
import { LEAD_SOURCES } from "@/domain/lead";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

function parseSource(value: string | null): LeadSource | "all" {
  if (!value) return "all";
  return (LEAD_SOURCES as readonly string[]).includes(value)
    ? (value as LeadSource)
    : "all";
}

interface LeadsFiltersState {
  q: string;
  source: LeadSource | "all";
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
  sort: "fecha_desc" | "fecha_asc";
  setQ: (q: string) => void;
  setSource: (source: LeadSource | "all") => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setPage: (page: number) => void;
  setSort: (sort: "fecha_desc" | "fecha_asc") => void;
  reset: () => void;
  hydrateFromParams: (sp: URLSearchParams) => void;
  toQueryFilters: () => LeadFilters;
  toSearchParams: () => URLSearchParams;
}

const INITIAL = {
  q: "",
  source: "all" as const,
  from: null,
  to: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: "fecha_desc" as const,
};

export const useLeadsFilters = create<LeadsFiltersState>((set, get) => ({
  ...INITIAL,
  setQ: (q) => set({ q, page: 1 }),
  setSource: (source) => set({ source, page: 1 }),
  setDateRange: (from, to) => set({ from, to, page: 1 }),
  setPage: (page) => set({ page }),
  setSort: (sort) => set({ sort, page: 1 }),
  reset: () => set({ ...INITIAL }),
  hydrateFromParams: (sp) => {
    const pageNum = Number(sp.get("page") ?? 1);
    set({
      q: sp.get("q") ?? "",
      source: parseSource(sp.get("source")),
      from: sp.get("from"),
      to: sp.get("to"),
      // Floor to an integer so `?page=2.5` doesn't slide the pagination
      // slice to `start=15` (between page 2 and 3 boundaries).
      page:
        Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1,
      sort:
        sp.get("sort") === "fecha_asc"
          ? "fecha_asc"
          : "fecha_desc",
    });
  },
  toQueryFilters: () => {
    const { q, source, from, to, page, pageSize, sort } = get();
    return {
      q: q || undefined,
      source: source === "all" ? undefined : source,
      from: from ?? undefined,
      to: to ?? undefined,
      page,
      pageSize,
      sort,
    };
  },
  toSearchParams: () => {
    const { q, source, from, to, page, sort } = get();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (source !== "all") sp.set("source", source);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (page > 1) sp.set("page", String(page));
    if (sort !== "fecha_desc") sp.set("sort", sort);
    return sp;
  },
}));
