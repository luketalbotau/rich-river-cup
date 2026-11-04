import { NextRequest } from "next/server";
import { get } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url: string | null = await get(`photo:${id}`);
  const m = url?.match(/^data:(image\/[a-z]+);base64,(.*)$/);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "content-type": m[1], "cache-control": "public, max-age=31536000, immutable" },
  });
}
