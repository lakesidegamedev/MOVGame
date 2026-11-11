import type { CandidateId } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// ELECTORAL COLLEGE — per-election size and majority.
//
// The college is not always 538. Before Alaska and Hawaii joined (1959) and
// before the 23rd Amendment gave the District of Columbia electors (first used
// 1964), it was 531 (1912 to 1956) and 537 in 1960. A scenario declares its
// total and which contests cast no electoral votes; those contests are left
// out of the game entirely, so the total is simply the sum of the contests
// that remain. The majority is always floor(total / 2) + 1.
// ─────────────────────────────────────────────────────────────────────────

// The modern map: 50 states plus DC.
export const STANDARD_EV_TOTAL = 538;

// A scenario's electoral college declaration.
export interface ElectoralCollege {
  // The year's real electoral vote total (538, 537, 531, …).
  total: number;
  // Contest ids that cast no electoral votes that year. Absent contests are not
  // built into the game: not on the map, not targetable, not in the popular vote.
  absent?: string[];
}

export function evMajority(total: number): number {
  return Math.floor(total / 2) + 1;
}

// The college a list of contests forms. Falls back to the modern map when the
// list is empty (results submitted without state rows).
export function evTotalOf(contests: readonly { electoralVotes: number }[]): number {
  const total = contests.reduce((s, c) => s + c.electoralVotes, 0);
  return total > 0 ? total : STANDARD_EV_TOTAL;
}

export interface ElectoralRule {
  total: number;
  majority: number;
}

export function electoralRule(contests: readonly { electoralVotes: number }[]): ElectoralRule {
  const total = evTotalOf(contests);
  return { total, majority: evMajority(total) };
}

// Winner of the college: whoever reaches the majority. Short of that (a 269 to
// 269 tie, or 265 to 265 with an elector unpledged) there is no winner and the
// House decides.
export function electoralWinner(ev: Record<CandidateId, number>, total: number): CandidateId | "tie" {
  const majority = evMajority(total);
  return ev.dem >= majority ? "dem" : ev.rep >= majority ? "rep" : "tie";
}

// Display line for a college with no majority, e.g. "269-269" or "265-265".
export function noMajorityTally(ev: Record<CandidateId, number>): string {
  return `${ev.dem}-${ev.rep}`;
}
