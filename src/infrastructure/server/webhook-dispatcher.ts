import "server-only";

import type {
  Webhook,
  WebhookDelivery,
  WebhookEventName,
  WebhookEventPayload,
} from "@/domain/webhook";
import {
  findWebhooksForEvent,
  recordDelivery,
} from "@/infrastructure/server/webhooks-store";

/**
 * Fire-and-forget dispatcher for outbound webhooks.
 *
 * The route handler that mutates a lead calls `dispatchEvent({ event, data })`
 * right after it returns the response, so webhook I/O never blocks the API
 * response. Every attempt (success or failure) is recorded in the delivery
 * log that the UI reads from `/api/webhooks/events`.
 */

const DEFAULT_TIMEOUT_MS = 4000;

function summarize(payload: WebhookEventPayload): string {
  const data = payload.data as { id?: string; nombre?: string; email?: string };
  const name = data.nombre ?? "";
  const email = data.email ?? "";
  const id = data.id ?? "";
  const parts = [id, name, email].filter(Boolean);
  const joined = parts.join(" · ");
  return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined;
}

interface DeliverOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

async function deliverOne(
  webhook: Webhook,
  payload: WebhookEventPayload,
  { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }: DeliverOptions = {},
): Promise<WebhookDelivery> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const summary = summarize(payload);

  try {
    const res = await fetchImpl(webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-omc-event": payload.event,
        "x-omc-webhook-id": webhook.id,
        ...(webhook.secret ? { "x-omc-signature": webhook.secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const ok = res.ok;
    return recordDelivery({
      webhookId: webhook.id,
      direction: "outbound",
      event: payload.event,
      status: ok ? "success" : "failure",
      httpStatus: res.status,
      message: ok ? "Delivered" : `HTTP ${res.status} ${res.statusText}`,
      summary,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown fetch failure";
    return recordDelivery({
      webhookId: webhook.id,
      direction: "outbound",
      event: payload.event,
      status: "failure",
      httpStatus: null,
      message,
      summary,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function dispatchEvent(
  payload: WebhookEventPayload,
  options: DeliverOptions = {},
): Promise<WebhookDelivery[]> {
  const targets = findWebhooksForEvent(payload.event);
  if (targets.length === 0) return [];
  const results = await Promise.all(
    targets.map((w) => deliverOne(w, payload, options)),
  );
  return results;
}

/**
 * Log an inbound request regardless of whether it succeeded downstream.
 * The UI lists this together with outbound deliveries so you see both
 * sides of the integration timeline at a glance.
 */
export function recordInbound(params: {
  event: WebhookEventName;
  status: WebhookDelivery["status"];
  httpStatus: number | null;
  message: string;
  summary: string;
}): WebhookDelivery {
  return recordDelivery({
    webhookId: null,
    direction: "inbound",
    event: params.event,
    status: params.status,
    httpStatus: params.httpStatus,
    message: params.message,
    summary: params.summary,
  });
}

/** Exposed for testing only. */
export const __internal = { deliverOne, summarize };
