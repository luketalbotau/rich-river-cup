"use client";

import Link from "next/link";
import { useState } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Loading, SectionTitle, teamText } from "@/components/ui";
import { ADMIN_ID } from "@/lib/config";
import { pname, timeAgo } from "@/lib/logic";

export default function MorePage() {
  const { state: s, d, me, act, toast } = useGame();
  const [teamName, setTeamName] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [confirmDraft, setConfirmDraft] = useState(false);
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
        <Link href="/draft" className="rounded-xl border border-line bg-card py-3">🃏<br />Draft</Link>
        <Link href="/day2" className="rounded-xl border border-line bg-card py-3">🤝<br />Day 2 pairs</Link>
        <Link href="/victory" className="rounded-xl border border-line bg-card py-3">🏆<br />Victory</Link>
      </div>

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

      <SectionTitle right={<span className="text-xs text-muted">Last {s.activity.length}</span>}>Activity</SectionTitle>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {s.activity.length === 0 && <div className="p-4 text-center text-sm text-muted">Nothing yet.</div>}
        {s.activity.map((a) => (
          <div key={a.id} className={`flex items-start gap-2 border-b border-line px-3 py-2.5 text-sm last:border-0 ${a.undone ? "opacity-40" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className={a.undone ? "line-through" : ""}>{a.text}</div>
              <div className="text-[11px] text-muted">
                {timeAgo(a.at)}
                {a.by ? ` · ${pname(s, a.by)}` : ""}
              </div>
            </div>
            {a.undo && !a.undone && me && (
              <button onClick={() => act("undo", { id: a.id })} className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs font-semibold">
                Undo
              </button>
            )}
          </div>
        ))}
      </div>

      <SectionTitle>Rules</SectionTitle>
      <Card className="space-y-2 p-4 text-sm text-white/80">
        <p><b className="text-white">Day 1 · Singles.</b> 4 matches, stroke play. Win a hole = 1 point.</p>
        <p><b className="text-white">Day 2 · 2-ball scramble.</b> 2 matches, stroke play. Win a hole = 2 points.</p>
        <p>Halved holes = 0. Most points across both days wins. A tie stays a draw.</p>
        <p><b className="text-white">Bets</b> are head-to-head IOUs. Draws and halved holes void the bet.</p>
      </Card>
    </div>
  );
}
