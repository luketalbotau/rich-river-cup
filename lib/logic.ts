import { CAPTAINS, DRAFT_ORDER, HOLES, ODDS_MODEL, POINTS } from "./config";
import type {
  Bet,
  HoleWinner,
  Market,
  Match,
  MatchSummary,
  Player,
  Side,
  State,
  TeamId,
} from "./types";

export const other = (t: TeamId): TeamId => (t === "A" ? "B" : "A");

export function playerById(s: State, id: string): Player | undefined {
  return s.players.find((p) => p.id === id);
}
export function pname(s: State, id: string) {
  return playerById(s, id)?.name ?? id;
}

// ---------------- Draft ----------------

export function draftInfo(s: State) {
  const picks = s.players
    .filter((p) => !p.captain && p.pick != null)
    .sort((a, b) => a.pick! - b.pick!);
  const n = picks.length;
  const complete = n >= DRAFT_ORDER.length;
  return {
    picks,
    n,
    complete,
    onClock: complete ? null : DRAFT_ORDER[n],
    available: s.players.filter((p) => !p.captain && p.pick == null),
  };
}

export function roster(s: State, t: TeamId): Player[] {
  const cap = s.players.find((p) => p.id === CAPTAINS[t])!;
  const rest = s.players
    .filter((p) => !p.captain && p.team === t && p.pick != null)
    .sort((a, b) => a.pick! - b.pick!);
  return [cap, ...rest];
}

export function pairsRevealed(s: State) {
  return s.pairs.A.locked && s.pairs.B.locked;
}

// ---------------- Matches ----------------

export function getMatches(s: State): Match[] {
  const d = draftInfo(s);
  const ra = roster(s, "A");
  const rb = roster(s, "B");
  const titles = ["Captains' Clash", "1st Picks", "2nd Picks", "3rd Picks"];
  const out: Match[] = [];
  for (let i = 0; i < 4; i++) {
    out.push({
      id: `d1-${i + 1}`,
      day: 1,
      title: titles[i],
      a: ra[i] ? [ra[i].id] : [],
      b: rb[i] ? [rb[i].id] : [],
      ready: d.complete,
    });
  }
  const rev = pairsRevealed(s);
  for (let i = 0; i < 2; i++) {
    const k = i === 0 ? "p1" : "p2";
    out.push({
      id: `d2-${i + 1}`,
      day: 2,
      title: `Scramble ${i + 1}`,
      a: rev ? s.pairs.A[k] ?? [] : [],
      b: rev ? s.pairs.B[k] ?? [] : [],
      ready: d.complete && rev,
    });
  }
  return out;
}

export function holeGrid(s: State, matchId: string): (HoleWinner | null)[] {
  const g: (HoleWinner | null)[] = Array(HOLES + 1).fill(null);
  for (const h of s.holes) if (h.matchId === matchId) g[h.hole] = h.winner;
  return g;
}

export function summarize(grid: (HoleWinner | null)[], day: 1 | 2): MatchSummary {
  let wonA = 0, wonB = 0, halved = 0, lead = 0, maxA = 0, maxB = 0;
  const seq: HoleWinner[] = [];
  for (let h = 1; h <= HOLES; h++) {
    const w = grid[h];
    if (!w) continue;
    seq.push(w);
    if (w === "A") { wonA++; lead++; }
    else if (w === "B") { wonB++; lead--; }
    else halved++;
    maxA = Math.max(maxA, lead);
    maxB = Math.max(maxB, -lead);
  }
  const played = wonA + wonB + halved;
  const remaining = HOLES - played;
  const complete = remaining === 0;
  const decided = complete || Math.abs(lead) > remaining;
  const winner: HoleWinner | null = !decided ? null : lead > 0 ? "A" : lead < 0 ? "B" : "H";
  let streak: MatchSummary["streak"] = null;
  if (seq.length) {
    const last = seq[seq.length - 1];
    if (last !== "H") {
      let n = 0;
      for (let i = seq.length - 1; i >= 0 && seq[i] === last; i--) n++;
      if (n >= 3) streak = { side: last, len: n };
    }
  }
  const choke: Side | null = maxA >= 3 && lead <= 0 ? "A" : maxB >= 3 && lead >= 0 ? "B" : null;
  const pts = POINTS[day];
  return {
    wonA, wonB, halved, played, remaining, lead, complete, decided, winner, streak, choke,
    pointsA: wonA * pts,
    pointsB: wonB * pts,
  };
}

