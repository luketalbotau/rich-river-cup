"use client";

import Link from "next/link";
import { useState } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Empty, Loading, SectionTitle } from "@/components/ui";
import { ADMIN_ID } from "@/lib/config";
import { allPools, betStatus, ledger, money, pname, timeAgo } from "@/lib/logic";

export default function LedgerPage() {
  const { state: s, d, me, act } = useGame();
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!s || !d) return <Loading />;
  const L = ledger(s, d);
  const ranked = [...s.players].sort((a, b) => L.pnl[b.id] - L.pnl[a.id]);
  const exposure: Record<string, number> = {};
  for (const b of s.bets) {
    if (betStatus(b, d).status !== "live") continue;
    exposure[b.creatorId] = (exposure[b.creatorId] ?? 0) + b.creatorStake;
    if (b.takerId) exposure[b.takerId] = (exposure[b.takerId] ?? 0) + b.takerStake;
  }
  for (const pool of allPools(s, d)) {
    if (pool.status !== "open") continue;
    for (const x of pool.stakes) exposure[x.playerId] = (exposure[x.playerId] ?? 0) + x.amount;
  }

  return (
    <div>
      <div className="pt-2">
        <Link href="/more" className="text-xs font-semibold text-muted">← More</Link>
        <div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-neon">IOU Ledger</div>
        <h1 className="font-display text-4xl font-black uppercase italic leading-none">Who Owes Who</h1>
        <p className="mt-2 text-xs text-muted">
          This adds up every bet once it is decided, and works out the fewest payments to settle everything. Pay by bank transfer or PayID, then tap &ldquo;Mark paid&rdquo;.
        </p>
      </div>

      <SectionTitle>Settle up</SectionTitle>
      {L.transfers.length ? (
        <div className="flex flex-col gap-2">
          {L.transfers.map((t) => {
            const key = `${t.from}-${t.to}`;
            const from = s.players.find((p) => p.id === t.from)!;
            const to = s.players.find((p) => p.id === t.to)!;
            const canMark = me && (me.id === t.from || me.id === t.to || me.id === ADMIN_ID);
            return (
              <Card key={key} className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar p={from} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <b>{from.name}</b> <span className="text-muted">pays</span> <b>{to.name}</b>
                    </div>
                  </div>
                  <Avatar p={to} size={36} />
                  <div className="w-20 text-right font-display text-2xl font-bold text-gold tabular">{money(t.amount)}</div>
                </div>
                {canMark &&
                  (confirm === key ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="py-2 text-sm" onClick={() => setConfirm(null)}>Back</Button>
                      <Button className="py-2 text-sm" onClick={async () => { await act("markPaid", t as unknown as Record<string, unknown>); setConfirm(null); }}>
                        Yes, paid
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" className="mt-2 w-full py-2 text-sm" onClick={() => setConfirm(key)}>
                      Mark paid
                    </Button>
                  ))}
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty>All square. Nobody owes anybody.</Empty>
      )}

      <SectionTitle>Betting leaderboard</SectionTitle>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {ranked.map((p, i) => {
          const v = L.pnl[p.id];
          const bal = L.balance[p.id];
          return (
            <div key={p.id} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
              <span className="w-5 font-display text-lg font-bold text-muted">{i + 1}</span>
              <Avatar p={p} size={34} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-[11px] text-muted">
                  {L.record[p.id].w}W–{L.record[p.id].l}L
                  {exposure[p.id] ? ` · ${money(exposure[p.id])} riding` : ""}
                  {Math.abs(bal - v) > 0.004 ? ` · owes/owed ${money(bal)}` : ""}
                </div>
              </div>
              <span className={`font-display text-xl font-bold tabular ${v > 0 ? "text-neon" : v < 0 ? "text-tb" : "text-muted"}`}>
                {v > 0 ? "+" : ""}
                {money(v)}
              </span>
            </div>
          );
        })}
      </div>

      <SectionTitle>Results</SectionTitle>
      {L.deal.final ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-line bg-card">
          <div className="border-b border-line bg-card2/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">The $50 deal</div>
          {L.deal.payments.length ? (
            L.deal.payments.map((t, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                <span>
                  <b>{pname(s, t.from)}</b> <span className="text-muted">→</span> <b>{pname(s, t.to)}</b>
                </span>
                <span className="font-display text-lg font-bold text-gold">{money(t.amount)}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted">The teams finished level, so nobody pays.</div>
          )}
        </div>
      ) : (
        <div className="mb-2 rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">The $50 deal is worked out once both days are finished.</div>
      )}
      {L.pools.map((pool) => (
        <div key={pool.id} className="mb-2 overflow-hidden rounded-2xl border border-line bg-card">
          <div className="border-b border-line bg-card2/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{pool.label}</div>
          {pool.results.map((r) => (
            <div key={r.playerId} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
              <b>{pname(s, r.playerId)}</b>
              <span className={`font-display text-lg font-bold ${r.net > 0 ? "text-neon" : "text-tb"}`}>
                {r.net > 0 ? "+" : ""}
                {money(r.net)}
              </span>
            </div>
          ))}
        </div>
      ))}
      {L.settled.length ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {L.settled.map(({ bet, st }) => (
            <div key={bet.id} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
              <span>
                <b>{pname(s, st.loserId)}</b> <span className="text-muted">→</span> <b>{pname(s, st.winnerId)}</b>
              </span>
              <span className="font-display text-lg font-bold text-gold">{money(st.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {s.payments.length > 0 && (
        <>
          <SectionTitle>Payments</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            {s.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                <span>
                  💸 <b>{pname(s, p.from)}</b> paid <b>{pname(s, p.to)}</b>
                  <span className="block text-[11px] text-muted">{timeAgo(p.at)} · marked by {pname(s, p.by)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-neon">{money(p.amount)}</span>
                  {me && (() => {
                    const a = s.activity.find((x) => x.undo?.type === "payment" && x.undo.id === p.id && !x.undone);
                    return a ? (
                      <button onClick={() => act("undo", { id: a.id })} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold">
                        Undo
                      </button>
                    ) : null;
                  })()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
