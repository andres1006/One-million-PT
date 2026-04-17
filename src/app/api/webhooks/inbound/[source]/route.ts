import { NextResponse, type NextRequest } from "next/server";

import {
  INBOUND_SOURCES,
  inboundSourceToLeadSource,
  type InboundSource,
} from "@/domain/webhook";
import { inboundLeadSchema } from "@/domain/webhook.schema";
import { createLead } from "@/infrastructure/server/leads-store";
import {
  dispatchEvent,
  recordInbound,
} from "@/infrastructure/server/webhook-dispatcher";

type Params = { params: Promise<{ source: string }> };

/**
 * Inbound webhook — this is the endpoint CRMs and funnel tools POST to when a
 * new lead is captured. The payload is normalized to the internal Lead schema,
 * persisted through the leads store and then fanned out to every outbound
 * webhook subscribed to `lead.created` / `lead.inbound`.
 *
 * Example curl:
 *   curl -X POST http://localhost:3000/api/webhooks/inbound/instagram \
 *     -H 'content-type: application/json' \
 *     -d '{"name":"Juan","email":"juan@example.com","phone":"+57 300","budget":200}'
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { source } = await params;
  if (!(INBOUND_SOURCES as readonly string[]).includes(source)) {
    recordInbound({
      event: "lead.inbound",
      status: "failure",
      httpStatus: 400,
      message: `Fuente desconocida: ${source}`,
      summary: source,
    });
    return NextResponse.json(
      {
        message: `Fuente desconocida. Usa una de: ${INBOUND_SOURCES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const inboundSource = source as InboundSource;
  const raw = await request.json().catch(() => null);
  const parsed = inboundLeadSchema.safeParse(raw);
  if (!parsed.success) {
    recordInbound({
      event: "lead.inbound",
      status: "failure",
      httpStatus: 400,
      message: "Payload inválido",
      summary: inboundSource,
    });
    return NextResponse.json(
      { message: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const lead = createLead({
    nombre: payload.name,
    email: payload.email,
    telefono: payload.phone,
    fuente: inboundSourceToLeadSource(inboundSource),
    producto_interes: payload.product,
    presupuesto: payload.budget,
  });

  recordInbound({
    event: "lead.inbound",
    status: "success",
    httpStatus: 201,
    message: `Lead capturado desde ${inboundSource}`,
    summary: `${lead.id} · ${lead.nombre} · ${lead.email}`,
  });

  const emittedAt = new Date().toISOString();
  await dispatchEvent({
    event: "lead.inbound",
    emittedAt,
    data: lead,
    source: inboundSource,
  });
  await dispatchEvent({
    event: "lead.created",
    emittedAt,
    data: lead,
  });

  return NextResponse.json(lead, { status: 201 });
}
