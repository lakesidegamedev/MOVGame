// ─────────────────────────────────────────────────────────────────────────
// SCENARIO REGISTRY: one row per playable election across every country.
// The registry is metadata only (free/paid, pack, difficulty, routing); the
// scenario *content* stays where each engine path already keeps it:
//   - US:  content/scenarios.ts        (nativeId = "2024", "2020", …)
//   - UK:  content/uk/elections.ts     (nativeId = "2024", "1997", …)
//   - country: content/countries/*.ts  (nativeId = election id in the bundle)
// Rows are derived from the registered country modules (content/countries),
// in registration order. Shared by the client (picker, locks) and the server
// (entitlement).
// ─────────────────────────────────────────────────────────────────────────

import { COUNTRY_MODULES } from "./countries/index";
import { freeElectionIds, type EnginePath, type ScenarioDifficulty, type ScenarioTag } from "./countries/types";

/** Country code ("US", "UK", "CA", …). Any registered module's code. */
export type CountryCode = string;
export type { EnginePath } from "./countries/types";

export interface ScenarioMeta {
  scenarioId: string;      // global id: "us-2024", "uk-1997", "ca-2025"
  country: CountryCode;
  engine: EnginePath;      // which game shell runs it
  nativeId: string;        // the id the engine path uses internally
  year: number;
  free: boolean;
  packId?: string;
  // How hard it is to rewrite this election's outcome — i.e. to flip history
  // playing the historical underdog, on normal difficulty. Data-driven, from
  // the balance gauntlet's underdog-focused win rate (docs/balance/): genuine
  // toss-ups read "easy" (winnable from either side), decisive landslides read
  // "hard" (you're fighting the tide). Regenerate with scripts/balance-report.
  difficulty: ScenarioDifficulty;
  label: string;
  description: string;
  flag: string;
  // Optional player-facing tags for setup / landing.
  // "tide" = historical landslide (flip-history fantasy is a challenge).
  // "challenge" = minor-party / kingmaker path, not tuned for majority wins.
  tags?: ScenarioTag[];
  // The daily's two sides when they differ from the country's pair.
  dailyPair?: [string, string];
}

/** Landslide / known-unwinnable years — surface a "historical tide" warning. */
export const TIDE_SCENARIO_IDS = new Set([
  "us-1984", "us-1972", "us-1964", "us-1936",
  "uk-1983", "uk-1997", "uk-2001", "uk-2024",
  "fr-2017",
]);

/** Genuine coin-flip years where the baseline winner is not a pushover. */
export const COIN_FLIP_SCENARIO_IDS = new Set(["uk-2017", "us-2000", "us-1960", "us-1968"]);

export function scenarioTags(meta: ScenarioMeta): Array<"tide" | "challenge" | "coin-flip"> {
  if (meta.tags) return meta.tags;
  const tags: Array<"tide" | "challenge" | "coin-flip"> = [];
  if (TIDE_SCENARIO_IDS.has(meta.scenarioId) || meta.difficulty === "hard") {
    // Only stamp "tide" on the most extreme landslides, not every hard year.
    if (TIDE_SCENARIO_IDS.has(meta.scenarioId)) tags.push("tide");
  }
  if (COIN_FLIP_SCENARIO_IDS.has(meta.scenarioId)) tags.push("coin-flip");
  return tags;
}

export function tideBlurb(meta: ScenarioMeta): string | null {
  const tags = scenarioTags(meta);
  if (tags.includes("tide")) {
    return "Historical tide: flipping this election is a challenge even on Easy. Fight the map, or enjoy the ride.";
  }
  if (tags.includes("coin-flip")) {
    return "Coin-flip election. The baseline is a near-tie and either side can win.";
  }
  return null;
}

// Rows flagged `addedLater` (elections added to a country after it shipped)
// are listed after every other row, in module order, so the shipped prefix of
// the registry never shifts.
const REGISTRY_ROWS = COUNTRY_MODULES.flatMap((m) => m.scenarios.map((row) => ({ m, row })));

// Every country has a free taster: the module's `freeElections`, or its newest
// election when it names none (countries/types.ts). Free rows have no pack.
const FREE_IDS = new Map(COUNTRY_MODULES.map((m) => [m.code, new Set(freeElectionIds(m))]));

export const SCENARIO_REGISTRY: ScenarioMeta[] = [
  ...REGISTRY_ROWS.filter(({ row }) => !row.addedLater),
  ...REGISTRY_ROWS.filter(({ row }) => row.addedLater),
].map(({ m, row }): ScenarioMeta => {
  const free = FREE_IDS.get(m.code)!.has(row.electionId);
  const meta: ScenarioMeta = {
    scenarioId: row.scenarioId ?? `${m.code.toLowerCase()}-${row.electionId}`,
    country: m.code,
    engine: m.engine,
    nativeId: row.electionId,
    year: row.year,
    free,
    packId: free ? undefined : m.pack.id,
    difficulty: row.difficulty,
    label: row.label,
    description: row.description,
    flag: m.flag,
  };
  if (row.tags) meta.tags = [...row.tags];
  if (row.dailyPair) meta.dailyPair = [row.dailyPair[0], row.dailyPair[1]];
  return meta;
});

export const SCENARIOS_BY_ID: Record<string, ScenarioMeta> = Object.fromEntries(
  SCENARIO_REGISTRY.map((s) => [s.scenarioId, s]),
);

export const FREE_SCENARIO_IDS = SCENARIO_REGISTRY.filter((s) => s.free).map((s) => s.scenarioId);

// Master paywall switch, shared by the client (locks, copy) and the server
// (entitlement checks). While false, every scenario is playable by everyone;
// the packs/activation machinery stays intact so flipping this back on
// restores the paid tiers without further changes.
//
// ON: one election per country (two for the US) and the daily challenge are
// free; every other scenario needs its country bundle or the Complete
// Collection.
export const PAYWALL_ENABLED = true;

export function isFreeScenario(scenarioId: string): boolean {
  const meta = SCENARIOS_BY_ID[scenarioId];
  if (!meta) return false; // unknown ids stay locked (leaderboard rejects them)
  if (!PAYWALL_ENABLED) return true;
  return meta.free;
}
