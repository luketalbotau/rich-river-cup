"use client";

import { useState } from "react";
import { money, pname, stakePartners, waitingOnOtherSide, type PoolView } from "@/lib/logic";
import type { Side, State } from "@/lib/types";
import { useGame } from "./GameProvider";
import { Avatar, AvatarStack, Button, Pill } from "./ui";

const tone = {
  A: { text: "text-ta", border: "border-ta/50", bg: "bg-ta/10", btn: "bg-ta text-white" },
  B: { text: "text-tb", border: "border-tb/50", bg: "bg-tb/10", btn: "bg-tb text-white" },
};
const otherOf = (x: Side): Side => (x === "A" ? "B" : "A");

export function PoolCard({ pool, s }: { pool: PoolView; s: State }) {
  const { me, act } = useGame();
  const [side, setSide] = useState<Side | null>(null);
  const [amt, setAmt] = useState("20");
  const [busy, setBusy] = useState(false);
  const team = (x: Side) => s.teams[x].name;
  const open = pool.status === "open";
  const amount = Number(amt) || 0;

  const mine = me ? pool.stakes.filter((x) => x.playerId === me.id) : [];
  const mySide: Side | null = mine[0]?.side ?? null;
  const myTotal = mine.reduce((t, x) => t + x.amount, 0);
  const myMatched = mine.reduce((t, x) => t + (pool.matched[x.id] ?? 0), 0);
  const myWaiting = Math.round((myTotal - myMatched) * 100) / 100;
  const people = new Map<string, { side: Side; total: number; matched: number }>();
  for (const x of pool.stakes) {
    const r = people.get(x.playerId) ?? { side: x.side, total: 0, matched: 0 };
    r.total += x.amount;
    r.matched += pool.matched[x.id] ?? 0;
    people.set(x.playerId, r);
  }
  const partners = new Map<string, number>();
  for (const x of mine) for (const p of stakePartners(pool, x.id)) partners.set(p.playerId, (partners.get(p.playerId) ?? 0) + p.amount);

  const status = {
    waiting: <Pill className="bg-white/5 text-muted">Opens after the draft</Pill>,
    open: <Pill className="bg-neon/15 text-neon">Open</Pill>,
    settled: <Pill className="bg-white/10 text-white">Finished</Pill>,
    void: <Pill className="bg-white/10 text-white/70">Draw</Pill>,
  }[pool.status];

  async function place() {
    if (!side || busy) return;
    setBusy(true);
    const r = await act("placeStake", { market: pool.market, side, amount });
    setBusy(false);
    if (r.ok) setSide(null);
  }
  async function takeBack() {
    setBusy(true);
    for (const x of mine) if (x.amount - (pool.matched[x.id] ?? 0) > 0.004) await act("takeBackUnmatched", { stakeId: x.id });
    setBusy(false);
  }

  // What happens to a new bet of `amount` on `side`
  const preview = (x: Side) => {
    const waiting = waitingOnOtherSide(pool, x);
    const now = Math.min(waiting, amount);
    const rest = Math.round((amount - now) * 100) / 100;
    return (
      <>
        <p>You are betting <b>{money(amount)}</b> that <b>{team(x)}</b> {pool.win}.</p>
        {waiting <= 0.004 ? (
          <p className="mt-1">Nobody has money waiting on {team(otherOf(x))}. Your bet will wait until someone bets on {team(otherOf(x))}.</p>
        ) : rest <= 0.004 ? (
          <p className="mt-1">{money(waiting)} is waiting on {team(otherOf(x))}, so all of your bet will be matched straight away.</p>
        ) : (
          <p className="mt-1">
            Only {money(waiting)} is waiting on {team(otherOf(x))}. {money(now)} of your bet will be matched straight away. The other {money(rest)} will wait until someone bets on {team(otherOf(x))}.
          </p>
        )}
        <p className="mt-1">If {team(x)} win, you win the matched amount. If {team(otherOf(x))} win, you pay the matched amount.</p>
      </>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-dashed border-line bg-card2/60 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{pool.question}</span>
        {status}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {(["A", "B"] as Side[]).map((x) => {
          const backers = [...new Set(pool.stakes.filter((k) => k.side === x).map((k) => k.playerId))]
            .map((id) => s.players.find((p) => p.id === id)!)
            .filter(Boolean);
          const waiting = Math.round((pool.total[x] - pool.matchedTotal) * 100) / 100;
          const won = pool.winningSide === x;
          return (
            <div key={x} className={`flex flex-col rounded-xl border p-2.5 ${won ? "border-neon bg-neon/10" : `${tone[x].border} ${tone[x].bg}`}`}>
              <div className={`truncate font-display text-lg font-bold uppercase leading-tight ${tone[x].text}`}>
                {won && "🏆 "}
                {team(x)}
              </div>
              <div className="font-display text-3xl font-black tabular">{money(pool.total[x])}</div>
              <div className="text-[11px] leading-tight text-muted">
                bet in total
                {waiting > 0.004 && (
                  <>
                    <br />
                    <span className="text-gold">{money(waiting)} waiting for a match</span>
                  </>
                )}
              </div>
              <div className="mt-1.5 flex h-7 items-center">
                {backers.length ? <AvatarStack ps={backers.slice(0, 5)} size={24} /> : <span className="text-[11px] text-muted">Nobody yet</span>}
              </div>
              {open &&
                (!me ? (
                  <Button href="/login?next=/bets" variant="ghost" className="mt-2 py-2 text-xs">
                    Log in to bet
                  </Button>
                ) : mySide && mySide !== x ? (
                  <div className="mt-2 rounded-lg border border-line py-2 text-center text-[11px] text-muted">You bet on {team(mySide)}</div>
                ) : (
                  <button
                    onClick={() => setSide(side === x ? null : x)}
                    className={`mt-2 rounded-lg py-2.5 font-display text-sm font-bold uppercase tracking-wide ${side === x ? "bg-white text-black" : tone[x].btn}`}
                  >
                    {mySide === x ? "Bet more" : `Bet on ${team(x).replace(/^Team /i, "")}`}
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      {side && open && (
        <div className="pop-in mx-3 mb-3 rounded-xl border border-neon/40 bg-neon/5 p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">How much do you want to bet on {team(side)}?</div>
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
          {amount >= 1 && <div className="mt-3 text-sm leading-snug">{preview(side)}</div>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setSide(null)}>Cancel</Button>
            <Button onClick={place} disabled={busy || !(amount >= 1)}>Bet {amount >= 1 ? money(amount) : ""}</Button>
          </div>
        </div>
      )}

      {mySide && (
        <div className="border-t border-line px-3 py-3 text-sm leading-snug">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Your bet</div>
          <p className="mt-1">
            You bet <b>{money(myTotal)}</b> on <b className={tone[mySide].text}>{team(mySide)}</b>.
          </p>
          <p>
            <b className="text-neon">{money(myMatched)}</b> is matched.
            {myWaiting > 0.004 && (
              <>
                {" "}
                <b className="text-gold">{money(myWaiting)}</b> is waiting for someone to bet on {team(otherOf(mySide))}.
              </>
            )}
          </p>
          {myMatched > 0.004 && pool.status === "open" && (
            <p className="mt-1">
              If {team(mySide)} win, you win {money(myMatched)}. If {team(otherOf(mySide))} win, you pay {money(myMatched)}.
            </p>
          )}
          {partners.size > 0 && (
            <p className="mt-1 text-muted">
              Matched with: {[...partners.entries()].map(([id, a]) => `${pname(s, id)} (${money(a)})`).join(", ")}
            </p>
          )}
          {open && myWaiting > 0.004 && (
            <button onClick={takeBack} disabled={busy} className="mt-2 w-full rounded-lg border border-line py-2 text-xs font-bold text-white/80 disabled:opacity-40">
              Take back the {money(myWaiting)} that isn&rsquo;t matched
            </button>
          )}
        </div>
      )}

      {pool.status === "settled" && pool.results.length > 0 && (
        <div className="border-t border-line px-3 py-2">
          {pool.results.map((r) => {
            const p = s.players.find((x) => x.id === r.playerId)!;
            return (
              <div key={r.playerId} className="flex items-center gap-2 py-1 text-sm">
                <Avatar p={p} size={24} />
                <span className="flex-1">{pname(s, r.playerId)}</span>
                <span className={`font-display text-lg font-bold tabular ${r.net > 0 ? "text-neon" : "text-tb"}`}>
                  {r.net > 0 ? "won " : "lost "}
                  {money(Math.abs(r.net))}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {pool.status === "void" && <div className="border-t border-line px-3 py-2 text-sm text-muted">It finished level, so nobody pays.</div>}

      {pool.stakes.length > 0 && (
        <details className="border-t border-line px-3 py-2 text-sm">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted">Everyone&rsquo;s bets ({people.size})</summary>
          <div className="mt-1">
            {[...people.entries()].map(([id, r]) => {
              const p = s.players.find((x) => x.id === id)!;
              const waiting = Math.round((r.total - r.matched) * 100) / 100;
              return (
                <div key={id} className="flex items-center gap-2 py-1.5">
                  <Avatar p={p} size={24} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <b>{p.name}</b> bet {money(r.total)} on <b className={tone[r.side].text}>{team(r.side)}</b>
                    <div className="text-[11px] text-muted">
                      {money(r.matched)} matched{waiting > 0.004 ? `, ${money(waiting)} waiting` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
