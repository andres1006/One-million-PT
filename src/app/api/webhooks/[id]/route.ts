import { NextResponse, type NextRequest } from "next/server";

import { webhookUpdateSchema } from "@/domain/webhook.schema";
import {
  deleteWebhook,
  findWebhook,
  updateWebhook,
} from "@/infrastructure/server/webhooks-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const hook = findWebhook(id);
  if (!hook) {
    return NextResponse.json(
      { message: "Webhook no encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json(hook);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const raw = await request.json().catch(() => null);
  const parsed = webhookUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const hook = updateWebhook(id, parsed.data);
  if (!hook) {
    return NextResponse.json(
      { message: "Webhook no encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json(hook);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = deleteWebhook(id);
  if (!removed) {
    return NextResponse.json(
      { message: "Webhook no encontrado" },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
