"use client";

import Link from "next/link";
import { MatchCard, Ticker } from "@/components/Board";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Loading, SectionTitle, teamText } from "@/components/ui";
import { CAPTAINS } from "@/lib/config";
import { pname } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function Scoring() {
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

  const day1 = d.matches.filter((m) => m.match.day === 1);
  const day2 = d.matches.filter((m) => m.match.day === 2);

  return (
    <div>
      {totals.decided && (
        <Link href="/victory" className="mb-3 block rounded-2xl bg-gold p-3 text-center font-display text-lg font-black uppercase italic text-black shadow-[0_0_30px_rgba(255,210,63,0.4)]">
          🏆 {totals.winner === "H" ? "It's a draw!" : `${s.teams[totals.winner as TeamId].name} win the Cup!`} Tap to celebrate →
        </Link>
      )}

      <h1 className="pt-2 font-display text-4xl font-black uppercase italic leading-none">Scoring</h1>

      <Ticker s={s} />

      <SectionTitle right={<span className="text-xs text-muted">Scramble · 2 pts per hole</span>}>Day 1</SectionTitle>
      <div className="flex flex-col gap-3">
        {day1.map((mv) => (
          <MatchCard key={mv.match.id} mv={mv} s={s} />
        ))}
      </div>

      <SectionTitle right={<span className="text-xs text-muted">Singles · 1 pt per hole</span>}>Day 2</SectionTitle>
      <div className="flex flex-col gap-3">
        {day2.map((mv) => (
          <MatchCard key={mv.match.id} mv={mv} s={s} />
        ))}
      </div>
    </div>
  );
}
