// Player-facing counts and lists, derived from the registered country modules
// and the scenario registry so that copy never goes stale when a country or an
// election is added. Shared by the landing page, the store, the guide and the
// build (the index.html description and the published catalog-facts.json are
// filled from here). No vite-only imports.
//
// One definition of each word, used on every surface:
//   free      an election anyone can play at any time with no purchase (the
//             registry's `free` flag). Every country has at least one; the US
//             has two. The Daily Challenge is a separate one-day pass: it is
//             never counted as a free election.
//   paid      every other election; a country's pack or the Complete
//             Collection unlocks it.
//   playable  what a player can open right now: the free elections plus the
//             ones they own. Library counts never include the Daily Challenge.
//   a country's elections   every election of that country, free ones
//             included (buying the pack opens all of them).

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
/** Elections that need a pack: everything that is not free. */
export const PAID_ELECTION_COUNT = ELECTION_COUNT - FREE_ELECTION_COUNT;
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

/**
 * The free elections in one phrase, the same on every surface:
 * "15 free elections, at least one in every country".
 */
export const FREE_ELECTIONS_LINE = FREE_COUNTRY_COUNT === COUNTRY_COUNT
  ? `${FREE_ELECTION_COUNT} free elections, at least one in every country`
  : `${FREE_ELECTION_COUNT} free elections across ${FREE_COUNTRY_COUNT} countries`;

// ── Per country and per pack ─────────────────────────────────────────────

export interface CountryFacts {
  code: string;
  name: string;
  flag: string;
  /** The country's pack id (store and entitlement id). */
  packId: string;
  /** Every election of the country, free ones included. */
  elections: number;
  /** How many of those are free to everyone. */
  free: number;
  /** How many the country's pack unlocks (elections minus free). */
  paid: number;
  firstYear: number;
  lastYear: number;
  /** The free elections' years, newest first. */
  freeYears: number[];
}

export const COUNTRY_FACTS: CountryFacts[] = COUNTRY_MODULES.map((m) => {
  const rows = SCENARIO_REGISTRY.filter((s) => s.country === m.code);
  const years = rows.map((s) => s.year);
  const free = rows.filter((s) => s.free);
  return {
    code: m.code,
    name: m.name,
    flag: m.flag,
    packId: m.pack.id,
    elections: rows.length,
    free: free.length,
    paid: rows.length - free.length,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    freeYears: free.map((s) => s.year).sort((a, b) => b - a),
  };
});

export interface CatalogPackFacts {
  id: string;
  name: string;
  /** Country codes the pack covers. */
  countries: string[];
  /** Every election of those countries, free ones included. */
  elections: number;
  /** How many of those are free to everyone anyway. */
  free: number;
  /** How many the pack unlocks. */
  paid: number;
  firstYear: number;
  lastYear: number;
}

/**
 * The counts the store and marketing copy need, as plain JSON. Published with
 * the web build as catalog-facts.json so the Lakeside store reads the same
 * numbers the game shows. Holds no prices: those belong to the platform.
 */
export interface CatalogFacts {
  game: "electioneer";
  definitions: Record<"free" | "paid" | "playable" | "elections", string>;
  totals: {
    countries: number;
    elections: number;
    free: number;
    paid: number;
    freeCountries: number;
    votingSystems: number;
    firstYear: number;
    lastYear: number;
  };
  countries: CountryFacts[];
  packs: CatalogPackFacts[];
}

export function catalogFacts(): CatalogFacts {
  const countryPacks: CatalogPackFacts[] = COUNTRY_FACTS.map((c) => ({
    id: c.packId, name: c.name, countries: [c.code],
    elections: c.elections, free: c.free, paid: c.paid, firstYear: c.firstYear, lastYear: c.lastYear,
  }));
  const complete: CatalogPackFacts = {
    id: "complete", name: "Complete Collection", countries: COUNTRY_FACTS.map((c) => c.code),
    elections: ELECTION_COUNT, free: FREE_ELECTION_COUNT, paid: PAID_ELECTION_COUNT, firstYear: FIRST_YEAR, lastYear: LAST_YEAR,
  };
  return {
    game: "electioneer",
    definitions: {
      free: "Playable by anyone at any time with no purchase. Every country has at least one. The Daily Challenge is separate and not counted.",
      paid: "Unlocked by the country's pack or the Complete Collection.",
      playable: "Free elections plus the ones the player owns.",
      elections: "Every election of the pack's countries, free ones included.",
    },
    totals: {
      countries: COUNTRY_COUNT,
      elections: ELECTION_COUNT,
      free: FREE_ELECTION_COUNT,
      paid: PAID_ELECTION_COUNT,
      freeCountries: FREE_COUNTRY_COUNT,
      votingSystems: VOTING_SYSTEM_COUNT,
      firstYear: FIRST_YEAR,
      lastYear: LAST_YEAR,
    },
    countries: COUNTRY_FACTS,
    packs: [complete, ...countryPacks],
  };
}
