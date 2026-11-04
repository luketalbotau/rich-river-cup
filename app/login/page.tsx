"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Loading } from "@/components/ui";
import type { Player } from "@/lib/types";

function PinPad({ onDone, busy }: { onDone: (pin: string) => void; busy: boolean }) {
  const [pin, setPin] = useState("");
  const press = (k: string) => {
    if (busy) return;
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      onDone(next);
      setTimeout(() => setPin(""), 250);
    }
  };
  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-6 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 ${i < pin.length ? "border-neon bg-neon shadow-[0_0_12px_#00f08a]" : "border-line"}`} />
        ))}
      </div>
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              onClick={() => press(k)}
              className="h-16 rounded-2xl border border-line bg-card2 font-display text-3xl font-bold active:scale-95 active:bg-line"
            >
              {k === "del" ? "⌫" : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function LoginInner() {
  const { state, me, act, toast } = useGame();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [sel, setSel] = useState<Player | null>(null);
  const [first, setFirst] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!state) return <Loading />;

  if (me && !sel) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <Avatar p={me} size={88} />
        <p className="text-lg">
          You&apos;re logged in as <b>{me.name}</b>
        </p>
        <Button href={next}>Let&apos;s go</Button>
        <Button variant="ghost" onClick={() => act("logout")}>
          Log out
        </Button>
      </div>
    );
  }

  const submit = async (pin: string) => {
    if (!sel) return;
    if (!sel.hasPin && first === null) {
      setFirst(pin);
      return;
    }
    if (!sel.hasPin && first !== pin) {
      setFirst(null);
      toast("PINs didn't match. Try again", "err");
      return;
    }
    setBusy(true);
    const r = await act("login", { playerId: sel.id, pin });
    setBusy(false);
    if (r.ok) router.push(next);
  };

  if (sel) {
    const setting = !sel.hasPin;
    return (
      <div className="flex flex-col items-center pt-6">
        <button onClick={() => { setSel(null); setFirst(null); }} className="mb-4 self-start text-sm text-muted">
          ← Not {sel.name}?
        </button>
        <Avatar p={sel} size={80} />
        <h1 className="mt-3 font-display text-3xl font-bold uppercase">{sel.name}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          {setting ? (first === null ? "First time? Choose a 4-digit PIN" : "Enter it again to confirm") : "Enter your PIN"}
        </p>
        <PinPad onDone={submit} busy={busy} />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h1 className="font-display text-3xl font-extrabold uppercase italic">Who are you?</h1>
      <p className="mb-5 text-sm text-muted">Tap your name. First time in, you&apos;ll set a PIN.</p>
      <div className="grid grid-cols-2 gap-3">
        {state.players.map((p) => (
          <button
            key={p.id}
            onClick={() => setSel(p)}
            className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left active:scale-[0.98]"
          >
            <Avatar p={p} size={44} />
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold uppercase">{p.name}</div>
              <div className="text-[11px] text-muted">{p.captain ? "Captain" : p.hasPin ? "Has PIN" : "New"}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginInner />
    </Suspense>
  );
}
