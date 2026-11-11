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

import type { CountryBundle } from "@engine/countryGame";

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
  /** Free to everyone. Paid rows join the country's pack automatically. */
  free?: boolean;
  tags?: ScenarioTag[];
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
