"use client";

import { useEffect, useState } from "react";
import { BetSlip } from "@/components/BetSlip";
import { useGame } from "@/components/GameProvider";
import { PoolCard } from "@/components/PoolCard";
import { Empty, Loading, SectionTitle } from "@/components/ui";
import { allPools, betStatus, timeAgo } from "@/lib/logic";

type Tab = "pools" | "mine" | "h2h" | "feed";

export default function BetsPage() {
  const { state: s, d, me } = useGame();
  const [tab, setTab] = useState<Tab>("pools");
  const loaded = !!(s && d);

  // Jump to a pool when arriving from a match page link like /bets#pool-d1-2
  useEffect(() => {
    if (!loaded) return;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, [loaded]);

  if (!s || !d) return <Loading />;

  const pools = allPools(s, d);
  const live = pools.filter((p) => p.status === "open");
  const done = pools.filter((p) => p.status === "settled" || (p.status === "refunded" && p.stakes.length));
  const waiting = pools.filter((p) => p.status === "waiting");
  const minePools = me ? pools.filter((p) => p.stakes.some((x) => x.playerId === me.id)) : [];
  const h2h = s.bets.filter((b) => betStatus(b, d).status !== "cancelled" && betStatus(b, d).status !== "expired");
  const mineH2h = me ? h2h.filter((b) => b.creatorId === me.id || b.takerId === me.id) : [];
  const feed = s.activity.filter((a) => /^(🎟️|🤝|💸)/.test(a.text) && !a.undone);

  const tabs: { k: Tab; label: string; n?: number }[] = [
    { k: "pools", label: "Bet now", n: live.length },
    { k: "mine", label: "My bets", n: minePools.length + mineH2h.length },
    ...(h2h.length ? [{ k: "h2h" as Tab, label: "Head-to-head" }] : []),
    { k: "feed", label: "Feed" },
  ];

  return (
    <div>
      <div className="pt-2">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold">IOU Sportsbook</div>
        <h1 className="font-display text-4xl font-black uppercase italic leading-none">Bets</h1>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["1", "Pick a side", "Tap Back on any match or the weekend"],
          ["2", "Throw in cash", "Any amount, any time until it's decided"],
          ["3", "Winners split it", "The losing side's money is shared out"],
        ].map(([n, t, sub]) => (
          <div key={n} className="rounded-xl border border-line bg-card px-2 py-2.5">
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-neon font-display text-sm font-black text-black">{n}</div>
            <div className="mt-1 font-display text-sm font-bold uppercase leading-tight">{t}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted">{sub}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted">
        No money goes in the app. It keeps the tally, and the Owed tab tells you who pays who at the end. Back early or back the underdog for a bigger share of the pot.
      </p>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === t.k ? "bg-white text-black" : "border border-line bg-card text-white/70"}`}
          >
            {t.label}
            {!!t.n && <span className={`ml-1.5 rounded-full px-1.5 text-[11px] ${tab === t.k ? "bg-black text-white" : "bg-gold text-black"}`}>{t.n}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {tab === "pools" && (
          <>
            {live.length ? live.map((p) => <PoolCard key={p.id} pool={p} s={s} d={d} />) : <Empty>{d.draft.complete ? "Nothing open right now." : "Betting opens when the draft is done."}</Empty>}
            {waiting.some((p) => p.day === 2) && d.draft.complete && (
              <Empty>Day 2 scramble bets open once both captains lock in their pairs.</Empty>
            )}
            {done.length > 0 && (
              <>
                <SectionTitle>Finished</SectionTitle>
                {done.map((p) => <PoolCard key={p.id} pool={p} s={s} d={d} />)}
              </>
            )}
          </>
        )}

        {tab === "mine" &&
          (!me ? (
            <Empty>Log in to see your bets.</Empty>
          ) : minePools.length + mineH2h.length ? (
            <>
              {minePools.map((p) => <PoolCard key={p.id} pool={p} s={s} d={d} />)}
              {mineH2h.map((b) => <BetSlip key={b.id} bet={b} s={s} d={d} />)}
            </>
          ) : (
            <Empty>You haven&rsquo;t bet yet. Go to Bet now and back someone.</Empty>
          ))}

        {tab === "h2h" && (
          <>
            <p className="text-xs text-muted">Bets from before the pools. They still settle as normal.</p>
            {h2h.map((b) => <BetSlip key={b.id} bet={b} s={s} d={d} />)}
          </>
        )}

        {tab === "feed" &&
          (feed.length ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              {feed.map((a) => (
                <div key={a.id} className="border-b border-line px-3 py-2.5 text-sm last:border-0">
                  <div>{a.text}</div>
                  <div className="text-[11px] text-muted">{timeAgo(a.at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No bets yet. Be the first.</Empty>
          ))}
      </div>
    </div>
  );
}
