"use client";

import { useGame } from "@/components/GameProvider";
import { Avatar, Card, Loading, SectionTitle, teamText } from "@/components/ui";
import { TEAM_PRIZE } from "@/lib/config";
import { dealView, money, pname } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function BetsPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;
  const deal = dealView(s, d);
  const player = (id: string) => s.players.find((p) => p.id === id)!;
  const leadTeam = deal.teamLeader === "H" ? null : (deal.teamLeader as TeamId);
  const gap = Math.abs(d.totals.A - d.totals.B);

  return (
    <div>
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic leading-none">Bets</h1>
      <p className="mt-1 text-sm text-muted">One bet: team v team for {money(TEAM_PRIZE)}.</p>

      <Card className="mt-4 p-4 text-sm leading-snug">
        <div className="font-display text-lg font-bold uppercase">The bet</div>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>After both days, the team with the most points on the Teams page wins.</li>
          <li>The losing team pays the winning team {money(TEAM_PRIZE)}, which is {money(deal.each)} from each losing player to a winning player.</li>
          <li>If the teams are level, nobody pays.</li>
        </ol>
      </Card>

      <SectionTitle>{deal.final ? "Final result" : "If it finished right now"}</SectionTitle>
      {!deal.started ? (
        <Card className="p-4 text-sm text-muted">Nothing has been played yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line p-3 text-center">
            {(["A", "B"] as TeamId[]).map((t, i) => (
              <div key={t} className={i === 1 ? "order-3" : ""}>
                <div className={`truncate font-display text-sm font-bold uppercase ${teamText[t]}`}>{s.teams[t].name}</div>
                <div className={`font-display text-4xl font-black tabular ${leadTeam === t ? "text-white" : "text-white/60"}`}>{d.totals[t]}</div>
                <div className="text-[11px] font-semibold text-muted">
                  {leadTeam === t
                    ? deal.final ? `Won · gets ${money(TEAM_PRIZE)}` : `Winning · would get ${money(TEAM_PRIZE)}`
                    : leadTeam ? (deal.final ? "Lost · pays" : "Losing · would pay") : "Level"}
                </div>
              </div>
            ))}
            <div className="order-2 text-xs text-muted">{leadTeam ? `by ${gap}` : "level"}</div>
          </div>

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
              <div className="text-sm text-muted">The teams are level, so nobody would pay.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
