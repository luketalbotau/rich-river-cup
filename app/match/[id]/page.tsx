"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badges } from "@/components/Board";
import { useGame } from "@/components/GameProvider";
import { AvatarStack, Button, Empty, Live, Loading, OddsChip, Pill, teamText } from "@/components/ui";
import { HOLES, POINTS } from "@/lib/config";
import { fmtOdds, matchStatusText } from "@/lib/logic";
import type { HoleWinner } from "@/lib/types";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { state: s, d, me, act, toast } = useGame();
  const [pending, setPending] = useState<number | null>(null);
  if (!s || !d) return <Loading />;
  const mv = d.byId[id];
  if (!mv) return <Empty>Match not found</Empty>;
  const { match, sum, grid, probs } = mv;
  if (!match.ready) {
    return (
      <div className="pt-6">
        <Empty>{match.day === 2 ? "Day 2 pairs haven't been revealed yet." : "Waiting for the draft to finish."}</Empty>
      </div>
    );
  }
  const people = (ids: string[]) => ids.map((x) => s.players.find((p) => p.id === x)!);
  const short = (ids: string[]) => people(ids).map((p) => p.name).join(" & ");
  const pts = POINTS[match.day];

  const tap = async (hole: number, w: HoleWinner) => {
    if (!me) {
      toast("Log in to enter scores", "err");
      return;
    }
    const cur = grid[hole];
    setPending(hole);
    await act("setHole", { matchId: match.id, hole, winner: cur === w ? null : w });
    setPending(null);
  };

  // running lead after each hole
  let run = 0;
  const running: (number | null)[] = [null];
  for (let h = 1; h <= HOLES; h++) {
    const w = grid[h];
    if (w === "A") run++;
    else if (w === "B") run--;
    running.push(w ? run : null);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-muted">← Board</Link>

      {/* Header */}
      <div className="relative mt-2 overflow-hidden rounded-3xl border border-line bg-card p-4">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-ta/20 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-tb/20 to-transparent" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              Day {match.day} · {match.title}
            </span>
            {sum.played > 0 && !sum.complete ? <Live /> : sum.complete ? <Pill className="bg-white/10">Final</Pill> : null}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <AvatarStack ps={people(match.a)} size={48} />
              <div className="text-center text-sm font-bold text-ta">{short(match.a)}</div>
            </div>
            <div className="font-display text-5xl font-black tabular">
              <span className={sum.lead > 0 ? "text-ta" : ""}>{sum.wonA}</span>
              <span className="mx-1 text-muted">-</span>
              <span className={sum.lead < 0 ? "text-tb" : ""}>{sum.wonB}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AvatarStack ps={people(match.b)} size={48} />
              <div className="text-center text-sm font-bold text-tb">{short(match.b)}</div>
            </div>
          </div>
          <div className="mt-2 text-center text-sm font-semibold">{matchStatusText(s, mv)}</div>
          <div className="mt-1 text-center text-xs text-muted">
            Points: <b className="text-ta">{sum.pointsA}</b> – <b className="text-tb">{sum.pointsB}</b> · {sum.halved} halved
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1"><OddsChip label={short(match.a)} odds={fmtOdds(probs.a)} tone="A" /></div>
            <div className="w-20"><OddsChip label="Draw" odds={fmtOdds(probs.h)} /></div>
            <div className="flex-1"><OddsChip label={short(match.b)} odds={fmtOdds(probs.b)} tone="B" /></div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <Badges mv={mv} s={s} />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Button href={`/bets#pool-${match.id}`} variant="gold" className="w-full text-sm">
          Bet on match
        </Button>
      </div>

      {/* Scorecard */}
      <div className="mt-5 mb-2 flex items-end justify-between px-1">
        <h2 className="font-display text-xl font-bold uppercase">Scorecard</h2>
        <span className="text-xs text-muted">Tap who won · tap again to clear</span>
      </div>
      {!me && (
        <Link href={`/login?next=/match/${match.id}`} className="mb-2 block rounded-xl border border-neon/40 bg-neon/10 p-2.5 text-center text-sm font-semibold text-neon">
          Log in to enter scores →
        </Link>
      )}
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {Array.from({ length: HOLES }, (_, i) => i + 1).map((h) => {
          const w = grid[h];
          const r = running[h];
          const btn = (val: HoleWinner, label: string) => {
            const on = w === val;
            const onCls = val === "A" ? "bg-ta text-white shadow-[0_0_16px_rgba(47,140,255,0.5)]" : val === "B" ? "bg-tb text-white shadow-[0_0_16px_rgba(255,61,110,0.5)]" : "bg-white/25 text-white";
            return (
              <button
                onClick={() => tap(h, val)}
                disabled={pending === h}
                className={`h-11 min-w-0 truncate rounded-lg px-2 text-sm font-bold transition active:scale-95 ${on ? onCls : "bg-card2 text-white/60"} ${val === "H" ? "w-14 shrink-0" : "flex-1"}`}
              >
                {label}
              </button>
            );
          };
          return (
            <div key={h} className={`flex items-center gap-2 border-b border-line px-2 py-1.5 last:border-0 ${h === 10 ? "border-t-2 border-t-line" : ""}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${w ? "bg-white/10" : "border border-line text-muted"}`}>
                {h}
              </span>
              {btn("A", match.a.map((x) => s.players.find((p) => p.id === x)?.name).join("/"))}
              {btn("H", "½")}
              {btn("B", match.b.map((x) => s.players.find((p) => p.id === x)?.name).join("/"))}
              <span className={`w-9 shrink-0 text-right font-display text-sm font-bold tabular ${r == null ? "text-transparent" : r > 0 ? teamText.A : r < 0 ? teamText.B : "text-muted"}`}>
                {r == null ? "·" : r === 0 ? "AS" : `${Math.abs(r)}↑`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Each hole won = {pts} pt{pts > 1 ? "s" : ""} · halved = 0</p>
    </div>
  );
}
