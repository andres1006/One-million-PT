import { NextResponse, type NextRequest } from "next/server";

import { webhookCreateSchema } from "@/domain/webhook.schema";
import {
  createWebhook,
  listWebhooks,
} from "@/infrastructure/server/webhooks-store";

export async function GET() {
  return NextResponse.json({ data: listWebhooks() });
}

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null);
  const parsed = webhookCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const webhook = createWebhook(parsed.data);
  return NextResponse.json(webhook, { status: 201 });
}
