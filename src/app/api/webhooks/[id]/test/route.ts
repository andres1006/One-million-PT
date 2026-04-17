import { NextResponse, type NextRequest } from "next/server";

import type { WebhookEventPayload } from "@/domain/webhook";
import { listLeadsSnapshot } from "@/infrastructure/server/leads-store";
import { __internal } from "@/infrastructure/server/webhook-dispatcher";
import { findWebhook } from "@/infrastructure/server/webhooks-store";

type Params = { params: Promise<{ id: string }> };

/**
 * Dispatches a single test payload to the configured webhook URL.
 *
 * This is what the UI's “Probar” button hits. It uses the first webhook
 * event the user has subscribed to so the downstream consumer can verify
 * the shape they will actually receive in production.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const hook = findWebhook(id);
  if (!hook) {
    return NextResponse.json(
      { message: "Webhook no encontrado" },
      { status: 404 },
    );
  }
  const event = hook.events[0] ?? "lead.created";
  const sampleLead =
    listLeadsSnapshot()[0] ?? {
      id: "ld_sample",
      nombre: "Lead de prueba",
      email: "prueba@example.com",
      fuente: "otro" as const,
      fecha_creacion: new Date().toISOString(),
    };
  const payload: WebhookEventPayload = {
    event,
    emittedAt: new Date().toISOString(),
    data: sampleLead,
  };
  const delivery = await __internal.deliverOne(hook, payload);
  return NextResponse.json(delivery);
}
