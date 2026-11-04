import { NextRequest, NextResponse } from "next/server";
import { sessionPlayer } from "@/lib/server/auth";
import { buildState } from "@/lib/server/state";
import { loadAll } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rows = await loadAll();
    const me = sessionPlayer(req, rows);
    return NextResponse.json(buildState(rows, me), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
