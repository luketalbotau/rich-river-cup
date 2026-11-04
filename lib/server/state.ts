import { CAPTAINS, DEFAULT_TEAM_NAMES, PLAYERS } from "../config";
import type { Activity, Bet, HoleResult, Pairs, Payment, Player, State, TeamId } from "../types";

/** Build the public game state from raw rows. Hides PINs and the other team's unrevealed pairs. */
export function buildState(rows: Map<string, any>, me: string | null): State {
  const players: Player[] = PLAYERS.map((p) => {
    const doc = rows.get(`player:${p.id}`) ?? {};
    const capTeam = (Object.keys(CAPTAINS) as TeamId[]).find((t) => CAPTAINS[t] === p.id) ?? null;
    return {
      id: p.id,
      name: p.name,
      captain: !!capTeam,
      team: capTeam ?? doc.team ?? null,
      pick: capTeam ? null : doc.pick ?? null,
      nickname: doc.nickname ?? "",
      report: doc.report ?? "",
      shot: doc.shot ?? "",
      photoV: doc.photoV ?? null,
      hasPin: rows.has(`pin:${p.id}`),
    };
  });

  const teams = {
    A: { id: "A" as const, name: rows.get("team:A")?.name || DEFAULT_TEAM_NAMES.A, captainId: CAPTAINS.A },
    B: { id: "B" as const, name: rows.get("team:B")?.name || DEFAULT_TEAM_NAMES.B, captainId: CAPTAINS.B },
  };

  const rawPairs = (t: TeamId): Pairs => {
    const d = rows.get(`pairs:${t}`);
    return { p1: d?.p1 ?? null, p2: d?.p2 ?? null, locked: !!d?.locked };
  };
  const pairs = { A: rawPairs("A"), B: rawPairs("B") };
  const revealed = pairs.A.locked && pairs.B.locked;
  const myTeam = players.find((p) => p.id === me)?.team ?? null;
  if (!revealed) {
    for (const t of ["A", "B"] as TeamId[]) {
      if (t !== myTeam) pairs[t] = { p1: null, p2: null, locked: pairs[t].locked };
    }
  }

  const holes: HoleResult[] = [];
  const bets: Bet[] = [];
  const payments: Payment[] = [];
  const activity: Activity[] = [];
  for (const [key, value] of rows) {
    if (key.startsWith("hole:")) {
      const [, matchId, hole] = key.split(":");
      holes.push({ matchId, hole: Number(hole), ...value });
    } else if (key.startsWith("bet:")) bets.push(value);
    else if (key.startsWith("pay:")) payments.push(value);
    else if (key.startsWith("act:")) activity.push(value);
  }
  bets.sort((a, b) => b.createdAt - a.createdAt);
  payments.sort((a, b) => b.at - a.at);
  activity.sort((a, b) => b.at - a.at);

  return { me, players, teams, pairs, holes, bets, payments, activity: activity.slice(0, 150) };
}
