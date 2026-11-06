"use client";

import { useState } from "react";
import { canPullStake, estimateWin, money, pname, sideLabel, stakeWinNow, type Derived, type PoolView } from "@/lib/logic";
import type { Side, State } from "@/lib/types";
import { useGame } from "./GameProvider";
import { Avatar, AvatarStack, Button, Pill } from "./ui";

const tone = {
  A: { text: "text-ta", border: "border-ta/50", bg: "bg-ta/10", btn: "bg-ta text-white" },
  B: { text: "text-tb", border: "border-tb/50", bg: "bg-tb/10", btn: "bg-tb text-white" },
};

export function PoolCard({ pool, s, d }: { pool: PoolView; s: State; d: Derived }) {
  const { me, act } = useGame();
  const [side, setSide] = useState<Side | null>(null);
  const [amt, setAmt] = useState("20");
  const [busy, setBusy] = useState(false);
  const name = (x: Side) => sideLabel(s, d, pool.market, pool.matchId, x);
  const pot = pool.total.A + pool.total.B;
  const open = pool.status === "open";
  const amount = Number(amt) || 0;
  const mine = me ? pool.stakes.filter((x) => x.playerId === me.id) : [];

  const status = {
    waiting: <Pill className="bg-white/5 text-muted">Not open yet</Pill>,
    open: pool.inPlay ? <Pill className="bg-tb/15 text-tb">In play</Pill> : <Pill className="bg-neon/15 text-neon">Open</Pill>,
    settled: <Pill className="bg-white/10 text-white">Settled</Pill>,
    refunded: <Pill className="bg-white/10 text-white/70">Refunded</Pill>,
  }[pool.status];

  async function place() {
    if (!side || busy) return;
    setBusy(true);
    const r = await act("placeStake", { market: pool.market, matchId: pool.matchId, side, amount });
    setBusy(false);
    if (r.ok) setSide(null);
  }

  return (
    <div id={`pool-${pool.id}`} className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-dashed border-line bg-card2/60 px-3 py-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">{pool.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gold">Pot {money(pot)}</span>
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {(["A", "B"] as Side[]).map((x) => {
          const backers = [...new Set(pool.stakes.filter((k) => k.side === x).map((k) => k.playerId))]
            .map((id) => s.players.find((p) => p.id === id)!)
            .filter(Boolean);
          const otherEmpty = pool.total[x === "A" ? "B" : "A"] === 0;
          const won = pool.winningSide === x;
          return (
            <div key={x} className={`flex flex-col rounded-xl border p-2.5 ${won ? "border-neon bg-neon/10" : `${tone[x].border} ${tone[x].bg}`}`}>
              <div className={`truncate font-display text-lg font-bold uppercase leading-tight ${tone[x].text}`}>
                {won && "🏆 "}
                {name(x)}
              </div>
              <div className="font-display text-3xl font-black tabular">{money(pool.total[x])}</div>
              <div className="mt-1 flex h-7 items-center gap-2">
                {backers.length ? <AvatarStack ps={backers.slice(0, 5)} size={24} /> : <span className="text-[11px] text-muted">No backers yet</span>}
              </div>
              {open && (
                <div className="mt-1 text-[11px] leading-tight text-muted">
                  {otherEmpty ? (
                    <>Nobody on the other side yet</>
                  ) : (
                    <>
                      $10 wins <b className="text-neon">~{money(estimateWin(pool, x, 10))}</b> now
                    </>
                  )}
                </div>
              )}
              {open &&
                (me ? (
                  <button
                    onClick={() => setSide(side === x ? null : x)}
                    className={`mt-2 rounded-lg py-2.5 font-display text-sm font-bold uppercase tracking-wide ${side === x ? "bg-white text-black" : tone[x].btn}`}
                  >
                    Back {pool.market === "overall" ? name(x).replace(/^Team /i, "") : name(x)}
                  </button>
                ) : (
                  <Button href="/login?next=/bets" variant="ghost" className="mt-2 py-2 text-xs">
                    Log in to bet
                  </Button>
                ))}
            </div>
          );
        })}
      </div>

      {side && open && (
        <div className="pop-in mx-3 mb-3 rounded-xl border border-neon/40 bg-neon/5 p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">How much on {name(side)}?</div>
          <div className="mt-2 flex items-center rounded-xl border border-line bg-black/40 px-3">
            <span className="text-muted">$</span>
            <input
              inputMode="decimal"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full bg-transparent py-2.5 pl-1 font-display text-2xl font-bold outline-none"
            />
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {[5, 10, 20, 50, 100].map((v) => (
              <button key={v} onClick={() => setAmt(String(v))} className={`rounded-lg border py-2 text-sm font-bold ${amount === v ? "border-neon text-neon" : "border-line bg-card2"}`}>
                ${v}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-snug">
            {pool.total[side === "A" ? "B" : "A"] > 0 ? (
              <>
                If <b>{name(side)}</b> win, you&rsquo;re up about <b className="text-neon">{money(estimateWin(pool, side, amount))}</b> on today&rsquo;s pot. It grows as more people back the other side.
              </>
            ) : (
              <>Nobody has backed the other side yet. You win once someone does. If nobody does, you get your money back.</>
            )}{" "}
            If they lose, you owe <b className="text-gold">{money(amount)}</b> to the winners.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setSide(null)}>Cancel</Button>
            <Button onClick={place} disabled={busy || !(amount >= 1)}>Place {amount >= 1 ? money(amount) : ""}</Button>
          </div>
        </div>
      )}

      {open && mine.length > 0 && (
        <div className="border-t border-line px-3 py-2">
          {mine.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span>
                You: <b>{money(x.amount)}</b> on <b className={tone[x.side].text}>{name(x.side)}</b>
                <span className="block text-[11px] text-muted">
                  {stakeWinNow(pool, x) > 0 ? <>Up {money(stakeWinNow(pool, x))} if they win, right now</> : <>Waiting for money on the other side</>}
                </span>
              </span>
              {canPullStake(s, pool, x) && (
                <button onClick={() => act("pullStake", { stakeId: x.id })} className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-white/70">
                  Pull out
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pool.status === "settled" && (
        <div className="border-t border-line px-3 py-2">
          {pool.results.map((r) => {
            const p = s.players.find((x) => x.id === r.playerId)!;
            return (
              <div key={r.playerId} className="flex items-center gap-2 py-1 text-sm">
                <Avatar p={p} size={24} />
                <span className="flex-1">{pname(s, r.playerId)}</span>
                <span className={`font-display text-lg font-bold tabular ${r.net > 0 ? "text-neon" : "text-tb"}`}>
                  {r.net > 0 ? "+" : ""}
                  {money(r.net)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {pool.status === "refunded" && pool.stakes.length > 0 && (
        <div className="border-t border-line px-3 py-2 text-xs text-muted">
          {pool.outcome === "H" ? "It finished level, so everyone gets their money back." : "Nobody backed one side, so everyone gets their money back."}
        </div>
      )}
    </div>
  );
}
