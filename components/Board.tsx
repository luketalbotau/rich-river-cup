"use client";

import Link from "next/link";
import { matchStatusText, momentum, timeAgo, type Derived, type MatchView } from "@/lib/logic";
import type { State } from "@/lib/types";
import { AvatarStack, Live, Pill, teamText } from "./ui";

export function Badges({ mv, s }: { mv: MatchView; s: State }) {
  const { sum, match } = mv;
  const nm = (side: "A" | "B") =>
    (side === "A" ? match.a : match.b).map((id) => s.players.find((p) => p.id === id)?.name).join(" & ");
  return (
    <>
      {sum.streak && !sum.complete && (
        <Pill className="bg-gold/15 text-gold">🔥 {nm(sum.streak.side)} ×{sum.streak.len}</Pill>
      )}
      {sum.streak && !sum.complete && (
        <Pill className="bg-sky-400/15 text-sky-300">🧊 {nm(sum.streak.side === "A" ? "B" : "A")}</Pill>
      )}
      {sum.choke && <Pill className="bg-tb/15 text-tb">😬 Choke alert: {nm(sum.choke)}</Pill>}
    </>
  );
}

export function MatchCard({ mv, s }: { mv: MatchView; s: State }) {
  const { match, sum } = mv;
  const players = (ids: string[]) => ids.map((id) => s.players.find((p) => p.id === id)!).filter(Boolean);
  const live = sum.played > 0 && !sum.complete;
  const row = (side: "A" | "B") => {
    const ids = side === "A" ? match.a : match.b;
    const won = side === "A" ? sum.wonA : sum.wonB;
    const leading = side === "A" ? sum.lead > 0 : sum.lead < 0;
    return (
      <div className="flex items-center gap-3">
        <span className={`h-8 w-1 rounded-full ${side === "A" ? "bg-ta" : "bg-tb"}`} />
        <AvatarStack ps={players(ids)} size={30} />
        <div className="min-w-0 flex-1">
          <div className={`truncate font-semibold ${leading ? "text-white" : "text-white/75"}`}>
            {ids.map((id) => s.players.find((x) => x.id === id)?.name).join(" & ") || "TBC"}
          </div>
        </div>
        <span className={`w-8 text-right font-display text-2xl font-bold tabular ${leading ? teamText[side] : "text-white/60"}`}>{won}</span>
      </div>
    );
  };
  return (
    <Link href={`/match/${match.id}`} className="block rounded-2xl border border-line bg-card p-3 active:bg-card2">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-muted">{match.title}</span>
          <span className="text-[10px] font-bold text-muted/70">{match.day === 2 ? "2 PTS/HOLE" : "1 PT/HOLE"}</span>
        </div>
        {live ? <Live /> : sum.complete ? <Pill className="bg-white/10 text-white/70">Final</Pill> : <Pill className="bg-white/5 text-muted">Upcoming</Pill>}
      </div>
      <div className="flex flex-col gap-2">
        {row("A")}
        {row("B")}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
        <span className="mr-auto text-xs font-semibold text-white/80">{matchStatusText(s, mv)}</span>
        <Badges mv={mv} s={s} />
      </div>
    </Link>
  );
}

export function MomentumChart({ d, s }: { d: Derived; s: State }) {
  const pts = momentum(d);
  const W = 340, H = 140, pad = 14;
  const maxAbs = Math.max(4, ...pts.map((p) => Math.abs(p.diff)));
  const n = Math.max(pts.length - 1, 1);
  const x = (i: number) => pad + (i / n) * (W - pad * 2);
  const y = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - pad);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.diff).toFixed(1)}`).join(" ");
  const day2Start = pts.findIndex((p) => p.label.startsWith("D2"));
  const last = pts[pts.length - 1];
  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-ta">▲ {s.teams.A.name}</span>
        <span className="text-muted">{pts.length > 1 ? `Gap ${Math.abs(last.diff)} pts` : "Waiting for first hole"}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        <defs>
          <clipPath id="above"><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
          <clipPath id="below"><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f8cff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#2f8cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gB" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff3d6e" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ff3d6e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={pad} x2={W - pad} y1={H / 2} y2={H / 2} stroke="#222c3a" strokeDasharray="4 4" />
        {day2Start > 0 && (
          <>
            <line x1={x(day2Start - 0.5)} x2={x(day2Start - 0.5)} y1={pad / 2} y2={H - pad / 2} stroke="#222c3a" />
            <text x={x(day2Start - 0.5) + 4} y={pad} fill="#8392a6" fontSize="9" fontWeight="700">DAY 2</text>
          </>
        )}
        {pts.length > 1 && (
          <>
            <path d={`${line} L${x(pts.length - 1)},${H / 2} L${x(0)},${H / 2} Z`} fill="url(#gA)" clipPath="url(#above)" />
            <path d={`${line} L${x(pts.length - 1)},${H / 2} L${x(0)},${H / 2} Z`} fill="url(#gB)" clipPath="url(#below)" />
            <path d={line} fill="none" stroke="#2f8cff" strokeWidth="2.5" strokeLinejoin="round" clipPath="url(#above)" />
            <path d={line} fill="none" stroke="#ff3d6e" strokeWidth="2.5" strokeLinejoin="round" clipPath="url(#below)" />
            <circle cx={x(pts.length - 1)} cy={y(last.diff)} r="4" fill={last.diff >= 0 ? "#2f8cff" : "#ff3d6e"} stroke="#06080c" strokeWidth="2" />
          </>
        )}
      </svg>
      <div className="mt-1 text-xs font-semibold text-tb">▼ {s.teams.B.name}</div>
    </div>
  );
}

export function Ticker({ s }: { s: State }) {
  const items = s.activity.filter((a) => !a.undone && /^(⛳|🎟️|🤝|💸|🎉)/.test(a.text)).slice(0, 12);
  if (!items.length) return null;
  const content = items.map((a) => (
    <span key={a.id} className="mx-5 whitespace-nowrap text-xs">
      <span className="text-white/90">{a.text}</span> <span className="text-muted">· {timeAgo(a.at)}</span>
    </span>
  ));
  return (
    <div className="relative -mx-4 mt-4 overflow-hidden border-y border-line bg-card/70 py-2">
      <div className="absolute left-0 top-0 z-10 flex h-full items-center bg-gold px-2 font-display text-xs font-black uppercase italic text-black">
        Latest
      </div>
      <div className="ticker flex w-max pl-16">
        {content}
        {content}
      </div>
    </div>
  );
}
