"use client";

import { MomentumChart } from "@/components/Board";
import { useGame } from "@/components/GameProvider";
import { Avatar, Loading, SectionTitle, teamText } from "@/components/ui";
import { CAPTAINS } from "@/lib/config";
import type { TeamId } from "@/lib/types";

export default function TeamsPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;
  const { totals } = d;
  const diff = totals.A - totals.B;
  const leader: TeamId | null = diff > 0 ? "A" : diff < 0 ? "B" : null;

  return (
    <div className="pt-2">
      {/* Hero scoreboard */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-ta/25 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-tb/25 to-transparent" />
        <div className="relative p-4">
          <div className="mb-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            {totals.started && !totals.complete ? <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-tb" /> : null}
            {totals.complete ? "Final score" : totals.started ? "Live score" : "Tournament"}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {(["A", "B"] as TeamId[]).map((t, i) => (
              <div key={t} className={`flex flex-col items-center ${i === 1 ? "order-3" : ""}`}>
                <Avatar p={s.players.find((p) => p.id === CAPTAINS[t])!} size={44} />
                <div className={`mt-1 max-w-full truncate text-center font-display text-sm font-bold uppercase ${teamText[t]}`}>{s.teams[t].name}</div>
                <div className={`font-display text-6xl font-black leading-none tabular ${leader === t ? "text-white glow-neon" : "text-white/70"}`}>{totals[t]}</div>
              </div>
            ))}
            <div className="order-2 font-display text-2xl font-black italic text-muted">VS</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-muted">
            <div className="rounded-lg bg-black/30 py-1.5">
              Day 1 · <b className="text-ta tabular">{totals.day1.A}</b> – <b className="text-tb tabular">{totals.day1.B}</b>
            </div>
            <div className="rounded-lg bg-black/30 py-1.5">
              Day 2 · <b className="text-ta tabular">{totals.day2.A}</b> – <b className="text-tb tabular">{totals.day2.B}</b>
            </div>
          </div>
        </div>
      </div>


      <SectionTitle>Momentum</SectionTitle>
      <MomentumChart d={d} s={s} />

    </div>
  );
}
