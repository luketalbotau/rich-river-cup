"use client";

import { ledger, money, playerStats, type Derived } from "@/lib/logic";
import type { Player, State } from "@/lib/types";
import { photoUrl } from "./ui";

export function TradingCard({ p, s, d, compact = false }: { p: Player; s: State; d: Derived; compact?: boolean }) {
  const st = playerStats(d, p.id);
  const pnl = ledger(s, d).pnl[p.id];
  const url = photoUrl(p);
  const frame = p.team === "A" ? "from-ta via-ta/30 to-ta" : p.team === "B" ? "from-tb via-tb/30 to-tb" : "from-line via-white/10 to-line";
  const tag = p.captain ? "Captain" : p.pick ? `Pick #${p.pick}` : "Undrafted";
  const team = p.team ? s.teams[p.team].name : "Free agent";

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${frame} p-[2px] shadow-xl`}>
      <div className="relative overflow-hidden rounded-[14px] bg-card">
        <div className="shine pointer-events-none absolute inset-0 z-10 opacity-60" />
        <div className={`relative ${compact ? "aspect-[4/3]" : "aspect-square"} bg-gradient-to-b from-card2 to-black`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-7xl font-black uppercase text-white/10">{p.name.slice(0, 2)}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
          <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${p.captain ? "bg-gold text-black" : "bg-black/60 text-white"}`}>
            {tag}
          </span>
          <div className="absolute bottom-1 left-3 right-3">
            <div className={`font-display font-black uppercase italic leading-none ${compact ? "text-2xl" : "text-4xl"}`}>{p.name}</div>
            {p.nickname && <div className="truncate text-xs italic text-gold">&ldquo;{p.nickname}&rdquo;</div>}
          </div>
        </div>
        <div className="px-3 pb-3 pt-1">
          <div className={`truncate text-[11px] font-bold uppercase tracking-wider ${p.team === "A" ? "text-ta" : p.team === "B" ? "text-tb" : "text-muted"}`}>{team}</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <Stat label="Holes" v={String(st.holesWon)} />
            <Stat label="W-L-H" v={`${st.w}-${st.l}-${st.h}`} />
            <Stat label="Bets" v={`${pnl > 0 ? "+" : ""}${money(pnl)}`} tone={pnl > 0 ? "text-neon" : pnl < 0 ? "text-tb" : ""} />
          </div>
          {!compact && (
            <>
              {p.shot && (
                <div className="mt-3 text-xs">
                  <span className="font-bold uppercase text-muted">Signature shot · </span>
                  {p.shot}
                </div>
              )}
              {p.report && (
                <div className="mt-2 rounded-lg bg-black/30 p-2.5 text-sm italic text-white/85">
                  <span className="mb-1 block text-[10px] font-bold uppercase not-italic tracking-wider text-muted">Scouting report</span>
                  {p.report}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v, tone = "" }: { label: string; v: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-black/30 py-1.5">
      <div className={`font-display text-lg font-bold leading-none tabular ${tone}`}>{v}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
