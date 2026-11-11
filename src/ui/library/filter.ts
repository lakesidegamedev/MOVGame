import type { ScenarioMeta } from "@content/scenarioRegistry";
import { COUNTRY_MODULES_BY_CODE } from "@content/countries";

// Pure filtering and grouping for the election library. Kept free of React
// so it can be tested directly and so it scales to any number of countries.

export type AccessFilter = "all" | "owned" | "locked";
export type DifficultyFilter = "all" | ScenarioMeta["difficulty"];

export interface LibraryFilters {
  query: string;
  country: string | null;
  access: AccessFilter;
  difficulty: DifficultyFilter;
  era: string; // "all" or an era id from erasFor()
}

export const EMPTY_FILTERS: LibraryFilters = { query: "", country: null, access: "all", difficulty: "all", era: "all" };

// Country names and the one-line voting system blurb come from the registered
// country modules, so a new country needs nothing here. An unregistered code
// falls back to the browser's region name, then the code.
export function countryBlurb(code: string): string | undefined {
  return COUNTRY_MODULES_BY_CODE[code]?.blurb;
}

export function countryName(code: string): string {
  const known = COUNTRY_MODULES_BY_CODE[code]?.name;
  if (known) return known;
  try {
    const region = code === "UK" ? "GB" : code;
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(region);
    if (name && name !== region) return name;
  } catch {
    /* Intl.DisplayNames unavailable */
  }
  return code;
}

export interface Era {
  id: string;
  label: string;
  from: number;
  to: number;
}

// Eras are derived from the years present: one per decade from 1980 on, and
// everything earlier grouped together. Only eras with elections are returned.
export function erasFor(rows: readonly ScenarioMeta[]): Era[] {
  const decades = new Set<number>();
  let early = false;
  for (const r of rows) {
    if (r.year < 1980) early = true;
    else decades.add(Math.floor(r.year / 10) * 10);
  }
  const eras: Era[] = [];
  if (early) eras.push({ id: "pre1980", label: "Before 1980", from: 0, to: 1979 });
  for (const d of [...decades].sort((a, b) => a - b)) eras.push({ id: `${d}s`, label: `${d}s`, from: d, to: d + 9 });
  return eras;
}

function matchesQuery(s: ScenarioMeta, q: string): boolean {
  if (!q) return true;
  return [s.label, s.description, String(s.year), countryName(s.country), s.country, s.difficulty]
    .some((value) => value.toLowerCase().includes(q));
}

export function filterScenarios(
  rows: readonly ScenarioMeta[],
  f: LibraryFilters,
  canPlay: (scenarioId: string) => boolean,
): ScenarioMeta[] {
  const q = f.query.trim().toLowerCase();
  const era = f.era === "all" ? null : erasFor(rows).find((e) => e.id === f.era) ?? null;
  return rows.filter((s) => {
    if (f.country && s.country !== f.country) return false;
    if (f.difficulty !== "all" && s.difficulty !== f.difficulty) return false;
    if (era && (s.year < era.from || s.year > era.to)) return false;
    if (f.access === "owned" && !canPlay(s.scenarioId)) return false;
    if (f.access === "locked" && canPlay(s.scenarioId)) return false;
    return matchesQuery(s, q);
  });
}

export interface CountryGroup {
  code: string;
  name: string;
  flag: string;
  rows: ScenarioMeta[]; // newest first
  total: number;        // elections in this country before filtering
  from: number;
  to: number;
}

// Groups rows by country in registry order (the order countries were added),
// newest election first within each country.
export function groupByCountry(all: readonly ScenarioMeta[], rows: readonly ScenarioMeta[]): CountryGroup[] {
  const order: string[] = [];
  for (const s of all) if (!order.includes(s.country)) order.push(s.country);
  const groups: CountryGroup[] = [];
  for (const code of order) {
    const inCountry = all.filter((s) => s.country === code);
    const matched = rows.filter((s) => s.country === code).sort((a, b) => b.year - a.year);
    if (!matched.length) continue;
    const years = inCountry.map((s) => s.year);
    groups.push({
      code,
      name: countryName(code),
      flag: inCountry[0].flag,
      rows: matched,
      total: inCountry.length,
      from: Math.min(...years),
      to: Math.max(...years),
    });
  }
  return groups;
}

export function activeFilterCount(f: LibraryFilters): number {
  return (f.query.trim() ? 1 : 0) + (f.country ? 1 : 0) + (f.access !== "all" ? 1 : 0)
    + (f.difficulty !== "all" ? 1 : 0) + (f.era !== "all" ? 1 : 0);
}
