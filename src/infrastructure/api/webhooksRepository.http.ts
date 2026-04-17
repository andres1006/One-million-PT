import type { Webhook, WebhookDelivery } from "@/domain/webhook";
import type {
  WebhookCreateInput,
  WebhookUpdateInput,
} from "@/domain/webhook.schema";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * HTTP client for the webhook endpoints. React Query hooks in
 * `useWebhooks` consume this repo — the server-side state lives in the
 * Next.js route handlers, so this file is intentionally thin.
 */
export const httpWebhooksRepository = {
  async list(): Promise<Webhook[]> {
    const res = await fetch("/api/webhooks");
    const body = await json<{ data: Webhook[] }>(res);
    return body.data;
  },
  async create(input: WebhookCreateInput): Promise<Webhook> {
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return json<Webhook>(res);
  },
  async update(id: string, input: WebhookUpdateInput): Promise<Webhook> {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return json<Webhook>(res);
  },
  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    await json<void>(res);
  },
  async test(id: string): Promise<WebhookDelivery> {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
    return json<WebhookDelivery>(res);
  },
  async events(limit = 50): Promise<WebhookDelivery[]> {
    const res = await fetch(`/api/webhooks/events?limit=${limit}`);
    const body = await json<{ data: WebhookDelivery[] }>(res);
    return body.data;
  },
};
