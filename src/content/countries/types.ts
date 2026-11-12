// ─────────────────────────────────────────────────────────────────────────
// COUNTRY MODULES: everything specific to one country, in one place.
//
// A country module carries its registry rows (labels, difficulty, tags), its
// store pack, its landing cover and scenario art colours, its daily-challenge
// pairing, its "play next" chain and, for the shared multiparty engine, its
// CountryBundle. The shared tables (scenario registry, packs, covers, daily,
// next scenario, native export) are all derived from the registered list in
// ./index.ts, so adding a country never edits them.
//
// Shared by the client, the Node server and the native export scripts: no
// vite-only imports anywhere under content/countries.
// ─────────────────────────────────────────────────────────────────────────

import type { CountryBundle, CountryIssueDef } from "@engine/countryGame";

export type EnginePath = "us" | "uk" | "country";
export type ScenarioDifficulty = "easy" | "medium" | "hard";
export type ScenarioTag = "tide" | "challenge" | "coin-flip";

/** One playable election: becomes one SCENARIO_REGISTRY row. */
export interface CountryElectionEntry {
  /** Engine-native election id ("2025", "1974feb"). */
  electionId: string;
  /** Global id. Defaults to `${code.toLowerCase()}-${electionId}`. Never change a shipped one. */
  scenarioId?: string;
  /** Defaults to the bundle election's year (country engine only). */
  year?: number;
  /** Picker label, "2025 · Name v. Name". Defaults to the bundle election's label. */
  label?: string;
  /** One or two sentences for the picker card. */
  description: string;
  /**
   * How hard it is to flip history playing the underdog on normal difficulty,
   * from the balance gauntlet (`npx tsx scripts/balance-report.ts`).
   */
  difficulty: ScenarioDifficulty;
  tags?: ScenarioTag[];
  /**
   * Set on a row added to a country after its first release. The scenario
   * registry lists these rows after every other row, so the shipped registry
   * prefix (and the daily challenge's frozen classic pool) never moves. Keep
   * such rows newest first within the module, after the shipped rows.
   */
  addedLater?: boolean;
  /**
   * The daily challenge's two sides for this election, when the country's
   * `daily.pair` does not both stand in it (Japan 2026: the CRA replaced the
   * CDP). Both need a name in `daily.names`.
   */
  dailyPair?: [string, string];
}

export interface CountryPackDef {
  /** Store and entitlement id. Never change a shipped one. */
  id: string;
  name: string;
  description: string;
  /** USD cents, offline fallback only (the platform catalog is canonical). */
  price: number;
}

export interface NextLink {
  id: string;    // election id to continue to
  blurb: string; // "Continue the timeline: ..."
}

export interface CountryModule {
  /** Country code, upper case ("NZ"). Doubles as the registry `country`. */
  code: string;
  name: string;
  flag: string;
  engine: EnginePath;
  /** One line for the landing page country card. */
  blurb: string;
  /**
   * Landing cover photo under public/ with an entry in
   * public/images/covers/ATTRIBUTION.json. The UI copes with null (a text-led
   * card), but the completeness test requires a photo before shipping.
   */
  cover: string | null;
  /** Colours for the generated scenario art (ScenarioArt). */
  art: { a: string; b: string; glow: string };
  /** The multiparty content bundle. Required when engine is "country". */
  bundle?: CountryBundle;
  /** Registry rows in display order, newest first. */
  scenarios: CountryElectionEntry[];
  /**
   * Election ids that are free to everyone; every other row is paid and joins
   * the country's pack. Set once when the country ships and never moved: a
   * player who started a free election keeps it free when newer elections are
   * added later. When absent, the newest election (highest year, first row on
   * a tie) is the free one, so a new country always ships with a free taster.
   */
  freeElections?: string[];
  /**
   * A few words on how votes become seats, shown on the store tile ("Mixed-member proportional").
   * The words before any comma or parenthesis name the system: countries that share a
   * system must use the same words there, so the landing page counts it once.
   */
  systemLabel: string;
  /**
   * Optional line under the setup screen's tagline about how the game's
   * campaign maps onto the real one (France: six planning weeks for a
   * two-week runoff). Absent: no line.
   */
  setupNote?: string;
  /** The country's store pack. Holds every paid row of `scenarios`. */
  pack: CountryPackDef;
  /**
   * Daily challenge: the two big rivals everyone may be assigned, with the
   * short names used in "Play as ..." and share text.
   */
  daily: { pair: [string, string]; names: Record<string, string> };
  /**
   * Blurbs for "Play next" after finishing an election. The order itself is
   * derived (every election of the country, oldest first, wrapping), so this
   * never needs a new entry for a new election. A `chain` entry gives the
   * blurb shown when continuing to that election; a `map` entry gives the
   * blurb for one specific step. Elections without one get a plain
   * "Continue the timeline".
   */
  next: { chain?: NextLink[]; map?: Record<string, NextLink> };
  /** A "how this system works" entry for the native guide, if the generic ones do not cover it. */
  guide?: { title: string; body: string };
}

