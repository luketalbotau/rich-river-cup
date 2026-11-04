"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/components/GameProvider";
import { TradingCard } from "@/components/TradingCard";
import { Button, Card, Empty, Loading } from "@/components/ui";

async function resize(file: File, max = 480): Promise<string> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = url;
  });
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(max, side);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { state: s, d, me, act, toast } = useGame();
  const p = s?.players.find((x) => x.id === id);
  const isMe = !!me && me.id === id;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: "", shot: "", report: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (p && !editing) setForm({ nickname: p.nickname ?? "", shot: p.shot ?? "", report: p.report ?? "" });
  }, [p, editing]);

  if (!s || !d) return <Loading />;
  if (!p) return <Empty>Player not found</Empty>;

  const onFile = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try {
      const dataUrl = await resize(f);
      const r = await act("setPhoto", { dataUrl });
      if (r.ok) toast("Photo updated");
    } catch {
      toast("Couldn't read that image", "err");
    }
    setUploading(false);
  };

  const save = async () => {
    const r = await act("updateProfile", form);
    if (r.ok) {
      setEditing(false);
      toast("Card updated");
    }
  };

  return (
    <div>
      <Link href="/players" className="text-sm text-muted">← Squad</Link>
      <div className="mx-auto mt-3 max-w-[340px]">
        <TradingCard p={p} s={s} d={d} />
      </div>

      {isMe && (
        <div className="mt-5 flex flex-col gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="gold" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : p.photoV ? "📸 Change photo" : "📸 Add your photo"}
          </Button>
          {!editing ? (
            <Button variant="ghost" onClick={() => setEditing(true)}>✏️ Edit your card</Button>
          ) : (
            <Card className="flex flex-col gap-3 p-4">
              <Field label="Nickname" value={form.nickname} max={30} onChange={(v) => setForm({ ...form, nickname: v })} placeholder="The Shank Redemption" />
              <Field label="Signature shot" value={form.shot} max={40} onChange={(v) => setForm({ ...form, shot: v })} placeholder="Low stinger into the trees" />
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Scouting report</span>
                <textarea
                  value={form.report}
                  maxLength={280}
                  rows={4}
                  onChange={(e) => setForm({ ...form, report: e.target.value })}
                  placeholder="Long off the tee, allergic to putting…"
                  className="mt-1 w-full rounded-xl border border-line bg-black/40 p-3 outline-none focus:border-neon"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </div>
            </Card>
          )}
        </div>
      )}
      {!me && (
        <p className="mt-4 text-center text-sm text-muted">
          Is this you? <Link href={`/login?next=/players/${p.id}`} className="text-neon underline">Log in</Link> to edit your card.
        </p>
      )}
    </div>
  );
}

function Field({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <input
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-black/40 px-3 py-3 outline-none focus:border-neon"
      />
    </label>
  );
}
