// Player-facing counts and lists, derived from the registered country modules
// and the scenario registry so that copy never goes stale when a country or an
// election is added. Shared by the landing page, the store and the build (the
// index.html description is filled from here). No vite-only imports.

import { COUNTRY_MODULES } from "./countries/index";
import { SCENARIO_REGISTRY } from "./scenarioRegistry";

/**
 * The voting system a module's `systemLabel` names: the words before any
 * comma or parenthesis, lower case. "First past the post, 343 ridings" and
 * "First past the post" are one system.
 */
export function votingSystemKey(systemLabel: string): string {
  return systemLabel.split(/[,(]/)[0]!.trim().toLowerCase();
}

export const COUNTRY_COUNT = COUNTRY_MODULES.length;
export const VOTING_SYSTEM_COUNT = new Set(COUNTRY_MODULES.map((m) => votingSystemKey(m.systemLabel))).size;
export const ELECTION_COUNT = SCENARIO_REGISTRY.length;
export const FREE_ELECTION_COUNT = SCENARIO_REGISTRY.filter((s) => s.free).length;
/** Countries with at least one free election (every country has one). */
export const FREE_COUNTRY_COUNT = new Set(SCENARIO_REGISTRY.filter((s) => s.free).map((s) => s.country)).size;
export const FIRST_YEAR = Math.min(...SCENARIO_REGISTRY.map((s) => s.year));
export const LAST_YEAR = Math.max(...SCENARIO_REGISTRY.map((s) => s.year));

/** Number of elections a country has, by registry code. */
export function electionCountFor(code: string): number {
  return SCENARIO_REGISTRY.filter((s) => s.country === code).length;
}

/** The earliest election year a country has, or undefined. */
export function firstYearFor(code: string): number | undefined {
  const years = SCENARIO_REGISTRY.filter((s) => s.country === code).map((s) => s.year);
  return years.length ? Math.min(...years) : undefined;
}

/** "a, b, and c" (Oxford comma, as elsewhere in the copy). */
export function joinList(items: readonly string[]): string {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** A country's name as it reads mid-sentence ("the UK"). */
export function countryInSentence(code: string, name: string): string {
  return code === "UK" ? "the UK" : code === "US" ? "the US" : name;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** Small counts as words ("two"), larger ones as digits, per the house style. */
export function countWord(n: number, capitalize = false): string {
  const w = WORDS[n] ?? String(n);
  return capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