// ---------------- Odds ----------------

/** Probability distribution of a points swing over remaining holes. */
function swingDist(steps: { size: number; count: number }[]) {
  const max = steps.reduce((a, s) => a + s.size * s.count, 0);
  let dist = new Float64Array(2 * max + 1);
  dist[max] = 1;
  const { win, halve } = ODDS_MODEL;
  for (const st of steps) {
    for (let c = 0; c < st.count; c++) {
      const next = new Float64Array(dist.length);
      for (let i = 0; i < dist.length; i++) {
        const v = dist[i];
        if (!v) continue;
        next[i] += v * halve;
        if (i + st.size < dist.length) next[i + st.size] += v * win;
        if (i - st.size >= 0) next[i - st.size] += v * win;
      }
      dist = next;
    }
  }
  return { dist, max };
}

export interface Probs { a: number; h: number; b: number }

function probsFrom(diff: number, steps: { size: number; count: number }[]): Probs {
  const { dist, max } = swingDist(steps);
  let a = 0, h = 0, b = 0;
  for (let i = 0; i < dist.length; i++) {
    const final = diff + (i - max);
    if (final > 0) a += dist[i];
    else if (final < 0) b += dist[i];
    else h += dist[i];
  }
  return { a, h, b };
}

export function matchProbs(sum: MatchSummary): Probs {
  if (sum.decided) {
    return { a: sum.winner === "A" ? 1 : 0, b: sum.winner === "B" ? 1 : 0, h: sum.winner === "H" ? 1 : 0 };
  }
  return probsFrom(sum.lead, [{ size: 1, count: sum.remaining }]);
}

export function holeProbs(): Probs {
  return { a: ODDS_MODEL.win, b: ODDS_MODEL.win, h: ODDS_MODEL.halve };
}

/** Decimal odds, e.g. 2.4 means $2.40 returned per $1. */
export function decimalOdds(p: number): number | null {
  if (p <= 0.0001) return null;
  return Math.max(1.01, Math.min(501, 1 / p));
}

// ---------------- Derived bundle ----------------

export interface MatchView {
  match: Match;
  grid: (HoleWinner | null)[];
  sum: MatchSummary;
  probs: Probs;
}

export interface Totals {
  A: number;
  B: number;
  day1: { A: number; B: number };
  day2: { A: number; B: number };
  remainingPts: number;
  decided: boolean;
  complete: boolean;
  winner: HoleWinner | null;
  probs: Probs;
  started: boolean;
}

export interface Derived {
  matches: MatchView[];
  byId: Record<string, MatchView>;
  totals: Totals;
  draft: ReturnType<typeof draftInfo>;
  revealed: boolean;
}

export function derive(s: State): Derived {
  const matches = getMatches(s).map((match) => {
    const grid = holeGrid(s, match.id);
    const sum = summarize(grid, match.day);
    return { match, grid, sum, probs: matchProbs(sum) };
  });
  const byId: Record<string, MatchView> = {};
  for (const m of matches) byId[m.match.id] = m;
  const t = { A: 0, B: 0, day1: { A: 0, B: 0 }, day2: { A: 0, B: 0 } };
  let rem1 = 0, rem2 = 0, played = 0;
  for (const m of matches) {
    const day = m.match.day === 1 ? t.day1 : t.day2;
    day.A += m.sum.pointsA;
    day.B += m.sum.pointsB;
    t.A += m.sum.pointsA;
    t.B += m.sum.pointsB;
    played += m.sum.played;
    if (m.match.day === 1) rem1 += m.sum.remaining;
    else rem2 += m.sum.remaining;
  }
  const diff = t.A - t.B;
  const remainingPts = rem1 * POINTS[1] + rem2 * POINTS[2];
  const complete = remainingPts === 0;
  const decided = complete || Math.abs(diff) > remainingPts;
  const winner: HoleWinner | null = !decided ? null : diff > 0 ? "A" : diff < 0 ? "B" : "H";
  const probs: Probs = decided
    ? { a: winner === "A" ? 1 : 0, b: winner === "B" ? 1 : 0, h: winner === "H" ? 1 : 0 }
    : probsFrom(diff, [
        { size: POINTS[1], count: rem1 },
        { size: POINTS[2], count: rem2 },
      ]);
  return {
    matches,
    byId,
    totals: { ...t, remainingPts, decided, complete, winner, probs, started: played > 0 },
    draft: draftInfo(s),
    revealed: pairsRevealed(s),
  };
}

