"use client";

import Link from "next/link";
import { MatchCard, MomentumChart, Ticker } from "@/components/Board";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Loading, OddsChip, SectionTitle, teamText } from "@/components/ui";
import { CAPTAINS } from "@/lib/config";
import { fmtOdds, pname } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function Board() {
  const { state: s, d, me } = useGame();
  if (!s || !d) return <Loading />;
  const { totals, draft } = d;

  if (!draft.complete) {
    const onClock = draft.onClock!;
    return (
      <div className="pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 text-center">
          <div className="shine pointer-events-none absolute inset-0" />
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-neon">Step 1</div>
          <h1 className="mt-1 font-display text-5xl font-black uppercase italic leading-none">The Draft</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
            {pname(s, CAPTAINS.B)} picks first, then {pname(s, CAPTAINS.A)}, alternating until all 6 players are taken. The tournament opens when the draft is done.
          </p>
          <div className="mt-5 flex items-center justify-center gap-6">
            {(["A", "B"] as TeamId[]).map((t) => (
              <div key={t} className="flex flex-col items-center gap-1">
                <Avatar p={s.players.find((p) => p.id === CAPTAINS[t])!} size={64} />
                <span className={`font-display text-lg font-bold uppercase ${teamText[t]}`}>{pname(s, CAPTAINS[t])}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-sm">
            Pick {draft.n + 1} of 6 · <b className="text-gold">{pname(s, CAPTAINS[onClock])}</b> on the clock
          </div>
          <Button href="/draft" className="mt-5 w-full py-4 text-lg">
            Enter the Draft Room
          </Button>
          {!me && (
            <Link href="/login" className="mt-3 block text-sm text-muted underline">
              Log in first
            </Link>
          )}
        </div>
      </div>
    );
  }

  const diff = totals.A - totals.B;
  const leader: TeamId | null = diff > 0 ? "A" : diff < 0 ? "B" : null;
  const pA = totals.probs.a + totals.probs.h / 2;
  const day1 = d.matches.filter((m) => m.match.day === 1);
  const day2 = d.matches.filter((m) => m.match.day === 2);

  return (
    <div>
      {totals.decided && (
        <Link href="/victory" className="mb-3 block rounded-2xl bg-gold p-3 text-center font-display text-lg font-black uppercase italic text-black shadow-[0_0_30px_rgba(255,210,63,0.4)]">
          🏆 {totals.winner === "H" ? "It's a draw!" : `${s.teams[totals.winner as TeamId].name} win the Cup!`} Tap to celebrate →
        </Link>
      )}

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

      {/* Odds */}
      <div className="mt-3 rounded-2xl border border-line bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-sm font-bold uppercase tracking-wider">Weekend Winner</span>
          <Link href="/bets/new?market=overall" className="text-xs font-bold text-neon">
            Bet on it →
          </Link>
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><OddsChip label={s.teams.A.name} odds={fmtOdds(totals.probs.a)} tone="A" /></div>
          <div className="w-20"><OddsChip label="Draw" odds={fmtOdds(totals.probs.h)} tone="draw" /></div>
          <div className="flex-1"><OddsChip label={s.teams.B.name} odds={fmtOdds(totals.probs.b)} tone="B" /></div>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-tb">
          <div className="bg-ta transition-all duration-700" style={{ width: `${pA * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-semibold">
          <span className="text-ta tabular">{Math.round(pA * 100)}%</span>
          <span className="text-muted">Win probability</span>
          <span className="text-tb tabular">{100 - Math.round(pA * 100)}%</span>
        </div>
      </div>

      <Ticker s={s} />

      <SectionTitle>Momentum</SectionTitle>
      <MomentumChart d={d} s={s} />

      <SectionTitle right={<span className="text-xs text-muted">Singles · 1 pt per hole</span>}>Day 1</SectionTitle>
      <div className="flex flex-col gap-3">
        {day1.map((mv) => (
          <MatchCard key={mv.match.id} mv={mv} s={s} />
        ))}
      </div>

      <SectionTitle right={<span className="text-xs text-muted">Scramble · 2 pts per hole</span>}>Day 2</SectionTitle>
      {d.revealed ? (
        <div className="flex flex-col gap-3">
          {day2.map((mv) => (
            <MatchCard key={mv.match.id} mv={mv} s={s} />
          ))}
          <Link href="/day2" className="text-center text-xs text-muted underline">
            Replay the reveal
          </Link>
        </div>
      ) : (
        <Card className="p-4">
          <div className="text-sm font-semibold">Pairs are secret until both captains lock in.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["A", "B"] as TeamId[]).map((t) => (
              <div key={t} className="rounded-xl bg-black/30 p-2.5 text-center">
                <div className={`truncate text-xs font-bold uppercase ${teamText[t]}`}>{s.teams[t].name}</div>
                <div className="mt-1 text-sm">{s.pairs[t].locked ? "🔒 Locked in" : "⏳ Choosing…"}</div>
              </div>
            ))}
          </div>
          <Button href="/day2" variant="ghost" className="mt-3 w-full">
            {me?.captain ? "Set your pairs" : "Day 2 pairs"}
          </Button>
        </Card>
      )}
    </div>
  );
}
