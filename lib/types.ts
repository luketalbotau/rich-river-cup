export type TeamId = "A" | "B";
export type Side = "A" | "B";
export type HoleWinner = "A" | "B" | "H";
export type Market = "hole" | "match" | "overall";

export interface Player {
  id: string;
  name: string;
  captain: boolean;
  team: TeamId | null;
  pick: number | null; // overall draft pick number 1..6
  nickname?: string;
  report?: string;
  shot?: string;
  photoV?: number | null;
  hasPin: boolean;
}

export interface Team {
  id: TeamId;
  name: string;
  captainId: string;
}

export interface Pairs {
  p1: string[] | null;
  p2: string[] | null;
  locked: boolean;
}

export interface HoleResult {
  matchId: string;
  hole: number;
  winner: HoleWinner;
  by: string;
  at: number;
}

export interface Bet {
  id: string;
  creatorId: string;
  market: Market;
  matchId?: string;
  hole?: number;
  pick: Side; // the side the creator backs
  creatorStake: number; // what the creator risks
  takerStake: number; // what the taker risks (= creator's win)
  takerId?: string;
  createdAt: number;
  acceptedAt?: number;
  cancelled?: boolean;
}

/** A stake in a pool (parimutuel) market. Winners split the losing side's money. */
export interface Stake {
  id: string;
  playerId: string;
  market: "match" | "overall";
  matchId?: string;
  side: Side;
  amount: number;
  /** amount divided by the win probability at the time, so early or underdog money earns a bigger share */
  weight: number;
  /** how many holes had been scored in this market when the stake was placed */
  holesAtBet: number;
  at: number;
  cancelled?: boolean;
}

export interface Payment {
  id: string;
  from: string;
  to: string;
  amount: number;
  at: number;
  by: string;
}

export type Undo =
  | { type: "hole"; matchId: string; hole: number; prev: HoleWinner | null }
  | { type: "payment"; id: string };

export interface Activity {
  id: string;
  at: number;
  by: string | null;
  text: string;
  undo?: Undo;
  undone?: boolean;
}

export interface State {
  me: string | null;
  players: Player[];
  teams: Record<TeamId, Team>;
  pairs: Record<TeamId, Pairs>;
  holes: HoleResult[];
  bets: Bet[];
  stakes: Stake[];
  payments: Payment[];
  activity: Activity[];
}

export interface Match {
  id: string;
  day: 1 | 2;
  title: string;
  a: string[];
  b: string[];
  ready: boolean;
}

export interface MatchSummary {
  wonA: number;
  wonB: number;
  halved: number;
  played: number;
  remaining: number;
  lead: number; // + means A ahead
  complete: boolean;
  decided: boolean;
  winner: HoleWinner | null;
  streak: { side: Side; len: number } | null;
  choke: Side | null;
  pointsA: number;
  pointsB: number;
}
