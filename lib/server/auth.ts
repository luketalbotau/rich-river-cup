import crypto from "crypto";
import type { NextRequest } from "next/server";
import { PLAYERS } from "../config";

const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-secret";
export const COOKIE = "wc_session";

export interface PinRecord {
  salt: string;
  hash: string;
  v: string; // session version; changes when the PIN is reset
}

function hmac(s: string) {
  return crypto.createHmac("sha256", SECRET).update(s).digest("base64url");
}

export function makeToken(id: string, v: string) {
  return `${id}.${v}.${hmac(`${id}.${v}`)}`;
}

export function readToken(req: NextRequest): { id: string; v: string } | null {
  const t = req.cookies.get(COOKIE)?.value;
  if (!t) return null;
  const [id, v, sig] = t.split(".");
  if (!id || !v || !sig) return null;
  const good = hmac(`${id}.${v}`);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (!PLAYERS.some((p) => p.id === id)) return null;
  return { id, v };
}

/** Resolve the logged-in player, checking the PIN hasn't been reset since. */
export function sessionPlayer(req: NextRequest, rows: Map<string, any>): string | null {
  const tok = readToken(req);
  if (!tok) return null;
  const rec = rows.get(`pin:${tok.id}`) as PinRecord | undefined;
  return rec && rec.v === tok.v ? tok.id : null;
}

export function hashPin(pin: string): PinRecord {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
  return { salt, hash, v: crypto.randomBytes(6).toString("hex") };
}

export function checkPin(pin: string, rec: PinRecord) {
  const h = crypto.scryptSync(pin, rec.salt, 32);
  return crypto.timingSafeEqual(h, Buffer.from(rec.hash, "hex"));
}
