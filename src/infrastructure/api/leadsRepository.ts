import type {
  Lead,
  LeadFilters,
  PaginatedLeads,
  LeadStats,
} from "@/domain/lead";
import type {
  LeadCreateInput,
  LeadUpdateInput,
} from "@/domain/lead.schema";

/**
 * Repository contract (DIP).
 *
 * The UI depends on this interface, never on a concrete implementation.
 * Current implementations:
 *   - `leadsRepository.http.ts` -> talks to `/api/leads` (MSW in dev, real API later).
 *   - `leadsRepository.local.ts` -> talks to `localStorage` (used in prod preview when
 *     we don't want the MSW runtime).
 */
export interface LeadsRepository {
  list(filters: LeadFilters): Promise<PaginatedLeads>;
  getById(id: string): Promise<Lead>;
  create(input: LeadCreateInput): Promise<Lead>;
  update(id: string, input: LeadUpdateInput): Promise<Lead>;
  remove(id: string): Promise<void>;
  stats(): Promise<LeadStats>;
}
