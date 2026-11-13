import { describe, expect, it } from "vitest";
import { SCENARIO_REGISTRY, isFreeScenario } from "@content/scenarioRegistry";
import { ALL_PAID, PACKS_BY_ID, STORE_PACKS } from "@content/packs";
import { COUNTRY_MODULES } from "@content/countries/all";

// Every scenario is free, or unlocked by exactly one country pack, and the
// Complete Collection covers every paid scenario. Packs derive from each
// country's registered scenarios, so a new election cannot be left out.
describe("pack coverage", () => {
  const paid = SCENARIO_REGISTRY.filter((s) => !s.free);
  const countryPackIds = new Set(COUNTRY_MODULES.map((m) => m.pack.id));

  it("registry holds every module's elections", () => {
    expect(SCENARIO_REGISTRY.length).toBe(COUNTRY_MODULES.reduce((n, m) => n + m.scenarios.length, 0));
  });

  it("every scenario is free or in exactly one country pack", () => {
    for (const s of SCENARIO_REGISTRY) {
      if (isFreeScenario(s.scenarioId)) continue;
      const hits = [...countryPackIds].filter((id) => PACKS_BY_ID[id].scenarios.includes(s.scenarioId));
      expect(hits, s.scenarioId).toEqual([s.packId]);
    }
  });

  it("each country pack holds exactly its country's paid scenarios", () => {
    for (const m of COUNTRY_MODULES) {
      const want = paid.filter((s) => s.country === m.code).map((s) => s.scenarioId).sort();
      expect([...PACKS_BY_ID[m.pack.id].scenarios].sort(), m.code).toEqual(want);
    }
  });

  it("Complete covers every paid scenario", () => {
    expect([...PACKS_BY_ID.complete.scenarios].sort()).toEqual(paid.map((s) => s.scenarioId).sort());
    expect(ALL_PAID.length).toBe(paid.length);
  });

  it("every store pack is listed and no scenario is orphaned", () => {
    const covered = new Set(STORE_PACKS.flatMap((p) => p.scenarios));
    for (const s of paid) expect(covered.has(s.scenarioId), s.scenarioId).toBe(true);
  });

  it("the ten elections added 2026-11-13 are unlocked by their country pack and Complete", () => {
    const ten = ["nz-2014", "nz-2011", "nz-2008", "in-2004", "in-1999", "es-2019nov", "es-2016", "ie-2007", "jp-2005", "it-2006"];
    for (const id of ten) {
      const meta = SCENARIO_REGISTRY.find((s) => s.scenarioId === id);
      expect(meta, id).toBeDefined();
      if (meta!.free) continue;
      expect(PACKS_BY_ID[meta!.packId!].scenarios, id).toContain(id);
      expect(PACKS_BY_ID.complete.scenarios, id).toContain(id);
    }
  });
});
