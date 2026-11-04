import crypto from "crypto";
import { ADMIN_ID, CAPTAINS, HOLES } from "../config";
import { derive, marketOutcome, pname, roster, sideLabel, sideNames, round2, money, marketLabel } from "../logic";
import type { Activity, Bet, HoleWinner, Market, Payment, Side, State, TeamId, Undo } from "../types";
import { checkPin, hashPin, type PinRecord } from "./auth";
import { buildState } from "./state";
import * as db from "./store";

export class ActionError extends Error {}
const fail = (msg: string): never => {
  throw new ActionError(msg);
};

const newId = () => `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;

function activity(by: string | null, text: string, undo?: Undo): [string, Activity] {
  const a: Activity = { id: newId(), at: Date.now(), by, text, undo };
  return [`act:${a.id}`, a];
}

function captainTeam(id: string): TeamId | null {
  return CAPTAINS.A === id ? "A" : CAPTAINS.B === id ? "B" : null;
}

export interface ActionResult {
  login?: { id: string; v: string };
  logout?: boolean;
}

// The full (unredacted) state is used for validation on the server.
function fullState(rows: Map<string, any>, me: string | null): State {
  const s = buildState(rows, null);
  // un-redact pairs for server-side checks
  for (const t of ["A", "B"] as TeamId[]) {
    const d = rows.get(`pairs:${t}`);
    s.pairs[t] = { p1: d?.p1 ?? null, p2: d?.p2 ?? null, locked: !!d?.locked };
  }
  s.me = me;
  return s;
}

export async function runAction(
  body: any,
  rows: Map<string, any>,
  me: string | null,
): Promise<ActionResult> {
  const type: string = body?.type;
  const s = fullState(rows, me);
  const d = derive(s);
  const need = () => me ?? fail("Log in first");

  switch (type) {
    // ---------------- auth ----------------
    case "login": {
      const id = String(body.playerId);
      const pin = String(body.pin ?? "");
      if (!s.players.some((p) => p.id === id)) fail("Unknown player");
      if (!/^\d{4}$/.test(pin)) fail("PIN must be 4 digits");
      const rec = rows.get(`pin:${id}`) as PinRecord | undefined;
      if (!rec) {
        const nr = hashPin(pin);
        await db.put([[`pin:${id}`, nr], activity(id, `${pname(s, id)} joined the app`)]);
        return { login: { id, v: nr.v } };
      }
      const fails = rows.get(`pinfail:${id}`) as { n: number; until: number } | undefined;
      if (fails && fails.until > Date.now()) {
        fail(`Too many tries. Wait ${Math.ceil((fails.until - Date.now()) / 1000)}s`);
      }
      if (!checkPin(pin, rec)) {
        const n = (fails?.n ?? 0) + 1;
        await db.put([[`pinfail:${id}`, { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + 60_000 : 0 }]]);
        fail(n >= 5 ? "Wrong PIN. Locked for 60s" : "Wrong PIN");
      }
      if (fails) await db.del([`pinfail:${id}`]);
      return { login: { id, v: rec.v } };
    }
    case "logout":
      return { logout: true };

    case "resetPin": {
      if (need() !== ADMIN_ID) fail("Only Luke can reset PINs");
      const id = String(body.playerId);
      await db.del([`pin:${id}`, `pinfail:${id}`]);
      await db.put([activity(me, `${pname(s, me!)} reset ${pname(s, id)}'s PIN`)]);
      return {};
    }

    // ---------------- draft ----------------
    case "draftPick": {
      const team = captainTeam(need());
      if (!team) fail("Only captains can draft");
      if (d.draft.onClock !== team) fail("It's not your pick");
      const id = String(body.playerId);
      const p = d.draft.available.find((x) => x.id === id) ?? fail("That player is already taken");
      const pick = d.draft.n + 1;
      await db.put([
        [`player:${id}`, { ...(rows.get(`player:${id}`) ?? {}), team, pick }],
        activity(me, `🃏 ${s.teams[team!].name} drafted ${p.name} (pick ${pick})`),
      ]);
      return {};
    }
    case "draftUndo": {
      if (!captainTeam(need())) fail("Only captains can undo picks");
      if (s.holes.length) fail("Scores have been entered. Can't change the draft now");
      if (s.pairs.A.locked || s.pairs.B.locked) fail("Day 2 pairs are locked. Unlock them first");
      const last = d.draft.picks[d.draft.picks.length - 1] ?? fail("No picks to undo");
      await db.put([
        [`player:${last.id}`, { ...(rows.get(`player:${last.id}`) ?? {}), team: null, pick: null }],
        activity(me, `↩️ ${pname(s, me!)} undid the pick of ${last.name}`),
      ]);
      return {};
    }
    case "draftReset": {
      if (need() !== ADMIN_ID) fail("Only Luke can reset the draft");
      if (s.holes.length) fail("Scores have been entered. Can't reset the draft");
      const puts: [string, unknown][] = s.players
        .filter((p) => !p.captain)
        .map((p) => [`player:${p.id}`, { ...(rows.get(`player:${p.id}`) ?? {}), team: null, pick: null }]);
      puts.push(activity(me, `🔄 ${pname(s, me!)} reset the draft`));
      await db.put(puts);
      await db.del(["pairs:A", "pairs:B"]);
      return {};
    }

    // ---------------- teams & pairs ----------------
    case "setTeamName": {
      const team = captainTeam(need()) ?? fail("Only captains can rename their team");
      const name = String(body.name ?? "").trim().slice(0, 24);
      if (name.length < 2) fail("Name is too short");
      await db.put([
        ["team:" + team, { name }],
        activity(me, `✏️ ${s.teams[team].name} is now called ${name}`),
      ]);
      return {};
    }
    case "lockPairs": {
      const team = captainTeam(need()) ?? fail("Only captains can set pairs");
      if (!d.draft.complete) fail("Finish the draft first");
      if (d.revealed) fail("Pairs are already revealed");
      const ids = roster(s, team).map((p) => p.id);
      const p1: string[] = Array.isArray(body.p1) ? body.p1.map(String) : [];
      if (p1.length !== 2 || new Set(p1).size !== 2 || !p1.every((x) => ids.includes(x))) fail("Pick 2 players for Pair 1");
      const p2 = ids.filter((x) => !p1.includes(x));
      const otherLocked = s.pairs[team === "A" ? "B" : "A"].locked;
      const puts: [string, unknown][] = [
        [`pairs:${team}`, { p1, p2, locked: true }],
        activity(me, `🔒 ${s.teams[team].name} locked in their Day 2 pairs`),
      ];
      if (otherLocked) puts.push(activity(null, "🎉 Day 2 pairs revealed!"));
      await db.put(puts);
      return {};
    }
    case "unlockPairs": {
      const team = captainTeam(need()) ?? fail("Only captains can change pairs");
      if (d.revealed) fail("Pairs are already revealed");
      const cur = rows.get(`pairs:${team}`) ?? {};
      await db.put([
        [`pairs:${team}`, { ...cur, locked: false }],
        activity(me, `🔓 ${s.teams[team].name} unlocked their pairs`),
      ]);
      return {};
    }

    // ---------------- scoring ----------------
    case "setHole": {
      need();
      const mv = d.byId[String(body.matchId)] ?? fail("Unknown match");
      if (!mv.match.ready) fail("This match isn't ready yet");
      const hole = Number(body.hole);
      if (!Number.isInteger(hole) || hole < 1 || hole > HOLES) fail("Bad hole");
      const winner: HoleWinner | null = body.winner === "A" || body.winner === "B" || body.winner === "H" ? body.winner : null;
      const prev = mv.grid[hole];
      if (prev === winner) return {};
      const key = `hole:${mv.match.id}:${hole}`;
      const label = winner === "H" ? "halved" : winner ? `→ ${sideNames(s, winner === "A" ? mv.match.a : mv.match.b)}` : "cleared";
      const text = `⛳ ${pname(s, me!)}: Hole ${hole} ${label} (${sideNames(s, mv.match.a)} v ${sideNames(s, mv.match.b)})`;
      const act = activity(me, text, { type: "hole", matchId: mv.match.id, hole, prev });
      if (winner) await db.put([[key, { winner, by: me, at: Date.now() }], act]);
      else {
        await db.del([key]);
        await db.put([act]);
      }
      return {};
    }
    case "undo": {
      need();
      const a = rows.get(`act:${String(body.id)}`) as Activity | undefined;
      if (!a?.undo || a.undone) fail("Nothing to undo");
      const u = a!.undo!;
      if (u.type === "hole") {
        const key = `hole:${u.matchId}:${u.hole}`;
        if (u.prev) await db.put([[key, { winner: u.prev, by: me, at: Date.now() }]]);
        else await db.del([key]);
      } else if (u.type === "payment") {
        await db.del([`pay:${u.id}`]);
      }
      await db.put([
        [`act:${a!.id}`, { ...a, undone: true }],
        activity(me, `↩️ ${pname(s, me!)} undid: ${a!.text}`),
      ]);
      return {};
    }

    // ---------------- profiles ----------------
    case "updateProfile": {
      const id = need();
      const cur = rows.get(`player:${id}`) ?? {};
      await db.put([
        [
          `player:${id}`,
          {
            ...cur,
            nickname: String(body.nickname ?? "").slice(0, 30),
            shot: String(body.shot ?? "").slice(0, 40),
            report: String(body.report ?? "").slice(0, 280),
          },
        ],
      ]);
      return {};
    }
    case "setPhoto": {
      const id = need();
      const url = String(body.dataUrl ?? "");
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(url)) fail("Unsupported image");
      if (url.length > 400_000) fail("Image too large");
      const cur = rows.get(`player:${id}`) ?? {};
      await db.put([
        [`photo:${id}`, url],
        [`player:${id}`, { ...cur, photoV: Date.now() }],
      ]);
      return {};
    }

    // ---------------- betting ----------------
    case "createBet": {
      const id = need();
      const market = String(body.market) as Market;
      if (!["hole", "match", "overall"].includes(market)) fail("Bad market");
      const pick = body.pick === "A" || body.pick === "B" ? (body.pick as Side) : fail("Pick a side");
      const creatorStake = round2(Number(body.creatorStake));
      const takerStake = round2(Number(body.takerStake));
      if (!(creatorStake > 0) || !(takerStake > 0) || creatorStake > 100000 || takerStake > 100000) fail("Enter both stakes");
      const bet: Bet = { id: newId(), creatorId: id, market, pick: pick!, creatorStake, takerStake, createdAt: Date.now() };
      if (market !== "overall") {
        const mv = d.byId[String(body.matchId)] ?? fail("Pick a match");
        if (!mv.match.ready) fail("That match isn't set yet");
        bet.matchId = mv.match.id;
        if (market === "hole") {
          const hole = Number(body.hole);
          if (!Number.isInteger(hole) || hole < 1 || hole > HOLES) fail("Pick a hole");
          bet.hole = hole;
        }
      } else if (!d.draft.complete) fail("Wait until the draft is done");
      if (marketOutcome(d, bet)) fail("That's already been decided");
      const side = sideLabel(s, d, market, bet.matchId, pick!);
      await db.put([
        [`bet:${bet.id}`, bet],
        activity(id, `🎟️ ${pname(s, id)} backed ${side} · ${money(creatorStake)} to win ${money(takerStake)} (${marketLabel(d, market, bet.matchId, bet.hole)})`),
      ]);
      return {};
    }
    case "acceptBet": {
      const id = need();
      const bet = rows.get(`bet:${String(body.betId)}`) as Bet | undefined;
      if (!bet || bet.cancelled) fail("Bet not found");
      if (bet!.creatorId === id) fail("You can't take your own bet");
      if (bet!.takerId) fail("Someone already took this bet");
      if (marketOutcome(d, bet!)) fail("Too late, that's been decided");
      const ok = await db.claimBet(`bet:${bet!.id}`, { ...bet, takerId: id, acceptedAt: Date.now() });
      if (!ok) fail("Someone already took this bet");
      const otherSide = sideLabel(s, d, bet!.market, bet!.matchId, bet!.pick === "A" ? "B" : "A");
      await db.put([
        activity(id, `🤝 ${pname(s, id)} took ${pname(s, bet!.creatorId)}'s bet, backing ${otherSide} · ${money(bet!.takerStake)} to win ${money(bet!.creatorStake)}`),
      ]);
      return {};
    }
    case "cancelBet": {
      const id = need();
      const bet = rows.get(`bet:${String(body.betId)}`) as Bet | undefined;
      if (!bet) fail("Bet not found");
      if (bet!.creatorId !== id) fail("Only the person who posted it can cancel");
      if (bet!.takerId) fail("Already taken, can't cancel");
      await db.put([[`bet:${bet!.id}`, { ...bet, cancelled: true }]]);
      return {};
    }
    case "markPaid": {
      const id = need();
      const from = String(body.from), to = String(body.to);
      const amount = round2(Number(body.amount));
      if (!(amount > 0)) fail("Bad amount");
      if (id !== from && id !== to && id !== ADMIN_ID) fail("Only the two people involved can mark this paid");
      const pay: Payment = { id: newId(), from, to, amount, at: Date.now(), by: id };
      await db.put([
        [`pay:${pay.id}`, pay],
        activity(id, `💸 ${pname(s, from)} paid ${pname(s, to)} ${money(amount)}`, { type: "payment", id: pay.id }),
      ]);
      return {};
    }

    default:
      fail("Unknown action");
  }
  return {};
}
