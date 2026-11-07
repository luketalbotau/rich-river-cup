"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, AvatarStack, Button, Card, Empty, Loading, teamBorder, teamSoft, teamText } from "@/components/ui";
import { roster } from "@/lib/logic";
import type { Player, TeamId } from "@/lib/types";

function PairSide({ ps, team, name }: { ps: Player[]; team: TeamId; name: string }) {
  return (
    <div className={`flex h-full flex-col items-center justify-center rounded-2xl border ${teamBorder[team]} ${teamSoft[team]} p-3`}>
      <AvatarStack ps={ps} size={46} />
      <div className="mt-2 text-center font-display text-lg font-bold uppercase leading-tight">{ps.map((p) => p.name).join(" & ")}</div>
      <div className={`truncate text-[11px] font-bold uppercase ${teamText[team]}`}>{name}</div>
    </div>
  );
}

function Reveal() {
  const { state: s, d } = useGame();
  const [flipped, setFlipped] = useState<number>(-1);
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem("rrc_d2_reveal_seen") === "1";
    } catch {}
    if (seen) {
      setFlipped(99);
      return;
    }
    const timers = [600, 1600, 2600, 3600].map((t, i) => setTimeout(() => setFlipped(i), t));
    try {
      localStorage.setItem("rrc_d2_reveal_seen", "1");
    } catch {}
    return () => timers.forEach(clearTimeout);
  }, []);
  if (!s || !d) return null;
  const get = (ids: string[]) => ids.map((id) => s.players.find((p) => p.id === id)!);
  const replay = () => {
    setFlipped(-1);
    [400, 1400, 2400, 3400].forEach((t, i) => setTimeout(() => setFlipped(i), t));
  };
  const day2 = d.matches.filter((m) => m.match.day === 2);
  return (
    <div>
      <div className="pt-2 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Revealed</div>
        <h1 className="font-display text-4xl font-black uppercase italic">Day 2 Pairs</h1>
      </div>
      <div className="mt-4 flex flex-col gap-5">
        {day2.map((mv, mi) => (
          <div key={mv.match.id}>
            <div className="mb-2 text-center font-display text-sm font-bold uppercase tracking-widest text-muted">{mv.match.title}</div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {(["A", "B"] as TeamId[]).map((t, ti) => {
                const idx = mi * 2 + ti;
                const ids = t === "A" ? mv.match.a : mv.match.b;
                return (
                  <div key={t} className={`flip h-36 ${ti === 1 ? "order-3" : ""}`}>
                    <div className={`flip-inner h-full ${flipped >= idx ? "flipped" : ""}`}>
                      <div className={`flip-face flex h-full items-center justify-center rounded-2xl border ${teamBorder[t]} bg-card`}>
                        <span className={`font-display text-5xl font-black ${teamText[t]}`}>?</span>
                      </div>
                      <div className="flip-face flip-back">
                        <PairSide ps={get(ids)} team={t} name={s.teams[t].name} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <span className="order-2 font-display text-xl font-black italic text-muted">VS</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={replay}>Replay</Button>
        <Button href="/">To the board</Button>
      </div>
    </div>
  );
}

export default function Day2Page() {
  const { state: s, d, me, act } = useGame();
  const [p1, setP1] = useState<string[]>([]);
  if (!s || !d) return <Loading />;
  if (!d.draft.complete) return <div className="pt-6"><Empty>Finish the draft first.</Empty></div>;
  if (d.revealed) return <Reveal />;

  const myTeam = me?.team ?? null;
  const isCaptain = !!me?.captain && !!myTeam;
  const mine = myTeam ? s.pairs[myTeam] : null;
  const team = myTeam ? roster(s, myTeam) : [];
  const toggle = (id: string) =>
    setP1((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 2 ? [...cur, id] : [cur[1], id]));
  const p2 = team.filter((p) => !p1.includes(p.id));

  return (
    <div>
      <div className="pt-2">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Day 2 · Scramble</div>
        <h1 className="font-display text-4xl font-black uppercase italic leading-none">Secret Pairs</h1>
        <p className="mt-2 text-sm text-muted">
          Each captain splits their team into 2 pairs. Pair 1 plays the other team&apos;s Pair 1. Both are revealed the moment the second captain locks in.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["A", "B"] as TeamId[]).map((t) => (
          <Card key={t} className="p-3 text-center">
            <div className={`truncate text-xs font-bold uppercase ${teamText[t]}`}>{s.teams[t].name}</div>
            <div className="mt-1 text-lg">{s.pairs[t].locked ? "🔒 Locked in" : "⏳ Choosing"}</div>
          </Card>
        ))}
      </div>

      {isCaptain && mine && !mine.locked && (
        <div className="mt-6">
          <h2 className="font-display text-xl font-bold uppercase">Pick Pair 1</h2>
          <p className="mb-3 text-xs text-muted">Tap two players. The other two become Pair 2.</p>
          <div className="grid grid-cols-2 gap-3">
            {team.map((p) => {
              const on = p1.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`flex flex-col items-center rounded-2xl border p-3 transition active:scale-95 ${on ? "border-gold bg-gold/10" : "border-line bg-card"}`}
                >
                  <Avatar p={p} size={52} />
                  <div className="mt-1 font-display text-lg font-bold uppercase">{p.name}</div>
                  <div className={`text-[11px] font-bold ${on ? "text-gold" : "text-muted"}`}>{on ? "PAIR 1" : "PAIR 2"}</div>
                </button>
              );
            })}
          </div>
          {p1.length === 2 && (
            <Card className="mt-4 p-3 text-sm">
              <div><b className="text-gold">Pair 1:</b> {p1.map((id) => s.players.find((p) => p.id === id)?.name).join(" & ")}</div>
              <div className="mt-1"><b className="text-muted">Pair 2:</b> {p2.map((p) => p.name).join(" & ")}</div>
            </Card>
          )}
          <Button className="mt-4 w-full py-4" disabled={p1.length !== 2} onClick={() => act("lockPairs", { p1 })}>
            🔒 Lock in pairs
          </Button>
        </div>
      )}

      {mine?.locked && mine.p1 && mine.p2 && myTeam && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-xl font-bold uppercase">Your team&apos;s pairs</h2>
          <div className="grid grid-cols-2 gap-3">
            {[mine.p1, mine.p2].map((ids, i) => (
              <div key={i}>
                <div className="mb-1 text-center text-xs font-bold text-muted">PAIR {i + 1}</div>
                <PairSide ps={ids.map((id) => s.players.find((p) => p.id === id)!)} team={myTeam} name={s.teams[myTeam].name} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">Hidden from the other team until both captains lock in.</p>
          {isCaptain && (
            <Button variant="ghost" className="mt-3 w-full" onClick={() => { setP1([]); act("unlockPairs"); }}>
              🔓 Unlock and change
            </Button>
          )}
        </div>
      )}

      {!isCaptain && !mine?.locked && (
        <p className="mt-6 text-center text-sm text-muted">Only the captains can set pairs. Sit tight.</p>
      )}
    </div>
  );
}
