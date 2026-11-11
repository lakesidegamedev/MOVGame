import { describe, it, expect } from "vitest";
import { US_NEXT_SCENARIO, UK_NEXT_SCENARIO, countryNextScenario, nextScenarioFor, chronologicalElections } from "@content/nextScenario";
import { UK_ELECTION_IDS, UK_ELECTIONS } from "@content/uk/elections";
import { SCENARIOS } from "@content/scenarios";
import { COUNTRIES, COUNTRY_MODULES } from "@content/countries";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";

describe("next-scenario retention chains", () => {
  it("every country's chain visits every election once, oldest first, and wraps", () => {
    for (const m of COUNTRY_MODULES) {
      const rows = SCENARIO_REGISTRY.filter((s) => s.country === m.code);
      if (rows.length < 2) continue;
      const first = chronologicalElections(m.code)[0]!.nativeId;
      const seen: string[] = [];
      let at = first;
      for (let step = 0; step < rows.length; step++) {
        seen.push(at);
        const next = nextScenarioFor(m.code, at);
        expect(next, `${m.code} ${at}`).toBeTruthy();
        expect(next!.blurb.length, `${m.code} ${at} blurb`).toBeGreaterThan(10);
        at = next!.id;
      }
      expect(at, `${m.code} wraps to its first election`).toBe(first);
      expect([...seen].sort(), m.code).toEqual(rows.map((r) => r.nativeId).sort());
      const years = seen.map((id) => rows.find((r) => r.nativeId === id)!.year);
      expect(years, `${m.code} chronological`).toEqual([...years].sort((a, b) => a - b));
    }
  });

  it("covers the elections the old hand-written chains skipped", () => {
    expect(countryNextScenario("CA", "2015")?.id).toBe("2019");
    expect(countryNextScenario("CA", "2019")?.id).toBe("2021");
    expect(countryNextScenario("CA", "2025")?.id).toBe("2015");
    expect(countryNextScenario("DE", "2017")?.id).toBe("2021");
    expect(countryNextScenario("DE", "2025")?.id).toBe("2017");
    expect(countryNextScenario("AU", "2019")?.id).toBe("2022");
    expect(US_NEXT_SCENARIO["1960"].id).toBe("1964");
    expect(US_NEXT_SCENARIO["2024"].id).toBe("1960");
  });

  it("keeps authored blurbs and never repeats the card title", () => {
    expect(countryNextScenario("CA", "2019")?.blurb).toBe("Continue the timeline: the pandemic snap");
    expect(US_NEXT_SCENARIO["2000"].blurb).toBe("Continue the timeline: the wartime election");
    expect(countryNextScenario("DE", "2025")?.blurb).toBe("Back to the start of the timeline");
    expect(countryNextScenario("CA", "2015")?.blurb).toBe("Continue the timeline");
  });

  it("US chain points at authored scenarios", () => {
    for (const [from, next] of Object.entries(US_NEXT_SCENARIO)) {
      expect(SCENARIOS[from], from).toBeTruthy();
      expect(SCENARIOS[next.id], next.id).toBeTruthy();
    }
  });

  it("UK chain covers every election and wraps", () => {
    for (const id of UK_ELECTION_IDS) {
      const next = UK_NEXT_SCENARIO[id];
      expect(next, id).toBeTruthy();
      expect(UK_ELECTIONS[next.id], next.id).toBeTruthy();
    }
    expect(UK_NEXT_SCENARIO["2024"].id).toBe("1951");
    expect(UK_NEXT_SCENARIO["2019"].id).toBe("2024");
    expect(UK_NEXT_SCENARIO["1974feb"].id).toBe("1974oct");
    expect(UK_NEXT_SCENARIO["1970"].id).toBe("1974feb");
  });

  it("country chains stay inside each pack", () => {
    for (const [cid, country] of Object.entries(COUNTRIES)) {
      for (const eid of Object.keys(country.elections)) {
        const next = countryNextScenario(cid, eid);
        expect(next, `${cid}/${eid}`).toBeTruthy();
        expect(country.elections[next!.id], `${cid}→${next!.id}`).toBeTruthy();
      }
    }
  });
});
