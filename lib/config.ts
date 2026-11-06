import type { TeamId } from "./types";

// ---- Edit these to change the weekend setup ----

export const APP_NAME = "The Rich River Cup";

export const PLAYERS: { id: string; name: string }[] = [
  { id: "luke", name: "Luke" },
  { id: "gossy", name: "Gossy" },
  { id: "sandrs", name: "Sandrs" },
  { id: "locky", name: "Locky" },
  { id: "sam", name: "Sam" },
  { id: "olly", name: "Olly" },
  { id: "connor", name: "Connor" },
  { id: "james", name: "James" },
];

/** Team A is Luke's team, Team B is Gossy's team. */
export const CAPTAINS: Record<TeamId, string> = { A: "luke", B: "gossy" };

/** The one player who can reset PINs and reset the draft. */
export const ADMIN_ID = "luke";

/** Gossy (B) picks first, then alternate. */
export const DRAFT_ORDER: TeamId[] = ["B", "A", "B", "A", "B", "A"];

export const HOLES = 18;

/** Team points per hole won, by day. Day 1 is the scramble (2 matches), Day 2 is singles (4 matches). */
export const POINTS: Record<1 | 2, number> = { 1: 2, 2: 1 };

/** Individual (Leaders) points per hole won, both days. In the scramble, both partners get it. */
export const INDIVIDUAL_POINTS = 1;

export const DEFAULT_TEAM_NAMES: Record<TeamId, string> = {
  A: "Team Luke",
  B: "Team Gossy",
};

/** What every player has at risk in the $50 deal. */
export const STAKE_EACH = 50;

/** Per-hole probabilities used by the live odds model (no handicaps). */
export const ODDS_MODEL = { win: 0.38, halve: 0.24 };