/** Cumulative team points gap (A minus B) across Day 1 holes 1-18 then Day 2 holes 1-18. */
export function momentum(d: Derived): { label: string; diff: number }[] {
  const pts: { label: string; diff: number }[] = [{ label: "Start", diff: 0 }];
  let diff = 0;
  for (const day of [1, 2] as const) {
    const ms = d.matches.filter((m) => m.match.day === day);
    let last = 0;
    for (let h = 1; h <= HOLES; h++) if (ms.some((m) => m.grid[h])) last = h;
    for (let h = 1; h <= last; h++) {
      for (const m of ms) {
        const w = m.grid[h];
        if (w === "A") diff += POINTS[day];
        else if (w === "B") diff -= POINTS[day];
      }
      pts.push({ label: `D${day} H${h}`, diff });
    }
  }
  return pts;
}

export function sideNames(s: State, ids: string[]) {
  return ids.map((id) => pname(s, id)).join(" & ");
}

// ---------------- Bets ----------------

export function marketOutcome(d: Derived, bet: Pick<Bet, "market" | "matchId" | "hole">): HoleWinner | null {
  if (bet.market === "overall") return d.totals.winner;
  const mv = bet.matchId ? d.byId[bet.matchId] : undefined;
  if (!mv) return null;
  if (bet.market === "match") return mv.sum.winner;
  return mv.grid[bet.hole ?? 0] ?? null;
}

export type BetStatus =
  | { status: "cancelled" | "open" | "expired" | "live" | "void" }
  | { status: "settled"; winnerId: string; loserId: string; amount: number; winningSide: Side };

export function betStatus(bet: Bet, d: Derived): BetStatus {
  if (bet.cancelled) return { status: "cancelled" };
  const out = marketOutcome(d, bet);
  if (!bet.takerId) return { status: out ? "expired" : "open" };
  if (!out) return { status: "live" };
  if (out === "H") return { status: "void" };
  const creatorWins = out === bet.pick;
  return {
    status: "settled",
    winnerId: creatorWins ? bet.creatorId : bet.takerId,
    loserId: creatorWins ? bet.takerId : bet.creatorId,
    amount: creatorWins ? bet.takerStake : bet.creatorStake,
    winningSide: out,
  };
}

export function sideLabel(s: State, d: Derived, market: Market, matchId: string | undefined, side: Side): string {
  if (market === "overall") return s.teams[side].name;
  const mv = matchId ? d.byId[matchId] : undefined;
  if (!mv) return side;
  const ids = side === "A" ? mv.match.a : mv.match.b;
  return ids.length ? sideNames(s, ids) : s.teams[side].name;
}

export function marketLabel(d: Derived, market: Market, matchId?: string, hole?: number): string {
  if (market === "overall") return "Weekend Winner";
  const mv = matchId ? d.byId[matchId] : undefined;
  const mt = mv ? `Day ${mv.match.day} · ${mv.match.title}` : "";
  return market === "match" ? `Match Winner · ${mt}` : `Hole ${hole} · ${mt}`;
}

