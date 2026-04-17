import "server-only";

import type { Lead } from "@/domain/lead";
import type {
  LeadCreateInput,
  LeadUpdateInput,
} from "@/domain/lead.schema";
import { LEADS_SEED } from "@/infrastructure/mocks/seed";

/**
 * Server-side in-memory leads store.
 *
 * Before this layer existed the app was shipping a MSW service worker to the
 * browser just to fake a backend. Now the Next.js route handlers under
 * `/api/leads/*` own the state directly, so the client only needs
 * React Query + `fetch` against real HTTP endpoints.
 *
 * Because every request to a Next.js route handler may run on a fresh module
 * instance during dev (HMR, parallel workers), we stash the singleton on
 * `globalThis` so CRUD mutations persist across reloads within the same
 * process. In production this still behaves as an in-memory mock — exactly
 * what the prueba técnica requires.
 */
interface LeadsStoreState {
  leads: Lead[];
}

const GLOBAL_KEY = "__omc_leads_store__" as const;

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_KEY]?: LeadsStoreState;
};

function getState(): LeadsStoreState {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { leads: structuredClone(LEADS_SEED) };
  }
  return g[GLOBAL_KEY];
}

function genId(): string {
  return `ld_${Math.random().toString(36).slice(2, 10)}`;
}

export function listLeadsSnapshot(): Lead[] {
  return [...getState().leads];
}

export function findLeadById(id: string): Lead | undefined {
  return getState().leads.find((l) => l.id === id);
}

export function createLead(input: LeadCreateInput): Lead {
  const state = getState();
  const lead: Lead = {
    id: genId(),
    fecha_creacion: new Date().toISOString(),
    ...input,
  };
  state.leads = [lead, ...state.leads];
  return lead;
}

export function updateLead(id: string, patch: LeadUpdateInput): Lead | null {
  const state = getState();
  const idx = state.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  state.leads[idx] = { ...state.leads[idx], ...patch };
  return state.leads[idx];
}

export function deleteLead(id: string): boolean {
  const state = getState();
  const before = state.leads.length;
  state.leads = state.leads.filter((l) => l.id !== id);
  return state.leads.length !== before;
}

/** Reset helper — only used by tests that touch the store. */
export function __resetLeadsStoreForTests(): void {
  const g = globalThis as GlobalWithStore;
  g[GLOBAL_KEY] = { leads: structuredClone(LEADS_SEED) };
}
