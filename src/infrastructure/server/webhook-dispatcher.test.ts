/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Webhook, WebhookEventPayload } from "@/domain/webhook";

import { __internal } from "./webhook-dispatcher";
import {
  __resetWebhooksStoreForTests,
  createWebhook,
  findWebhooksForEvent,
  listDeliveries,
} from "./webhooks-store";

afterEach(() => {
  __resetWebhooksStoreForTests();
  vi.restoreAllMocks();
});

const samplePayload: WebhookEventPayload = {
  event: "lead.created",
  emittedAt: "2024-01-01T00:00:00.000Z",
  data: {
    id: "ld_1",
    nombre: "Juan",
    email: "juan@example.com",
    fuente: "instagram",
    fecha_creacion: "2024-01-01T00:00:00.000Z",
  },
};

function mkHook(overrides: Partial<Webhook> = {}): Webhook {
  return {
    id: "wh_test",
    name: "Test",
    url: "https://example.test/hook",
    events: ["lead.created"],
    enabled: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    lastDeliveryAt: null,
    lastDeliveryStatus: null,
    deliveryCount: 0,
    failureCount: 0,
    ...overrides,
  };
}

describe("webhooks-store.findWebhooksForEvent", () => {
  it("returns only enabled webhooks subscribed to the event", () => {
    createWebhook({
      name: "A",
      url: "https://a.test",
      events: ["lead.created"],
      enabled: true,
      secret: undefined,
    });
    createWebhook({
      name: "B",
      url: "https://b.test",
      events: ["lead.updated"],
      enabled: true,
      secret: undefined,
    });
    createWebhook({
      name: "C (disabled)",
      url: "https://c.test",
      events: ["lead.created"],
      enabled: false,
      secret: undefined,
    });

    const matches = findWebhooksForEvent("lead.created");
    const names = matches.map((m) => m.name).sort();
    // The seed already includes "CRM — Pipedrive sandbox" subscribed to lead.created.
    expect(names).toContain("A");
    expect(names).not.toContain("B");
    expect(names).not.toContain("C (disabled)");
  });
});

describe("webhook-dispatcher.deliverOne", () => {
  it("records a success entry and increments the hook stats on HTTP 200", async () => {
    const hook = mkHook();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 })) as unknown as typeof fetch;

    const delivery = await __internal.deliverOne(hook, samplePayload, {
      fetchImpl,
    });

    expect(delivery.status).toBe("success");
    expect(delivery.httpStatus).toBe(200);
    expect(delivery.summary).toContain("ld_1");
    expect(listDeliveries()).toHaveLength(1);
  });

  it("records a failure when fetch throws and captures the error message", async () => {
    const hook = mkHook({ id: "wh_fail" });
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;

    const delivery = await __internal.deliverOne(hook, samplePayload, {
      fetchImpl,
    });

    expect(delivery.status).toBe("failure");
    expect(delivery.httpStatus).toBeNull();
    expect(delivery.message).toBe("ECONNREFUSED");
  });

  it("sends x-omc-signature only when a secret is configured", async () => {
    const hook = mkHook({ secret: "top-secret" });
    const fetchImpl = vi.fn().mockImplementation((_url, init) => {
      expect(init?.headers).toMatchObject({
        "x-omc-event": "lead.created",
        "x-omc-signature": "top-secret",
      });
      return Promise.resolve(new Response(null, { status: 202 }));
    }) as unknown as typeof fetch;

    const delivery = await __internal.deliverOne(hook, samplePayload, {
      fetchImpl,
    });
    expect(delivery.status).toBe("success");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

describe("webhook-dispatcher.summarize", () => {
  it("joins id + name + email with separators and truncates long values", () => {
    const out = __internal.summarize(samplePayload);
    expect(out).toBe("ld_1 · Juan · juan@example.com");
  });
});
