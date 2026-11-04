import { NextRequest, NextResponse } from "next/server";
import { COOKIE, makeToken, sessionPlayer } from "@/lib/server/auth";
import { ActionError, runAction } from "@/lib/server/actions";
import { buildState } from "@/lib/server/state";
import { loadAll } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  try {
    const rows = await loadAll();
    let me = sessionPlayer(req, rows);
    const result = await runAction(body, rows, me);
    if (result.login) me = result.login.id;
    if (result.logout) me = null;
    const fresh = await loadAll();
    const res = NextResponse.json({ ok: true, state: buildState(fresh, me) });
    if (result.login) {
      res.cookies.set(COOKIE, makeToken(result.login.id, result.login.v), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 60,
      });
    }
    if (result.logout) res.cookies.delete(COOKIE);
    return res;
  } catch (e) {
    const msg = e instanceof ActionError ? e.message : `Something went wrong: ${(e as Error).message}`;
    return NextResponse.json({ ok: false, error: msg }, { status: e instanceof ActionError ? 400 : 500 });
  }
}
