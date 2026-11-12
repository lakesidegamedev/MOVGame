import { describe, expect, it } from "vitest";
import type { ScenarioMeta } from "@content/scenarioRegistry";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { EMPTY_FILTERS, activeFilterCount, countryName, erasFor, filterScenarios, groupByCountry } from "../filter";

const row = (country: string, year: number, difficulty: ScenarioMeta["difficulty"], free = false): ScenarioMeta => ({
  scenarioId: `${country.toLowerCase()}-${year}`,
  country: country as ScenarioMeta["country"],
  engine: "country",
  nativeId: String(year),
  year,
  free,
  difficulty,
  label: `${year} · Alpha v. Beta`,
  description: `A ${country} race`,
  flag: "",
});

// Fourteen countries with eight elections each: more than the library has
// ever shipped, to prove nothing assumes a fixed country list.
const BIG = Array.from({ length: 14 }, (_, c) =>
  Array.from({ length: 8 }, (_, e) => row(`C${c}`, 1960 + e * 8, (["easy", "medium", "hard"] as const)[e % 3], c === 0 && e === 0)),
).flat();
const ownedOnlyFree = (id: string) => BIG.find((r) => r.scenarioId === id)?.free ?? false;

describe("election library filters", () => {
  it("groups any number of countries, newest first", () => {
    const groups = groupByCountry(BIG, BIG);
    expect(groups).toHaveLength(14);
    expect(groups[0].rows.map((r) => r.year)).toEqual([2016, 2008, 2000, 1992, 1984, 1976, 1968, 1960]);
    expect(groups[3]).toMatchObject({ total: 8, from: 1960, to: 2016 });
  });

  it("filters by country, difficulty, era and ownership together", () => {
    const f = { ...EMPTY_FILTERS, country: "C2", difficulty: "easy" as const };
    expect(filterScenarios(BIG, f, () => true).map((r) => r.year)).toEqual([1960, 1984, 2008]);
    const eras = erasFor(BIG);
    expect(eras[0]).toMatchObject({ id: "pre1980", label: "Before 1980" });
    expect(eras.map((e) => e.id)).toContain("2010s");
    const recent = filterScenarios(BIG, { ...EMPTY_FILTERS, era: "2000s" }, () => true);
    expect(recent.every((r) => r.year >= 2000 && r.year <= 2009)).toBe(true);
    expect(filterScenarios(BIG, { ...EMPTY_FILTERS, access: "owned" }, ownedOnlyFree)).toHaveLength(1);
    expect(filterScenarios(BIG, { ...EMPTY_FILTERS, access: "locked" }, ownedOnlyFree)).toHaveLength(BIG.length - 1);
  });

  it("searches labels, descriptions, years and country names", () => {
    const q = (query: string) => filterScenarios(SCENARIO_REGISTRY, { ...EMPTY_FILTERS, query }, () => true);
    expect(q("thatcher").length).toBeGreaterThan(0);
    expect(q("germany").every((r) => r.country === "DE")).toBe(true);
    expect(q("1992").every((r) => r.year === 1992 || r.description.includes("1992") || r.label.includes("1992"))).toBe(true);
    expect(q("no such campaign")).toHaveLength(0);
  });

  it("counts active filters and names unknown countries", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, query: " x ", era: "1990s" })).toBe(2);
    expect(countryName("UK")).toBe("United Kingdom");
    expect(countryName("NZ")).toBe("New Zealand");
    expect(countryName("C7")).toBe("C7");
  });

  it("covers every registered election exactly once when unfiltered", () => {
    const groups = groupByCountry(SCENARIO_REGISTRY, SCENARIO_REGISTRY);
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(SCENARIO_REGISTRY.length);
    expect(new Set(groups.map((g) => g.code)).size).toBe(groups.length);
  });
});
