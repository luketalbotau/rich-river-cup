"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/components/GameProvider";
import { Avatar, Button, Card, Empty, Loading, OddsChip, SectionTitle, teamText } from "@/components/ui";
import { APP_NAME } from "@/lib/config";
import { fmtOdds, ledger, money, playerStats, roster } from "@/lib/logic";
import type { Player, TeamId } from "@/lib/types";

function Confetti({ colors }: { colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth), h = (c.height = window.innerHeight);
    const parts = Array.from({ length: 160 }, () => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      r: 4 + Math.random() * 6,
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      a: Math.random() * Math.PI,
      va: -0.1 + Math.random() * 0.2,
      col: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const done = Date.now() - start > 7000;
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx; p.a += p.va;
        if (p.y > h && !done) { p.y = -10; p.x = Math.random() * w; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onR = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join()]);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50" />;
}

export default function VictoryPage() {
  const { state: s, d } = useGame();
  if (!s || !d) return <Loading />;
  const { totals } = d;
  if (!d.draft.complete) return <div className="pt-6"><Empty>The tournament hasn&apos;t started yet.</Empty></div>;

  if (!totals.decided) {
    return (
      <div className="pt-6 text-center">
        <div className="text-6xl">🏆</div>
        <h1 className="mt-2 font-display text-4xl font-black uppercase italic">Not over yet</h1>
        <p className="mt-1 text-sm text-muted">{totals.remainingPts} points still up for grabs.</p>
        <div className="mt-5 flex gap-2">
          <div className="flex-1"><OddsChip label={s.teams.A.name} odds={fmtOdds(totals.probs.a)} tone="A" /></div>
          <div className="w-20"><OddsChip label="Draw" odds={fmtOdds(totals.probs.h)} /></div>
          <div className="flex-1"><OddsChip label={s.teams.B.name} odds={fmtOdds(totals.probs.b)} tone="B" /></div>
        </div>
        <Button href="/" className="mt-6 w-full">Back to the board</Button>
      </div>
    );
  }

  const draw = totals.winner === "H";
  const win = (draw ? null : totals.winner) as TeamId | null;
  const colors = win === "A" ? ["#2f8cff", "#ffd23f", "#ffffff"] : win === "B" ? ["#ff3d6e", "#ffd23f", "#ffffff"] : ["#2f8cff", "#ff3d6e", "#ffd23f"];

  const stats = s.players.map((p) => ({ p, ...playerStats(d, p.id) }));
  const mvp = [...stats].sort((a, b) => b.points - a.points || b.holesWon - a.holesWon)[0];
  const spud = [...stats].sort((a, b) => a.points - b.points || a.holesWon - b.holesWon)[0];
  const L = ledger(s, d);
  const punters = [...s.players].sort((a, b) => L.pnl[b.id] - L.pnl[a.id]);
  const shark = punters[0];
  const donor = punters[punters.length - 1];

  const share = async () => {
    const text = draw
      ? `${APP_NAME}: it's a draw! ${totals.A}–${totals.B}`
      : `🏆 ${s.teams[win!].name} win ${APP_NAME} ${Math.max(totals.A, totals.B)}–${Math.min(totals.A, totals.B)}! MVP: ${mvp.p.name}`;
    try {
      if (navigator.share) await navigator.share({ text, url: location.origin });
      else { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); }
    } catch {}
  };

  return (
    <div className="pb-6">
      <Confetti colors={colors} />
      <div className="relative overflow-hidden rounded-3xl border border-gold/50 bg-gradient-to-b from-gold/20 via-card to-card p-6 text-center">
        <div className="shine pointer-events-none absolute inset-0" />
        <div className="text-7xl drop-shadow-[0_0_30px_rgba(255,210,63,0.6)]">🏆</div>
        <div className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-gold">{APP_NAME} champions</div>
        <h1 className={`mt-1 font-display text-5xl font-black uppercase italic leading-none glow-gold ${win ? teamText[win] : "text-white"}`}>
          {draw ? "It's a draw" : s.teams[win!].name}
        </h1>
        <div className="mt-3 font-display text-4xl font-black tabular">
          <span className="text-ta">{totals.A}</span> <span className="text-muted">–</span> <span className="text-tb">{totals.B}</span>
        </div>
        {!totals.complete && <p className="mt-1 text-xs text-muted">Clinched with {totals.remainingPts} points left to play</p>}
        {win && (
          <div className="mt-4 flex justify-center gap-3">
            {roster(s, win).map((p) => (
              <div key={p.id} className="flex flex-col items-center">
                <Avatar p={p} size={52} />
                <span className="mt-1 text-xs font-bold">{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionTitle>Awards</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Award emoji="⭐" title="MVP" p={mvp.p} line={`${mvp.points} pts won`} />
        <Award emoji="🥔" title="Spud of the weekend" p={spud.p} line={`${spud.points} pts won`} />
        <Award emoji="🦈" title="Card shark" p={shark} line={`${L.pnl[shark.id] >= 0 ? "+" : ""}${money(L.pnl[shark.id])} on bets`} />
        <Award emoji="🎁" title="Biggest donor" p={donor} line={`${money(L.pnl[donor.id])} on bets`} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="gold" onClick={share}>Share result</Button>
        <Button href="/ledger" variant="ghost">Settle up</Button>
      </div>
    </div>
  );
}

function Award({ emoji, title, p, line }: { emoji: string; title: string; p: Player; line: string }) {
  return (
    <Card className="flex flex-col items-center p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{title}</div>
      <Avatar p={p} size={48} className="mt-2" />
      <div className="mt-1 font-display text-lg font-bold uppercase">{p.name}</div>
      <div className="text-xs text-muted">{line}</div>
    </Card>
  );
}
