import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COUNTRY_MODULES } from "@content/countries";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { PACKS_BY_ID, STORE_PACKS } from "@content/packs";
import {
  COUNTRY_COUNT, COUNTRY_FACTS, ELECTION_COUNT, FIRST_YEAR, FREE_COUNTRY_COUNT, FREE_ELECTION_COUNT,
  FREE_ELECTIONS_LINE, LAST_YEAR, PAID_ELECTION_COUNT, VOTING_SYSTEM_COUNT, catalogFacts, countWord, joinList, votingSystemKey,
} from "@content/facts";
import { packFacts } from "@lib/storeModel";

describe("player-facing facts", () => {
  it("counts countries and elections from the registry", () => {
    expect(COUNTRY_COUNT).toBe(COUNTRY_MODULES.length);
    expect(ELECTION_COUNT).toBe(SCENARIO_REGISTRY.length);
  });

  it("counts shared voting systems once", () => {
    expect(votingSystemKey("First past the post, 343 ridings")).toBe(votingSystemKey("First past the post"));
    expect(votingSystemKey("Parallel voting (districts and lists)")).toBe("parallel voting");
    expect(VOTING_SYSTEM_COUNT).toBeLessThan(COUNTRY_COUNT);
    expect(VOTING_SYSTEM_COUNT).toBeGreaterThan(1);
  });

  it("formats lists and small numbers", () => {
    expect(joinList(["a"])).toBe("a");
    expect(joinList(["a", "b"])).toBe("a and b");
    expect(joinList(["a", "b", "c"])).toBe("a, b, and c");
    expect(countWord(2, true)).toBe("Two");
    expect(countWord(76)).toBe("76");
  });

  it("keeps hard-coded counts out of index.html", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/\b\d+ (election )?scenarios\b/);
    expect(html).toContain("__MOV_ELECTION_COUNT__");
    expect(html).not.toMatch(/\b\d+ countries\b/);
  });
});

describe("guide voting systems", () => {
  it("explains every voting system in the game once", async () => {
    const { votingSystemsGuide, VOTING_SYSTEM_NOTES, regionalPartiesGuide } = await import("@content/guide");
    const systems = votingSystemsGuide();
    expect(systems).toHaveLength(VOTING_SYSTEM_COUNT);
    for (const s of systems) expect(s.note, `note for ${s.key}`).not.toBe("");
    expect(Object.keys(VOTING_SYSTEM_NOTES).sort()).toEqual(systems.map((s) => s.key).sort());
    expect(systems.flatMap((s) => s.countries).length).toBe(COUNTRY_COUNT);
    expect(regionalPartiesGuide().map((r) => r.code)).toEqual(expect.arrayContaining(["CA", "IN", "ES"]));
  });
});

// One source for every count: the store, the landing page, the guide and the
// published catalog-facts.json all read these, so they must agree with the
// scenario registry and with each other.
describe("catalog facts", () => {
  it("counts every election once, split into free and paid", () => {
    expect(ELECTION_COUNT).toBe(SCENARIO_REGISTRY.length);
    expect(FREE_ELECTION_COUNT + PAID_ELECTION_COUNT).toBe(ELECTION_COUNT);
    expect(PAID_ELECTION_COUNT).toBe(PACKS_BY_ID.complete.scenarios.length);
    expect(COUNTRY_FACTS.reduce((n, c) => n + c.elections, 0)).toBe(ELECTION_COUNT);
    expect(COUNTRY_FACTS.reduce((n, c) => n + c.free, 0)).toBe(FREE_ELECTION_COUNT);
    expect(COUNTRY_FACTS.reduce((n, c) => n + c.paid, 0)).toBe(PAID_ELECTION_COUNT);
  });

  it("gives every country at least one free election, and the US two", () => {
    expect(COUNTRY_FACTS).toHaveLength(COUNTRY_COUNT);
    expect(FREE_COUNTRY_COUNT).toBe(COUNTRY_COUNT);
    for (const c of COUNTRY_FACTS) expect(c.free, c.code).toBeGreaterThanOrEqual(1);
    expect(COUNTRY_FACTS.find((c) => c.code === "US")!.free).toBe(2);
    expect(FREE_ELECTIONS_LINE).toBe(`${FREE_ELECTION_COUNT} free elections, at least one in every country`);
  });

  it("matches what the Store says about each pack", () => {
    for (const c of COUNTRY_FACTS) {
      const pack = PACKS_BY_ID[c.packId];
      const facts = packFacts(pack);
      expect(facts.elections.length, c.code).toBe(c.elections);
      expect(facts.freeCount, c.code).toBe(c.free);
      expect(pack.scenarios.length, c.code).toBe(c.paid);
      expect(facts.from, c.code).toBe(c.firstYear);
      expect(facts.to, c.code).toBe(c.lastYear);
    }
    const complete = packFacts(PACKS_BY_ID.complete);
    expect(complete.elections.length).toBe(ELECTION_COUNT);
    expect(complete.freeCount).toBe(FREE_ELECTION_COUNT);
  });

  it("publishes the same numbers, one row per pack on sale, and no prices", () => {
    const json = catalogFacts();
    expect(json.totals).toMatchObject({
      countries: COUNTRY_COUNT, elections: ELECTION_COUNT, free: FREE_ELECTION_COUNT, paid: PAID_ELECTION_COUNT,
      freeCountries: FREE_COUNTRY_COUNT, firstYear: FIRST_YEAR, lastYear: LAST_YEAR,
    });
    expect(json.packs.map((p) => p.id).sort()).toEqual(STORE_PACKS.map((p) => p.id).sort());
    for (const p of json.packs) expect(p.elections, p.id).toBe(p.free + p.paid);
    expect(json.countries.map((c) => c.code)).toEqual(COUNTRY_MODULES.map((m) => m.code));
    const text = JSON.stringify(json);
    expect(text).not.toMatch(/price/i);
    expect(JSON.parse(text)).toEqual(json); // plain JSON, nothing lost
  });
});
