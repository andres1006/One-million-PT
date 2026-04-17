import { NextResponse, type NextRequest } from "next/server";

import { listDeliveries } from "@/infrastructure/server/webhooks-store";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  // Clamp to [1, 200]. Without the `Math.max` a negative `limit` slips
  // through `Number("-5") || 50 === -5` and `Array.slice(0, -5)` returns
  // "all except the last 5", the opposite of what we want.
  const parsed = limitParam ? Number(limitParam) : 50;
  const limit = Math.max(
    1,
    Math.min(Number.isFinite(parsed) && parsed !== 0 ? parsed : 50, 200),
  );
  return NextResponse.json({ data: listDeliveries(limit) });
}
