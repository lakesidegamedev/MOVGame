// ─────────────────────────────────────────────────────────────────────────
// CAMPAIGN SCORE — the leaderboard number. Pure and shared verbatim by the
// client (display) and the server (validation): the server recomputes the
// score from the submitted result facts and rejects submissions that don't
// reproduce it. 0–1000, from the PLAYER's perspective (losing scores low).
// ─────────────────────────────────────────────────────────────────────────

export type ScoreDifficulty = "easy" | "normal" | "hard";

export const DIFFICULTY_MULTIPLIER: Record<ScoreDifficulty, number> = {
  easy: 0.7,
  normal: 1.0,
  hard: 1.5,
};

export function clampScore(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// The facts a finished game reduces to for scoring. US games: unitMargin =
// player EV − 270 (of 538). Multiparty games: unitMargin = player seats −
// majority threshold (plurality countries: player units − top rival's units),
// normalized to the US scale by (538 / chamber size) so a
// UK majority and a US majority are worth comparable points.
export interface ScoreFacts {
  // Player's awardable units minus the outright-win threshold (may be negative).
  unitMargin: number;
  // Chamber size (538, 650, 343, 630, …) — normalizes unitMargin across systems.
  chamberSize: number;
  // Player's national vote share minus the top rival's, in points (may be negative).
  popularMargin: number;
  difficulty: ScoreDifficulty;
}

export function computeScoreFromFacts(f: ScoreFacts): number {
  const norm = f.chamberSize > 0 ? 538 / f.chamberSize : 1;
  const evScore = clampScore(f.unitMargin * norm * 3, -300, 200);
  const popScore = clampScore(f.popularMargin * 10, -100, 100);
  const mult = DIFFICULTY_MULTIPLIER[f.difficulty] ?? 1;
  return Math.round(clampScore((500 + evScore + popScore) * mult, 0, 1000));
}

// ── US path ───────────────────────────────────────────────────────────────
// Kept loose (structural) so the server can share this file without importing
// the whole engine type graph.
export interface UsResultFacts {
  electoralVotes: Record<string, number>;
  popularShare: Record<string, number>;
}

// Display and leaderboard metadata use the actual ticket-to-ticket EV gap.
// ScoreFacts.unitMargin remains distance from 270 for score calculation.
export function usOpponentEvMargin(result: UsResultFacts, player: "dem" | "rep"): number {
  const rival = player === "dem" ? "rep" : "dem";
  return (result.electoralVotes[player] ?? 0) - (result.electoralVotes[rival] ?? 0);
}

export function usScoreFacts(
  result: UsResultFacts,
  player: "dem" | "rep",
  difficulty: ScoreDifficulty,
): ScoreFacts {
  const rival = player === "dem" ? "rep" : "dem";
  return {
    unitMargin: (result.electoralVotes[player] ?? 0) - 270,
    chamberSize: 538,
    popularMargin: ((result.popularShare[player] ?? 0) - (result.popularShare[rival] ?? 0)) * 100,
    difficulty,
  };
}

// ── Multiparty path (UK + new countries) ──────────────────────────────────
export interface MultipartyResultFacts {
  seats: Record<string, number>;
  voteShare: Record<string, number>;
}

// Player's units measured against the goal. Majority systems: units minus the
// threshold. Plurality systems (no threshold): units minus the strongest
// rival's units, so finishing first by 6 points is +6 and second by 6 is -6.
export function multipartyUnitMargin(
  seats: Record<string, number>,
  player: string,
  majorityThreshold: number,
  plurality = false,
): number {
  const mine = seats[player] ?? 0;
  if (!plurality) return mine - majorityThreshold;
  const rival = Math.max(0, ...Object.keys(seats).filter((p) => p !== player).map((p) => seats[p] ?? 0));
  return mine - rival;
}

export function multipartyScoreFacts(
  result: MultipartyResultFacts,
  player: string,
  majorityThreshold: number,
  chamberSize: number,
  difficulty: ScoreDifficulty,
  plurality = false,
): ScoreFacts {
  const rivalShare = Math.max(
    0,
    ...Object.keys(result.voteShare).filter((p) => p !== player).map((p) => result.voteShare[p] ?? 0),
  );
  return {
    unitMargin: multipartyUnitMargin(result.seats, player, majorityThreshold, plurality),
    chamberSize,
    popularMargin: ((result.voteShare[player] ?? 0) - rivalShare) * 100,
    difficulty,
  };
}
