"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "@/components/GameProvider";
import { Button, Card, Empty, Loading } from "@/components/ui";
import { HOLES } from "@/lib/config";
import { fmtOdds, marketProbs, money, round2, sideLabel } from "@/lib/logic";
import type { Market, Side } from "@/lib/types";

function NewBetInner() {
  const { state: s, d, me, act } = useGame();
  const router = useRouter();
  const q = useSearchParams();
  const [market, setMarket] = useState<Market>((q.get("market") as Market) || "match");
  const [matchId, setMatchId] = useState<string>(q.get("match") || "");
  const [hole, setHole] = useState<number | null>(null);
  const [pick, setPick] = useState<Side | null>(null);
  const [stake, setStake] = useState("20");
  const [win, setWin] = useState("20");
  const [busy, setBusy] = useState(false);

  if (!s || !d) return <Loading />;
  if (!me) return <div className="pt-6"><Empty>Log in to post a bet.</Empty><Button href="/login?next=/bets/new" className="mt-3 w-full">Log in</Button></div>;
  if (!d.draft.complete) return <div className="pt-6"><Empty>Betting opens once the draft is done.</Empty></div>;

  const openMatches = d.matches.filter((m) => m.match.ready && !m.sum.decided);
  const mv = d.byId[matchId];
  const needMatch = market !== "overall";
  const matchOk = !needMatch || (mv && mv.match.ready && !mv.sum.decided);
  const holeOk = market !== "hole" || (hole != null && mv && !mv.grid[hole]);
  const decided = market === "overall" ? !!d.totals.winner : false;

  const probs = marketProbs(d, market, matchId);
  const cond = (side: Side) => {
    const a = probs.a, b = probs.b;
    const tot = a + b || 1;
    return (side === "A" ? a : b) / tot;
  };
  const label = (side: Side) => sideLabel(s, d, market, needMatch ? matchId : undefined, side);

  const c = Number(stake), t = Number(win);
  const valid = matchOk && holeOk && !decided && pick && c > 0 && t > 0;

  const fair = () => {
    if (!pick || !(c > 0)) return;
    const p = cond(pick);
    if (p <= 0.01 || p >= 0.99) return;
    setWin(String(round2((c * (1 - p)) / p)));
  };

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const r = await act("createBet", { market, matchId, hole, pick, creatorStake: c, takerStake: t });
    setBusy(false);
    if (r.ok) router.push("/bets");
  };

  const seg = (k: Market, l: string) => (
    <button
      onClick={() => { setMarket(k); setPick(null); if (k !== "hole") setHole(null); }}
      className={`flex-1 rounded-lg py-2.5 font-display text-sm font-bold uppercase ${market === k ? "bg-neon text-black" : "text-white/70"}`}
    >
      {l}
    </button>
  );

  return (
    <div className="pb-6">
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic">New Bet</h1>

      <div className="mt-3 flex gap-1 rounded-xl border border-line bg-card p-1">
        {seg("match", "Match")}
        {seg("overall", "Weekend")}
      </div>

      {needMatch && (
        <>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Match</h3>
          {openMatches.length ? (
            <div className="flex flex-col gap-2">
              {openMatches.map((m) => (
                <button
                  key={m.match.id}
                  onClick={() => { setMatchId(m.match.id); setPick(null); setHole(null); }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${matchId === m.match.id ? "border-neon bg-neon/10" : "border-line bg-card"}`}
                >
                  <span>
                    <span className="text-ta">{sideLabel(s, d, "match", m.match.id, "A")}</span>
                    <span className="text-muted"> v </span>
                    <span className="text-tb">{sideLabel(s, d, "match", m.match.id, "B")}</span>
                  </span>
                  <span className="text-[11px] text-muted">D{m.match.day}</span>
                </button>
              ))}
            </div>
          ) : (
            <Empty>No open matches right now.</Empty>
          )}
        </>
      )}

      {market === "hole" && mv && (
        <>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Hole</h3>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: HOLES }, (_, i) => i + 1).map((h) => {
              const done = !!mv.grid[h];
              return (
                <button
                  key={h}
                  disabled={done}
                  onClick={() => setHole(h)}
                  className={`h-11 rounded-lg font-display text-lg font-bold ${hole === h ? "bg-neon text-black" : done ? "bg-card text-line line-through" : "border border-line bg-card2"}`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </>
      )}

      {matchOk && (market !== "hole" || hole) && !decided && (
        <>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">You back</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["A", "B"] as Side[]).map((side) => {
              const on = pick === side;
              const odds = fmtOdds(cond(side));
              return (
                <button
                  key={side}
                  onClick={() => setPick(side)}
                  className={`rounded-2xl border p-3 text-left transition ${on ? (side === "A" ? "border-ta bg-ta/20" : "border-tb bg-tb/20") : "border-line bg-card"}`}
                >
                  <div className={`truncate font-display text-lg font-bold uppercase ${side === "A" ? "text-ta" : "text-tb"}`}>{label(side)}</div>
                  <div className="font-display text-2xl font-bold text-gold tabular">{odds}</div>
                  <div className="text-[10px] text-muted">fair odds</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {pick && (
        <>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Stakes</h3>
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-muted">You risk</span>
                <div className="mt-1 flex items-center rounded-xl border border-line bg-black/40 px-3">
                  <span className="text-muted">$</span>
                  <input inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value.replace(/[^\d.]/g, ""))} className="w-full bg-transparent py-3 pl-1 font-display text-2xl font-bold outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-muted">To win (they risk)</span>
                <div className="mt-1 flex items-center rounded-xl border border-line bg-black/40 px-3">
                  <span className="text-muted">$</span>
                  <input inputMode="decimal" value={win} onChange={(e) => setWin(e.target.value.replace(/[^\d.]/g, ""))} className="w-full bg-transparent py-3 pl-1 font-display text-2xl font-bold text-neon outline-none" />
                </div>
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              {[10, 20, 50, 100].map((v) => (
                <button key={v} onClick={() => { setStake(String(v)); setWin(String(v)); }} className="flex-1 rounded-lg border border-line bg-card2 py-2 text-sm font-bold">
                  ${v}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setWin(stake)} className="rounded-lg border border-line py-2 text-xs font-bold text-white/80">Even money</button>
              <button onClick={fair} className="rounded-lg border border-gold/40 py-2 text-xs font-bold text-gold">Use fair odds</button>
            </div>
          </Card>

          <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-3 text-sm">
            If <b>{label(pick)}</b> wins, whoever takes this owes you <b className="text-neon">{c > 0 && t > 0 ? money(t) : "—"}</b>. If not, you owe them{" "}
            <b className="text-gold">{c > 0 ? money(c) : "—"}</b>. {market === "hole" ? "Halved hole" : "A draw"} = void.
          </div>

          <Button className="mt-4 w-full py-4 text-lg" disabled={!valid || busy} onClick={submit}>
            Post bet
          </Button>
        </>
      )}
    </div>
  );
}

export default function NewBetPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewBetInner />
    </Suspense>
  );
}
