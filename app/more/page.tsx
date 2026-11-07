"use client";

import Link from "next/link";
import { useState } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Loading, SectionTitle, teamText } from "@/components/ui";
import { ADMIN_ID } from "@/lib/config";

export default function MorePage() {
  const { state: s, d, me, act, toast } = useGame();
  const [teamName, setTeamName] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [confirmDraft, setConfirmDraft] = useState(false);
  const [confirmPairs, setConfirmPairs] = useState(false);
  if (!s || !d) return <Loading />;
  const myTeam = me?.captain ? me.team : null;
  const isAdmin = me?.id === ADMIN_ID;

  return (
    <div>
      <h1 className="pt-2 font-display text-4xl font-black uppercase italic">More</h1>

      <Card className="mt-3 flex items-center gap-3 p-3">
        {me ? (
          <>
            <Avatar p={me} size={44} />
            <div className="flex-1">
              <div className="font-semibold">{me.name}</div>
              <div className="text-xs text-muted">{me.captain ? "Captain" : "Player"}{isAdmin ? " · Admin" : ""}</div>
            </div>
            <Button variant="ghost" className="py-2 text-sm" onClick={() => act("logout")}>Log out</Button>
          </>
        ) : (
          <>
            <div className="flex-1 text-sm text-muted">Not logged in. You can watch, but log in to score and bet.</div>
            <Button href="/login" className="py-2 text-sm">Log in</Button>
          </>
        )}
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <Link href="/draft" className="rounded-xl border border-line bg-card py-3">📋<br />Draft</Link>
        <Link href="/day2" className="rounded-xl border border-line bg-card py-3">🤝<br />Day 2 pairs</Link>
        <Link href="/victory" className="rounded-xl border border-line bg-card py-3">🏆<br />Victory</Link>
      </div>
      <Link href="/players" className="mt-2 flex items-center justify-between rounded-xl border border-line bg-card px-3 py-3 text-sm font-semibold">
        <span>🃏 Squad</span>
        <span className="text-xs text-muted">Player cards →</span>
      </Link>
      <Link href="/ledger" className="mt-2 flex items-center justify-between rounded-xl border border-line bg-card px-3 py-3 text-sm font-semibold">
        <span>💸 Who owes who</span>
        <span className="text-xs text-muted">For after the weekend →</span>
      </Link>

      {myTeam && (
        <>
          <SectionTitle>Team name</SectionTitle>
          <Card className="p-3">
            <div className={`mb-2 text-xs font-bold uppercase ${teamText[myTeam]}`}>Currently: {s.teams[myTeam].name}</div>
            <div className="flex gap-2">
              <input
                value={teamName ?? s.teams[myTeam].name}
                maxLength={24}
                onChange={(e) => setTeamName(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-line bg-black/40 px-3 py-2.5 outline-none focus:border-neon"
              />
              <Button
                className="py-2 text-sm"
                onClick={async () => {
                  const r = await act("setTeamName", { name: teamName ?? s.teams[myTeam].name });
                  if (r.ok) { toast("Team renamed"); setTeamName(null); }
                }}
              >
                Save
              </Button>
            </div>
          </Card>
        </>
      )}

      {isAdmin && (
        <>
          <SectionTitle>Admin · Reset PINs</SectionTitle>
          <Card className="divide-y divide-line">
            {s.players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <Avatar p={p} size={30} />
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                {!p.hasPin ? (
                  <span className="text-xs text-muted">No PIN set</span>
                ) : resetting === p.id ? (
                  <span className="flex gap-1">
                    <button className="rounded-lg px-2 py-1 text-xs text-muted" onClick={() => setResetting(null)}>Cancel</button>
                    <button
                      className="rounded-lg bg-tb px-2 py-1 text-xs font-bold"
                      onClick={async () => {
                        const r = await act("resetPin", { playerId: p.id });
                        setResetting(null);
                        if (r.ok) toast(`${p.name} can set a new PIN`);
                      }}
                    >
                      Confirm
                    </button>
                  </span>
                ) : (
                  <button className="rounded-lg border border-line px-2 py-1 text-xs" onClick={() => setResetting(p.id)}>Reset PIN</button>
                )}
              </div>
            ))}
          </Card>
          {(s.pairs.A.locked || s.pairs.B.locked) && !s.holes.some((h) => h.matchId.startsWith("d2")) && (
            <div className="mt-3">
              {confirmPairs ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" onClick={() => setConfirmPairs(false)}>Cancel</Button>
                  <Button variant="danger" onClick={async () => { await act("resetPairs"); setConfirmPairs(false); }}>Yes, reset pairs</Button>
                </div>
              ) : (
                <Button variant="danger" className="w-full" onClick={() => setConfirmPairs(true)}>Reset the Day 2 pairs</Button>
              )}
            </div>
          )}
          {!s.holes.length && (
            <div className="mt-3">
              {confirmDraft ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" onClick={() => setConfirmDraft(false)}>Cancel</Button>
                  <Button variant="danger" onClick={async () => { await act("draftReset"); setConfirmDraft(false); }}>Yes, reset</Button>
                </div>
              ) : (
                <Button variant="danger" className="w-full" onClick={() => setConfirmDraft(true)}>Reset the whole draft</Button>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
