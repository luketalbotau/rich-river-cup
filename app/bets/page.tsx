"use client";

import { useState } from "react";
import { BetSlip } from "@/components/BetSlip";
import { useGame } from "@/components/GameProvider";
import { Button, Empty, Loading } from "@/components/ui";
import { betStatus, timeAgo } from "@/lib/logic";

type Tab = "open" | "live" | "settled" | "mine" | "feed";

export default function BetsPage() {
  const { state: s, d, me } = useGame();
  const [tab, setTab] = useState<Tab>("open");
  if (!s || !d) return <Loading />;

  const withSt = s.bets.map((b) => ({ b, st: betStatus(b, d).status }));
  const lists: Record<Exclude<Tab, "feed">, typeof withSt> = {
    open: withSt.filter((x) => x.st === "open"),
    live: withSt.filter((x) => x.st === "live"),
    settled: withSt.filter((x) => x.st === "settled" || x.st === "void"),
    mine: withSt.filter((x) => me && (x.b.creatorId === me.id || x.b.takerId === me.id) && x.st !== "cancelled"),
  };
  const feed = s.activity.filter((a) => /^(🎟️|🤝|💸)/.test(a.text) && !a.undone);
  const tabs: { k: Tab; label: string; n?: number }[] = [
    { k: "open", label: "Open", n: lists.open.length },
    { k: "live", label: "Live", n: lists.live.length },
    { k: "settled", label: "Settled" },
    { k: "mine", label: "Mine" },
    { k: "feed", label: "Feed" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold">IOU Sportsbook</div>
          <h1 className="font-display text-4xl font-black uppercase italic leading-none">Bets</h1>
        </div>
        <Button href={me ? "/bets/new" : "/login?next=/bets/new"} className="px-4 py-2.5 text-sm">
          + New bet
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Head-to-head only. Post a bet and someone takes the other side. Nothing settles in the app: it just tracks who owes who.
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
        {tab === "feed" ? (
          feed.length ? (
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
          )
        ) : lists[tab].length ? (
          lists[tab].map(({ b }) => <BetSlip key={b.id} bet={b} s={s} d={d} />)
        ) : (
          <Empty>
            {tab === "open" ? "No open bets. Post one and see who bites." : tab === "mine" && !me ? "Log in to see your bets." : "Nothing here yet."}
          </Empty>
        )}
      </div>
    </div>
  );
}
