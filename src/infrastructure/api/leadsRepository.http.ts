import type {
  Lead,
  LeadFilters,
  LeadStats,
  PaginatedLeads,
} from "@/domain/lead";
import type {
  LeadCreateInput,
  LeadUpdateInput,
} from "@/domain/lead.schema";

import type { LeadsRepository } from "./leadsRepository";

function buildQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const httpLeadsRepository: LeadsRepository = {
  async list(filters) {
    const res = await fetch(`/api/leads${buildQuery(filters)}`);
    return json<PaginatedLeads>(res);
  },
  async getById(id) {
    const res = await fetch(`/api/leads/${id}`);
    return json<Lead>(res);
  },
  async create(input: LeadCreateInput) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return json<Lead>(res);
  },
  async update(id, input: LeadUpdateInput) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return json<Lead>(res);
  },
  async remove(id) {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    await json<void>(res);
  },
  async stats() {
    const res = await fetch("/api/leads/stats");
    return json<LeadStats>(res);
  },
};
