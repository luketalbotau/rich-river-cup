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

/** Points per hole won, by day. */
export const POINTS: Record<1 | 2, number> = { 1: 1, 2: 2 };

export const DEFAULT_TEAM_NAMES: Record<TeamId, string> = {
  A: "Team Luke",
  B: "Team Gossy",
};

/** Per-hole probabilities used by the live odds model (no handicaps). */
export const ODDS_MODEL = { win: 0.38, halve: 0.24 };