/** The year of a registry row: its own, or its bundle election's. */
export function rowYear(m: CountryModule, row: CountryElectionEntry): number {
  return row.year ?? m.bundle?.elections[row.electionId]?.year ?? 0;
}

/**
 * The election ids of `m` that are free to everyone: the module's explicit
 * `freeElections`, or else its newest election.
 */
export function freeElectionIds(m: CountryModule): string[] {
  if (m.freeElections) return [...m.freeElections];
  let newest: CountryElectionEntry | undefined;
  for (const row of m.scenarios) if (!newest || rowYear(m, row) > rowYear(m, newest)) newest = row;
  return newest ? [newest.electionId] : [];
}

/**
 * Build the module for a country on the shared multiparty engine. Code, name
 * and flag come from the bundle so they cannot drift apart.
 */
export function countryModule(
  bundle: CountryBundle,
  rest: Omit<CountryModule, "code" | "name" | "flag" | "engine" | "bundle">,
): CountryModule {
  return { code: bundle.id, name: bundle.label, flag: bundle.flag, engine: "country", bundle, ...rest };
}

/**
 * Moves the named generic events into every election's deck. The engine draws
 * the generic pool every week and can draw the same event again; an election's
 * deck events fire at most once a game. One-off beats, such as winning the
 * leaders' debate, belong in the deck so a campaign never shows the same
 * headline twice.
 */
export function oncePerCampaign(bundle: CountryBundle, ids: readonly string[]): CountryBundle {
  const once = bundle.events.filter((e) => ids.includes(e.id));
  const missing = ids.filter((id) => !once.some((e) => e.id === id));
  if (missing.length) throw new Error(`${bundle.id}: no generic event ${missing.join(", ")}`);
  const elections: CountryBundle["elections"] = {};
  for (const [id, election] of Object.entries(bundle.elections)) {
    elections[id] = { ...election, events: [...(election.events ?? []), ...once] };
  }
  return { ...bundle, events: bundle.events.filter((e) => !ids.includes(e.id)), elections };
}

/**
 * Gives each election its own issue list (see countries/issues/*.ts), in place.
 * Every id must have a salience entry in that election; salience entries for
 * ids not on the list are ignored by the engine. Throws on an unknown election
 * id or an issue without salience, so a typo fails at import time.
 */
export function attachElectionIssues(bundle: CountryBundle, lists: Record<string, CountryIssueDef[]>): void {
  for (const [id, issues] of Object.entries(lists)) {
    const election = bundle.elections[id];
    if (!election) throw new Error(`${bundle.id}: issues for unknown election ${id}`);
    const missing = issues.filter((i) => election.salience[i.id] === undefined).map((i) => i.id);
    if (missing.length) throw new Error(`${bundle.id} ${id}: no salience for ${missing.join(", ")}`);
    election.issues = issues;
  }
}
