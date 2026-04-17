import type { Lead, LeadSource } from "./lead";

/**
 * Event identifiers emitted by the platform.
 *
 * They map to the moments a CRM / campaign tool typically wants to react to:
 *   - `lead.created` → a new lead arrived (from the UI, from an inbound
 *     webhook, or from an API call).
 *   - `lead.updated` → a lead was edited in the UI or via PATCH /api/leads/:id.
 *   - `lead.deleted` → a lead was removed.
 *   - `lead.inbound` → a lead arrived specifically through the
 *     `/api/webhooks/inbound/:source` endpoint (useful when the downstream
 *     system only cares about funnel inflow, not manual edits).
 */
export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "lead.deleted",
  "lead.inbound",
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_EVENT_LABEL: Record<WebhookEventName, string> = {
  "lead.created": "Lead creado",
  "lead.updated": "Lead actualizado",
  "lead.deleted": "Lead eliminado",
  "lead.inbound": "Lead entrante (funnel)",
};

/**
 * Inbound sources pre-whitelisted for `/api/webhooks/inbound/:source`.
 *
 * They are the same channels supported by the domain (`LeadSource`) plus an
 * explicit `crm` bucket so a generic CRM automation doesn't have to pretend
 * to be "otro".
 */
export const INBOUND_SOURCES = [
  "instagram",
  "facebook",
  "landing_page",
  "referido",
  "crm",
  "otro",
] as const;

export type InboundSource = (typeof INBOUND_SOURCES)[number];

export function inboundSourceToLeadSource(source: InboundSource): LeadSource {
  return source === "crm" ? "otro" : source;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEventName[];
  enabled: boolean;
  /** Optional shared secret sent as `x-omc-signature` header on every call. */
  secret?: string;
  createdAt: string;
  updatedAt: string;
  /** Stats for the UI's “last delivery” column. */
  lastDeliveryAt: string | null;
  lastDeliveryStatus: "success" | "failure" | null;
  deliveryCount: number;
  failureCount: number;
}

export interface WebhookEventPayload {
  event: WebhookEventName;
  /** ISO timestamp of the event, NOT of the delivery attempt. */
  emittedAt: string;
  data: Lead | { id: string };
  /** Optional channel (e.g. the inbound source) for `lead.inbound`. */
  source?: InboundSource;
}

/**
 * Persisted log of every webhook delivery attempt + every inbound request
 * received. The UI renders the last N events (newest first) so users can see
 * the automation working end-to-end without any external tooling.
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string | null; // null for inbound entries that didn't fan out
  direction: "outbound" | "inbound";
  event: WebhookEventName;
  status: "success" | "failure" | "skipped";
  attemptedAt: string;
  httpStatus: number | null;
  message: string;
  /** Useful excerpt of the payload so the UI doesn't have to store the full body. */
  summary: string;
}

export interface PaginatedDeliveries {
  data: WebhookDelivery[];
  total: number;
}
