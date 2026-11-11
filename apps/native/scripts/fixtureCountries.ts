// Which country and election each vector exporter plays. Derived from the
// registered country modules, so a new country gets native fixtures with no
// edits here.
import { COUNTRY_MODULES } from "../../../src/content/countries/index";
import { SCENARIO_REGISTRY } from "../../../src/content/scenarioRegistry";

/** Every registered country code, in registration order. */
export const ALL_COUNTRY_CODES: string[] = COUNTRY_MODULES.map((m) => m.code);

/** Countries on the shared multiparty engine, in registration order. */
export const MULTIPARTY_COUNTRY_CODES: string[] = COUNTRY_MODULES.filter((m) => m.engine === "country").map((m) => m.code);

/** The newest election a country ships (by year, first registry row on ties). */
export function newestElection(code: string): string {
  const rows = SCENARIO_REGISTRY.filter((s) => s.country === code);
  if (rows.length === 0) throw new Error(`No elections registered for ${code}`);
  return rows.reduce((best, row) => (row.year > best.year ? row : best)).nativeId;
}

// The seat-engine fixtures were first generated with these elections. They
// stay pinned so existing vectors never change; later countries use their
// newest election. Do not edit or extend this table.
const PINNED_SEAT_FIXTURES: Record<string, string> = { UK: "2024", CA: "2021", DE: "2025", FR: "2022", AU: "2025" };

/** [country, election] for every seat-based country (UK first, then the rest). */
export function seatFixtureElections(): [string, string][] {
  return COUNTRY_MODULES.filter((m) => m.engine !== "us")
    .map((m): [string, string] => [m.code, PINNED_SEAT_FIXTURES[m.code] ?? newestElection(m.code)]);
}
