"use client";

import Link from "next/link";
import { useGame } from "@/components/GameProvider";
import { Avatar, Loading, teamText } from "@/components/ui";
import { individualPoints } from "@/lib/logic";

export default function LeadersPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;

  const rows = individualPoints(s, d).map((r) => ({ ...r, p: s.players.find((x) => x.id === r.id)! }));
  // Equal totals share a rank
  const ranks = rows.map((r, i) => (i > 0 && rows[i - 1].total === r.total && rows[i - 1].d2 === r.d2 ? null : i + 1));
  let last = 1;
  const rankOf = ranks.map((r) => (r == null ? last : (last = r)));

  return (
    <div>
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic leading-none">Leaders</h1>
      <p className="mt-2 text-xs text-muted">
        Each player&rsquo;s points. Day 1 (scramble): 1 point for each hole your pair wins, and both players get it. Day 2 (singles): 1 point for each hole you win. If players have the same points, whoever won more Day 2 holes is ahead.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center gap-3 border-b border-line bg-card2/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span className="w-5">#</span>
          <span className="flex-1">Player</span>
          <span className="w-9 text-right">D1</span>
          <span className="w-9 text-right">D2</span>
          <span className="w-12 text-right">Total</span>
        </div>
        {rows.map((r, i) => (
          <Link key={r.p.id} href={`/players/${r.p.id}`} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
            <span className={`w-5 font-display text-lg font-bold ${rankOf[i] === 1 && r.total > 0 ? "text-gold" : "text-muted"}`}>{rankOf[i]}</span>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar p={r.p} size={34} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{r.p.name}</div>
                <div className={`truncate text-[11px] ${r.p.team ? teamText[r.p.team] : "text-muted"}`}>
                  {r.p.team ? s.teams[r.p.team].name : "Not drafted"}
                </div>
              </div>
            </div>
            <span className="w-9 text-right tabular text-white/80">{r.d1}</span>
            <span className="w-9 text-right tabular text-white/80">{r.d2}</span>
            <span className="w-12 text-right font-display text-2xl font-bold tabular text-neon">{r.total}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