/** Probabilities for a market, conditional on there being a winner (draws void). */
export function marketProbs(d: Derived, market: Market, matchId?: string): Probs {
  if (market === "overall") return d.totals.probs;
  if (market === "hole") return holeProbs();
  const mv = matchId ? d.byId[matchId] : undefined;
  return mv ? mv.probs : holeProbs();
}

// ---------------- Ledger ----------------

export interface Transfer { from: string; to: string; amount: number }

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function ledger(s: State, d: Derived) {
  const balance: Record<string, number> = {};
  const pnl: Record<string, number> = {};
  const record: Record<string, { w: number; l: number }> = {};
  for (const p of s.players) {
    balance[p.id] = 0;
    pnl[p.id] = 0;
    record[p.id] = { w: 0, l: 0 };
  }
  const settled: { bet: Bet; st: Extract<BetStatus, { status: "settled" }> }[] = [];
  for (const bet of s.bets) {
    const st = betStatus(bet, d);
    if (st.status !== "settled") continue;
    settled.push({ bet, st });
    balance[st.winnerId] += st.amount;
    balance[st.loserId] -= st.amount;
    pnl[st.winnerId] += st.amount;
    pnl[st.loserId] -= st.amount;
    record[st.winnerId].w++;
    record[st.loserId].l++;
  }
  for (const pay of s.payments) {
    balance[pay.from] += pay.amount;
    balance[pay.to] -= pay.amount;
  }
  return { balance, pnl, record, settled, transfers: simplify(balance) };
}

function simplify(balance: Record<string, number>): Transfer[] {
  const cred = Object.entries(balance).filter(([, v]) => v > 0.004).map(([id, v]) => ({ id, v }));
  const debt = Object.entries(balance).filter(([, v]) => v < -0.004).map(([id, v]) => ({ id, v: -v }));
  cred.sort((a, b) => b.v - a.v);
  debt.sort((a, b) => b.v - a.v);
  const out: Transfer[] = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i].v, cred[j].v);
    if (amt > 0.004) out.push({ from: debt[i].id, to: cred[j].id, amount: round2(amt) });
    debt[i].v -= amt;
    cred[j].v -= amt;
    if (debt[i].v <= 0.004) i++;
    if (cred[j].v <= 0.004) j++;
  }
  return out;
}

// ---------------- Player stats ----------------

export function playerStats(d: Derived, id: string) {
  let holesWon = 0, w = 0, l = 0, h = 0, points = 0;
  for (const m of d.matches) {
    const side: Side | null = m.match.a.includes(id) ? "A" : m.match.b.includes(id) ? "B" : null;
    if (!side) continue;
    const won = side === "A" ? m.sum.wonA : m.sum.wonB;
    holesWon += won;
    points += won * POINTS[m.match.day];
    if (m.sum.complete || m.sum.decided) {
      if (m.sum.winner === "H") h++;
      else if (m.sum.winner === side) w++;
      else l++;
    }
  }
  return { holesWon, points, w, l, h };
}

// ---------------- Formatting ----------------

export function money(n: number) {
  const v = Math.abs(n);
  const s = Number.isInteger(v) ? v.toString() : v.toFixed(2);
  return `${n < 0 ? "-" : ""}$${s}`;
}

export function fmtOdds(p: number) {
  const o = decimalOdds(p);
  return o == null ? "—" : `$${o.toFixed(2)}`;
}

export function matchStatusText(s: State, mv: MatchView): string {
  const { sum, match } = mv;
  if (!match.ready) return match.day === 2 ? "Pairs not revealed" : "Awaiting draft";
  if (sum.played === 0) return "Not started";
  const lead = Math.abs(sum.lead);
  const leader = sum.lead > 0 ? sideNames(s, match.a) : sideNames(s, match.b);
  if (sum.complete) {
    if (sum.lead === 0) return `Halved ${sum.wonA}–${sum.wonB}`;
    return `${leader} win ${Math.max(sum.wonA, sum.wonB)}–${Math.min(sum.wonA, sum.wonB)}`;
  }
  if (sum.lead === 0) return `All square thru ${sum.played}`;
  return `${leader} ${lead} UP thru ${sum.played}`;
}

export function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
