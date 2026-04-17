import { NextResponse } from "next/server";

import { computeStats } from "@/infrastructure/api/filter-leads";
import { listLeadsSnapshot } from "@/infrastructure/server/leads-store";

export async function GET() {
  return NextResponse.json(computeStats(listLeadsSnapshot()));
}
