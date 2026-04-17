import { NextResponse, type NextRequest } from "next/server";

import { leadUpdateSchema } from "@/domain/lead.schema";
import {
  deleteLead,
  findLeadById,
  updateLead,
} from "@/infrastructure/server/leads-store";
import { dispatchEvent } from "@/infrastructure/server/webhook-dispatcher";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = findLeadById(id);
  if (!lead) {
    return NextResponse.json(
      { message: "Lead no encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json(lead);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const raw = await request.json().catch(() => null);
  const parsed = leadUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const lead = updateLead(id, parsed.data);
  if (!lead) {
    return NextResponse.json(
      { message: "Lead no encontrado" },
      { status: 404 },
    );
  }
  await dispatchEvent({
    event: "lead.updated",
    emittedAt: new Date().toISOString(),
    data: lead,
  });
  return NextResponse.json(lead);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = deleteLead(id);
  if (!removed) {
    return NextResponse.json(
      { message: "Lead no encontrado" },
      { status: 404 },
    );
  }
  await dispatchEvent({
    event: "lead.deleted",
    emittedAt: new Date().toISOString(),
    data: { id },
  });
  return new NextResponse(null, { status: 204 });
}
