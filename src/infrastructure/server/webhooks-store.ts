import "server-only";

import type {
  Webhook,
  WebhookDelivery,
  WebhookEventName,
} from "@/domain/webhook";
import type {
  WebhookCreateInput,
  WebhookUpdateInput,
} from "@/domain/webhook.schema";

/**
 * Server-side, in-memory store for webhook configurations and delivery logs.
 *
 * Like `leads-store`, this lives on `globalThis` so Next.js route handlers
 * share the same state across HMR / worker reloads in dev.
 */
interface WebhooksStoreState {
  webhooks: Webhook[];
  deliveries: WebhookDelivery[];
}

const GLOBAL_KEY = "__omc_webhooks_store__" as const;
const MAX_DELIVERIES = 200;

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_KEY]?: WebhooksStoreState;
};

function now(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getState(): WebhooksStoreState {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      webhooks: seedWebhooks(),
      deliveries: [],
    };
  }
  return g[GLOBAL_KEY];
}

function seedWebhooks(): Webhook[] {
  const ts = now();
  return [
    {
      id: "wh_demo_crm",
      name: "CRM — Pipedrive sandbox",
      url: "https://example-crm.test/hooks/omc-leads",
      events: ["lead.created", "lead.inbound"],
      enabled: true,
      secret: "demo-signature",
      createdAt: ts,
      updatedAt: ts,
      lastDeliveryAt: null,
      lastDeliveryStatus: null,
      deliveryCount: 0,
      failureCount: 0,
    },
    {
      id: "wh_demo_campaigns",
      name: "Campañas — Mailchimp journey",
      url: "https://example-campaigns.test/hooks/new-lead",
      events: ["lead.created"],
      enabled: false,
      createdAt: ts,
      updatedAt: ts,
      lastDeliveryAt: null,
      lastDeliveryStatus: null,
      deliveryCount: 0,
      failureCount: 0,
    },
  ];
}

export function listWebhooks(): Webhook[] {
  return [...getState().webhooks];
}

export function findWebhook(id: string): Webhook | undefined {
  return getState().webhooks.find((w) => w.id === id);
}

export function createWebhook(input: WebhookCreateInput): Webhook {
  const state = getState();
  const ts = now();
  const webhook: Webhook = {
    id: genId("wh"),
    name: input.name,
    url: input.url,
    events: input.events,
    enabled: input.enabled ?? true,
    secret: input.secret,
    createdAt: ts,
    updatedAt: ts,
    lastDeliveryAt: null,
    lastDeliveryStatus: null,
    deliveryCount: 0,
    failureCount: 0,
  };
  state.webhooks = [webhook, ...state.webhooks];
  return webhook;
}

export function updateWebhook(
  id: string,
  patch: WebhookUpdateInput,
): Webhook | null {
  const state = getState();
  const idx = state.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  state.webhooks[idx] = {
    ...state.webhooks[idx],
    ...patch,
    updatedAt: now(),
  };
  return state.webhooks[idx];
}

export function deleteWebhook(id: string): boolean {
  const state = getState();
  const before = state.webhooks.length;
  state.webhooks = state.webhooks.filter((w) => w.id !== id);
  return state.webhooks.length !== before;
}

export function listDeliveries(limit = 50): WebhookDelivery[] {
  return getState().deliveries.slice(0, limit);
}

/** Internal: prepends an entry and trims the log to MAX_DELIVERIES. */
export function recordDelivery(
  delivery: Omit<WebhookDelivery, "id" | "attemptedAt"> & {
    attemptedAt?: string;
  },
): WebhookDelivery {
  const state = getState();
  const entry: WebhookDelivery = {
    id: genId("dl"),
    attemptedAt: delivery.attemptedAt ?? now(),
    ...delivery,
  };
  state.deliveries = [entry, ...state.deliveries].slice(0, MAX_DELIVERIES);

  if (entry.direction === "outbound" && entry.webhookId) {
    const hook = state.webhooks.find((w) => w.id === entry.webhookId);
    if (hook) {
      hook.lastDeliveryAt = entry.attemptedAt;
      hook.lastDeliveryStatus =
        entry.status === "success" ? "success" : "failure";
      hook.deliveryCount += 1;
      if (entry.status === "failure") hook.failureCount += 1;
    }
  }
  return entry;
}

export function findWebhooksForEvent(event: WebhookEventName): Webhook[] {
  return getState().webhooks.filter(
    (w) => w.enabled && w.events.includes(event),
  );
}

/** Reset helper — only used by tests that touch the store. */
export function __resetWebhooksStoreForTests(): void {
  const g = globalThis as GlobalWithStore;
  g[GLOBAL_KEY] = { webhooks: seedWebhooks(), deliveries: [] };
}
