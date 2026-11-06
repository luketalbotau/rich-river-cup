"use client";

import Link from "next/link";
import { useGame } from "@/components/GameProvider";
import { Avatar, Card, Loading, SectionTitle, teamText } from "@/components/ui";
import { STAKE_EACH } from "@/lib/config";
import { dealView, individualPoints, money, pname } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function BetsPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;
  const deal = dealView(s, d);
  const rows = individualPoints(s, d);
  const player = (id: string) => s.players.find((p) => p.id === id)!;
  const leadTeam = deal.teamLeader === "H" ? null : (deal.teamLeader as TeamId);
  const gap = Math.abs(d.totals.A - d.totals.B);

  return (
    <div>
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic leading-none">Bets</h1>
      <p className="mt-1 text-sm text-muted">One bet for everyone. {money(STAKE_EACH)} each.</p>

      <Card className="mt-4 p-4 text-sm leading-snug">
        <div className="font-display text-lg font-bold uppercase">The deal</div>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Every player has {money(STAKE_EACH)} at risk.</li>
          <li>After both days, every player on the losing team pays {money(STAKE_EACH)} to the winning individual.</li>
          <li>The winning individual is the player with the most points on the Leaders page.</li>
        </ol>
      </Card>

      <SectionTitle>{deal.final ? "Final result" : "If it finished right now"}</SectionTitle>
      {!deal.started ? (
        <Card className="p-4 text-sm text-muted">Nothing has been played yet. Every player has {money(STAKE_EACH)} at risk.</Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Team result */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line p-3 text-center">
            {(["A", "B"] as TeamId[]).map((t, i) => (
              <div key={t} className={i === 1 ? "order-3" : ""}>
                <div className={`truncate font-display text-sm font-bold uppercase ${teamText[t]}`}>{s.teams[t].name}</div>
                <div className={`font-display text-4xl font-black tabular ${leadTeam === t ? "text-white" : "text-white/60"}`}>{d.totals[t]}</div>
                <div className="text-[11px] font-semibold text-muted">
                  {leadTeam === t ? (deal.final ? "Won" : "Winning") : leadTeam ? (deal.final ? "Lost · pays" : "Losing · would pay") : "Level"}
                </div>
              </div>
            ))}
            <div className="order-2 text-xs text-muted">{leadTeam ? `by ${gap}` : "level"}</div>
          </div>

          {/* Individual winner */}
          <div className="border-b border-line p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {deal.final ? "Winning individual" : "Leading individual"}
              {deal.topIds.length > 1 ? "s (tied)" : ""}
            </div>
            {deal.topIds.map((id) => (
              <div key={id} className="mt-2 flex items-center gap-3">
                <Avatar p={player(id)} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{pname(s, id)}</div>
                  <div className="text-[11px] text-muted">{deal.topPoints} points</div>
                </div>
                {leadTeam && (
                  <div className="text-right">
                    <div className="font-display text-2xl font-black text-neon">{money(deal.prize[id] ?? 0)}</div>
                    <div className="text-[10px] text-muted">{deal.final ? "wins" : "would win"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Who pays */}
          <div className="p-3">
            {deal.payments.length ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{deal.final ? "Who pays" : "Who would pay"}</div>
                {deal.payments.map((t, i) => (
                  <div key={i} className="mt-2 flex items-center gap-2 text-sm">
                    <Avatar p={player(t.from)} size={28} />
                    <span className="flex-1">
                      <b>{pname(s, t.from)}</b> <span className="text-muted">pays</span> <b>{pname(s, t.to)}</b>
                    </span>
                    <span className="font-display text-lg font-bold text-gold">{money(t.amount)}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-sm text-muted">{leadTeam ? "Nobody would pay right now." : "The teams are level, so nobody would pay."}</div>
            )}
          </div>
        </Card>
      )}

      <SectionTitle right={<Link href="/leaders" className="text-xs font-bold text-neon">Leaders →</Link>}>Individual race</SectionTitle>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {rows.slice(0, 5).map((r, i) => {
          const p = player(r.id);
          const behind = deal.topPoints - r.total;
          return (
            <div key={r.id} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
              <span className="w-4 font-display text-lg font-bold text-muted">{i + 1}</span>
              <Avatar p={p} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.name}</div>
                <div className={`text-[11px] ${p.team ? teamText[p.team] : "text-muted"}`}>{p.team ? s.teams[p.team].name : ""}</div>
              </div>
              <span className="text-xs text-muted">{behind > 0 ? `${behind} behind` : r.total === 0 ? "" : deal.topIds.includes(r.id) ? "leading" : "level, fewer Day 2 holes"}</span>
              <span className="w-10 text-right font-display text-xl font-bold tabular text-neon">{r.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
