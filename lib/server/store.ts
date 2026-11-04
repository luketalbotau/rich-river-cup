import fs from "fs";
import path from "path";

/**
 * Tiny key/value store.
 * - On Vercel: a single Supabase table `kv (key text primary key, value jsonb)`,
 *   accessed server-side only with the service role key.
 * - Locally without Supabase env vars: a JSON file in .data/db.json.
 */

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = !!(SB_URL && SB_KEY);
const TABLE = "kv";

function headers(extra: Record<string, string> = {}): Record<string, string> {
  // Legacy service_role keys are JWTs (eyJ...) and go in both headers.
  // Newer sb_secret_... keys only go in the apikey header.
  const h: Record<string, string> = { apikey: SB_KEY!, "Content-Type": "application/json", ...extra };
  if (SB_KEY!.startsWith("eyJ")) h.Authorization = `Bearer ${SB_KEY}`;
  return h;
}

const enc = encodeURIComponent;

// ---------- file backend ----------
const FILE = path.join(process.cwd(), ".data", "db.json");

function readFile(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeFile(db: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db));
}
function assertConfigured() {
  if (!useSupabase && process.env.VERCEL) {
    throw new Error("Database not connected. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }
}

async function check(r: Response, what: string) {
  if (!r.ok) throw new Error(`Database ${what} failed (${r.status}): ${await r.text()}`);
}

/** Load every row except photos. */
export async function loadAll(): Promise<Map<string, any>> {
  assertConfigured();
  if (!useSupabase) {
    return new Map(Object.entries(readFile()).filter(([k]) => !k.startsWith("photo:")));
  }
  const out = new Map<string, any>();
  const page = 1000;
  for (let offset = 0; ; offset += page) {
    const r = await fetch(
      `${SB_URL}/rest/v1/${TABLE}?select=key,value&key=not.like.${enc("photo:*")}&order=key&limit=${page}&offset=${offset}`,
      { headers: headers(), cache: "no-store" },
    );
    await check(r, "read");
    const rows: { key: string; value: unknown }[] = await r.json();
    for (const row of rows) out.set(row.key, row.value);
    if (rows.length < page) break;
  }
  return out;
}

export async function get(key: string): Promise<any | null> {
  assertConfigured();
  if (!useSupabase) return readFile()[key] ?? null;
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?select=value&key=eq.${enc(key)}`, {
    headers: headers(),
    cache: "no-store",
  });
  await check(r, "read");
  const rows: { value: unknown }[] = await r.json();
  return rows[0]?.value ?? null;
}

export async function put(entries: [string, unknown][]) {
  if (!entries.length) return;
  assertConfigured();
  if (!useSupabase) {
    const db = readFile();
    for (const [k, v] of entries) db[k] = v;
    writeFile(db);
    return;
  }
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(entries.map(([key, value]) => ({ key, value }))),
  });
  await check(r, "write");
}

export async function del(keys: string[]) {
  if (!keys.length) return;
  assertConfigured();
  if (!useSupabase) {
    const db = readFile();
    for (const k of keys) delete db[k];
    writeFile(db);
    return;
  }
  const list = keys.map((k) => `"${k}"`).join(",");
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?key=in.(${enc(list)})`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=minimal" }),
  });
  await check(r, "delete");
}

/** Write a bet only if nobody has taken it yet. Returns false if someone beat you to it. */
export async function claimBet(key: string, value: unknown): Promise<boolean> {
  assertConfigured();
  if (!useSupabase) {
    const db = readFile();
    const cur = db[key] as { takerId?: string } | undefined;
    if (!cur || cur.takerId) return false;
    db[key] = value;
    writeFile(db);
    return true;
  }
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?key=eq.${enc(key)}&value->>takerId=is.null`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({ value }),
  });
  await check(r, "write");
  const rows: unknown[] = await r.json();
  return rows.length > 0;
}
