"use client";

import { useState } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Loading, SectionTitle, teamBg, teamBorder, teamGrad, teamSoft, teamText } from "@/components/ui";
import { CAPTAINS, DRAFT_ORDER } from "@/lib/config";
import { pname, roster } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function DraftPage() {
  const { state, d, me, act } = useGame();
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!state || !d) return <Loading />;

  const { draft } = d;
  const onClock = draft.onClock;
  const myTeam: TeamId | null = me?.captain ? me.team : null;
  const myTurn = !!onClock && myTeam === onClock;
  const isCaptain = !!me?.captain;
  const selected = state.players.find((p) => p.id === sel);

  const pick = async () => {
    if (!sel) return;
    setBusy(true);
    const r = await act("draftPick", { playerId: sel });
    setBusy(false);
    if (r.ok) setSel(null);
  };

  return (
    <div className="pb-24">
      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Live</div>
          <h1 className="font-display text-4xl font-black uppercase italic leading-none">The Draft</h1>
        </div>
        <div className="text-right font-display text-lg font-bold text-muted tabular">
          {draft.complete ? "Complete" : `Pick ${draft.n + 1} / ${DRAFT_ORDER.length}`}
        </div>
      </div>

      {/* On the clock */}
      {onClock ? (
        <div className={`relative mt-4 overflow-hidden rounded-2xl border ${teamBorder[onClock]} bg-gradient-to-br ${teamGrad[onClock]} p-4`}>
          <div className="shine pointer-events-none absolute inset-0" />
          <div className="flex items-center gap-3">
            <Avatar p={state.players.find((p) => p.id === CAPTAINS[onClock])!} size={56} />
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80">
                <span className="pulse-dot h-2 w-2 rounded-full bg-gold" /> On the clock
              </div>
              <div className="font-display text-2xl font-extrabold uppercase">{pname(state, CAPTAINS[onClock])}</div>
              <div className={`text-sm font-semibold ${teamText[onClock]}`}>{state.teams[onClock].name}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/80">
            {myTurn
              ? "Your pick. Tap a player below, then confirm."
              : me
                ? `Waiting on ${pname(state, CAPTAINS[onClock])}…`
                : "Captains: log in to make your picks."}
          </p>
        </div>
      ) : (
        <Card className="mt-4 p-5 text-center">
          <div className="text-4xl">🏌️</div>
          <div className="mt-2 font-display text-3xl font-black uppercase italic text-neon glow-neon">Draft Complete</div>
          <p className="mt-1 text-sm text-muted">Teams are set. Day 1 matchups are live.</p>
          <Button href="/" className="mt-4 w-full">
            Open the Tournament →
          </Button>
        </Card>
      )}

      {/* Available */}
      {!draft.complete && (
        <>
          <SectionTitle right={<span className="text-xs text-muted">{draft.available.length} left</span>}>Available</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {draft.available.map((p) => {
              const active = sel === p.id;
              return (
                <button
                  key={p.id}
                  disabled={!myTurn}
                  onClick={() => setSel(active ? null : p.id)}
                  className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition ${
                    active ? "scale-[1.02] border-neon bg-neon/10 shadow-[0_0_24px_rgba(0,240,138,0.25)]" : "border-line bg-card"
                  } ${myTurn ? "active:scale-95" : ""}`}
                >
                  <Avatar p={p} size={64} />
                  <div className="mt-2 font-display text-xl font-bold uppercase">{p.name}</div>
                  {p.nickname && <div className="text-xs italic text-gold">&ldquo;{p.nickname}&rdquo;</div>}
                  {p.report && <div className="mt-1 line-clamp-2 text-[11px] text-muted">{p.report}</div>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Draft board */}
      <SectionTitle>Draft Board</SectionTitle>
      <Card className="divide-y divide-line">
        {DRAFT_ORDER.map((t, i) => {
          const p = draft.picks[i];
          const current = i === draft.n;
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${current ? "bg-gold/5" : ""}`}>
              <span className="w-6 font-display text-lg font-bold text-muted tabular">{i + 1}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${teamBg[t]}`} />
              <span className="w-24 truncate text-sm text-muted">{pname(state, CAPTAINS[t])}</span>
              {p ? (
                <span className="flex items-center gap-2 font-semibold">
                  <Avatar p={p} size={24} /> {p.name}
                </span>
              ) : current ? (
                <span className="text-sm font-semibold text-gold">On the clock…</span>
              ) : (
                <span className="text-sm text-line">—</span>
              )}
            </div>
          );
        })}
      </Card>

      {/* Teams */}
      <SectionTitle>Teams</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {(["B", "A"] as TeamId[]).map((t) => (
          <div key={t} className={`rounded-2xl border ${teamBorder[t]} ${teamSoft[t]} p-3`}>
            <div className={`mb-2 truncate font-display text-lg font-bold uppercase ${teamText[t]}`}>{state.teams[t].name}</div>
            <div className="flex flex-col gap-2">
              {roster(state, t).map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <Avatar p={p} size={26} />
                  <span className="font-semibold">{p.name}</span>
                  {i === 0 && <span className="text-[10px] font-bold text-gold">C</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isCaptain && draft.n > 0 && (
        <Button variant="ghost" className="mt-6 w-full" onClick={() => act("draftUndo")}>
          ↩ Undo last pick
        </Button>
      )}

      {/* Confirm bar */}
      {myTurn && selected && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4 pb-3">
          <div className="pop-in mx-auto max-w-md">
            <Button onClick={pick} disabled={busy} className="w-full py-4 text-lg">
              Draft {selected.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
