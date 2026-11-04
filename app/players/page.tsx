"use client";

import Link from "next/link";
import { useGame } from "@/components/GameProvider";
import { TradingCard } from "@/components/TradingCard";
import { Loading, SectionTitle, teamText } from "@/components/ui";
import { roster } from "@/lib/logic";
import type { TeamId } from "@/lib/types";

export default function PlayersPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;
  const groups: { title: string; tone: string; ids: string[] }[] = d.draft.complete
    ? (["A", "B"] as TeamId[]).map((t) => ({ title: s.teams[t].name, tone: teamText[t], ids: roster(s, t).map((p) => p.id) }))
    : [{ title: "All players", tone: "", ids: s.players.map((p) => p.id) }];
  return (
    <div>
      <div className="pt-2">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Collect them all</div>
        <h1 className="font-display text-4xl font-black uppercase italic leading-none">The Squad</h1>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <SectionTitle><span className={g.tone}>{g.title}</span></SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {g.ids.map((id) => {
              const p = s.players.find((x) => x.id === id)!;
              return (
                <Link key={id} href={`/players/${id}`} className="active:scale-[0.98]">
                  <TradingCard p={p} s={s} d={d} compact />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
