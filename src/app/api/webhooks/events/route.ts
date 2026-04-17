import { NextResponse, type NextRequest } from "next/server";

import { listDeliveries } from "@/infrastructure/server/webhooks-store";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : 50;
  return NextResponse.json({ data: listDeliveries(limit) });
}
