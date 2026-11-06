"use client";

import Link from "next/link";
import { useGame } from "@/components/GameProvider";
import { Avatar, Loading, teamText } from "@/components/ui";
import { POINTS } from "@/lib/config";
import type { Side } from "@/lib/types";

export default function LeadersPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;

  const rows = s.players.map((p) => {
    let d1 = 0, d2 = 0, holes = 0;
    for (const m of d.matches) {
      const side: Side | null = m.match.a.includes(p.id) ? "A" : m.match.b.includes(p.id) ? "B" : null;
      if (!side) continue;
      const won = side === "A" ? m.sum.wonA : m.sum.wonB;
      holes += won;
      if (m.match.day === 1) d1 += won * POINTS[1];
      else d2 += won * POINTS[2];
    }
    return { p, d1, d2, total: d1 + d2, holes };
  });
  rows.sort((a, b) => b.total - a.total || b.d1 - a.d1 || a.p.name.localeCompare(b.p.name));
  // Equal totals share a rank
  const ranks = rows.map((r, i) => (i > 0 && rows[i - 1].total === r.total ? null : i + 1));
  let last = 1;
  const rankOf = ranks.map((r) => (r == null ? last : (last = r)));

  return (
    <div>
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic leading-none">Leaders</h1>
      <p className="mt-2 text-xs text-muted">
        Each player&rsquo;s points. Day 1: 1 point for each hole you win. Day 2: 2 points for each hole your pair wins, and both players in the pair get them.
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
