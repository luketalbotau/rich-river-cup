"use client";

import { useState } from "react";
import { betStatus, marketLabel, money, pname, sideLabel, timeAgo, type Derived } from "@/lib/logic";
import type { Bet, State } from "@/lib/types";
import { useGame } from "./GameProvider";
import { Avatar, Button, Pill } from "./ui";

export function BetSlip({ bet, s, d }: { bet: Bet; s: State; d: Derived }) {
  const { me, act } = useGame();
  const [confirm, setConfirm] = useState(false);
  const st = betStatus(bet, d);
  const creator = s.players.find((p) => p.id === bet.creatorId)!;
  const taker = bet.takerId ? s.players.find((p) => p.id === bet.takerId) : undefined;
  const pickName = sideLabel(s, d, bet.market, bet.matchId, bet.pick);
  const otherName = sideLabel(s, d, bet.market, bet.matchId, bet.pick === "A" ? "B" : "A");
  const pot = bet.creatorStake + bet.takerStake;
  const mine = me && (me.id === bet.creatorId || me.id === bet.takerId);

  const status = {
    open: <Pill className="bg-neon/15 text-neon">Open</Pill>,
    live: <Pill className="bg-gold/15 text-gold">Live</Pill>,
    cancelled: <Pill className="bg-white/5 text-muted">Cancelled</Pill>,
    expired: <Pill className="bg-white/5 text-muted">Not taken</Pill>,
    void: <Pill className="bg-white/10 text-white/70">Void · draw</Pill>,
    settled: <Pill className="bg-white/10 text-white">Settled</Pill>,
  }[st.status];

  return (
    <div className={`overflow-hidden rounded-2xl border bg-card ${mine ? "border-gold/40" : "border-line"}`}>
      <div className="flex items-center justify-between border-b border-dashed border-line bg-card2/60 px-3 py-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">{marketLabel(d, bet.market, bet.matchId, bet.hole)}</span>
        {status}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <Avatar p={creator} size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-sm">
              <b>{creator.name}</b> <span className="text-muted">backs</span>
            </div>
            <div className="truncate font-display text-xl font-bold uppercase leading-tight text-white">{pickName}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-bold text-gold tabular">{money(bet.creatorStake)}</div>
            <div className="text-[10px] text-muted">to win {money(bet.takerStake)}</div>
          </div>
        </div>

        {taker && (
          <div className="mt-2 flex items-center gap-2.5 border-t border-line pt-2">
            <Avatar p={taker} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-sm">
                <b>{taker.name}</b> <span className="text-muted">backs</span>
              </div>
              <div className="truncate font-display text-xl font-bold uppercase leading-tight text-white/90">{otherName}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold text-gold tabular">{money(bet.takerStake)}</div>
              <div className="text-[10px] text-muted">to win {money(bet.creatorStake)}</div>
            </div>
          </div>
        )}

        {st.status === "settled" && (
          <div className="mt-2 rounded-lg bg-neon/10 px-3 py-2 text-sm">
            💰 <b className="text-neon">{pname(s, st.winnerId)}</b> wins {money(st.amount)} from {pname(s, st.loserId)}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span>Pot {money(pot)}</span>
          <span>{timeAgo(bet.acceptedAt ?? bet.createdAt)}</span>
        </div>

        {st.status === "open" && me && me.id !== bet.creatorId && !confirm && (
          <Button className="mt-3 w-full" onClick={() => setConfirm(true)}>
            Take it · back {otherName}
          </Button>
        )}
        {confirm && st.status === "open" && (
          <div className="pop-in mt-3 rounded-xl border border-neon/40 bg-neon/5 p-3">
            <p className="text-sm">
              You back <b>{otherName}</b>. You risk <b className="text-gold">{money(bet.takerStake)}</b> to win{" "}
              <b className="text-neon">{money(bet.creatorStake)}</b>. A draw or halved hole voids it.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setConfirm(false)}>Back</Button>
              <Button onClick={async () => { await act("acceptBet", { betId: bet.id }); setConfirm(false); }}>Confirm</Button>
            </div>
          </div>
        )}
        {st.status === "open" && me?.id === bet.creatorId && (
          <Button variant="danger" className="mt-3 w-full text-sm" onClick={() => act("cancelBet", { betId: bet.id })}>
            Cancel bet
          </Button>
        )}
      </div>
    </div>
  );
}
