"use client";

import { useState } from "react";
import { useGame } from "@/components/GameProvider";
import { PoolCard } from "@/components/PoolCard";
import { Button, Loading } from "@/components/ui";
import { allPools } from "@/lib/logic";

export default function BetsPage() {
  const { state: s, d } = useGame();
  const [help, setHelp] = useState(false);
  if (!s || !d) return <Loading />;
  const pools = allPools(s, d);

  return (
    <div>
      <div className="flex items-end justify-between pt-2">
        <h1 className="font-display text-4xl font-black uppercase italic leading-none">Bets</h1>
        <button onClick={() => setHelp(true)} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-bold">
          How it works
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {pools.map((p) => (
          <PoolCard key={p.id} pool={p} s={s} />
        ))}
      </div>

      {help && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setHelp(false)}>
          <div
            className="pop-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-card p-4 text-sm leading-snug"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-xl font-bold uppercase">How it works</div>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Pick a bet: the weekend winner, the Day 1 winner or the Day 2 winner.</li>
              <li>Pick the team you think will win it.</li>
              <li>Type how much money you want to bet.</li>
              <li>Your bet is matched with someone who bet the same amount on the other team.</li>
              <li>If nobody has bet on the other team yet, your bet waits until someone does.</li>
              <li>If your team wins, you win the matched amount. If your team loses, you pay the matched amount.</li>
              <li>Money that never gets matched doesn&rsquo;t count. You can take it back at any time.</li>
              <li>You can only bet on one team in each bet.</li>
            </ol>
            <p className="mt-3 text-muted">
              This app does not hold any money. It works out who owes who. You pay each other after the weekend. If a bet finishes level, nobody pays.
            </p>
            <Button className="mt-4 w-full" onClick={() => setHelp(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
