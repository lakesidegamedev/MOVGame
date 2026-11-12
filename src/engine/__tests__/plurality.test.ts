// The plurality win rule: one round, most units wins outright, no threshold
// and no coalition step (Mexico's presidency). Kotlin agreement is proven by
// apps/native/scripts/export-plurality-vectors.ts and PluralityTest.kt.
import { describe, expect, it } from "vitest";
import { computeSeatsResult, formGovernment, tallyRegion } from "@engine/multiparty";
import { multipartyScoreFacts, multipartyUnitMargin } from "@engine/scoring";
import { createCountryGame, countryAdvanceTurn, majorityFor, type CountryBundle } from "@engine/countryGame";
import { buildSchedule, type RevealUnit } from "@lib/electionReveal";
import { COUNTRIES, COUNTRY_MODULES } from "@content/countries/all";
import type { StateContest } from "@engine/types";

const PLURAL = { total: 100, threshold: 51, plurality: true };

const template = createCountryGame(COUNTRIES.CA, { seed: 1, election: "2021" }).regions[0];
function region(id: string, seats: Record<string, number>, shares: Record<string, number>): StateContest {
  const r: StateContest = structuredClone(template);
  r.id = id;
  r.seats = Object.values(seats).reduce((a, b) => a + b, 0);
  r.baselineSeats = { ...seats };
  r.seatElasticity = 1;
  const appeal = Object.fromEntries(Object.entries(shares).map(([p, v]) => [p, Math.log(v)]));
  r.blocs = [{ ...structuredClone(template.blocs[0]), size: 1000, turnoutPropensity: 0.6, enthusiasm: 1, appeal, campaignAppeal: {} }];
  r.baselineShare = tallyRegion(r).shareByParty;
  return r;
}

describe("plurality government formation", () => {
  it("the largest party wins outright far below half", () => {
    const g = formGovernment({ pan: 36, prd: 35, pri: 22, oth: 7 }, PLURAL, [], "pan");
    expect(g).toEqual({ kind: "majority", party: "pan", seats: 36 });
  });

  it("the same seats are hung or a coalition without the flag", () => {
    const g = formGovernment({ pan: 36, prd: 35, pri: 22, oth: 7 }, { total: 100, threshold: 51 }, [], "pan");
    expect(g.kind).not.toBe("majority");
  });

  it("never forms a coalition, even when a partner would clear 51", () => {
    const g = formGovernment({ a: 40, b: 30, c: 30 }, PLURAL, [], "a", () => true);
    expect(g).toEqual({ kind: "majority", party: "a", seats: 40 });
  });

  it("a near tie goes to the leader by one point", () => {
    const r = computeSeatsResult([
      region("N", { pan: 22, prd: 14, pri: 14 }, { pan: 0.44, prd: 0.28, pri: 0.28 }),
      region("S", { pan: 14, prd: 21, pri: 15 }, { pan: 0.276, prd: 0.424, pri: 0.3 }),
    ], PLURAL);
    expect(r.seats).toEqual({ pan: 36, prd: 35, pri: 29 });
    expect(r.voteShare.pan - r.voteShare.prd).toBeLessThan(0.01);
    expect(r.government).toEqual({ kind: "majority", party: "pan", seats: 36 });
    expect(r.hung).toBe(false);
  });

  it("a tie on units goes to the larger national vote", () => {
    const regions = [
      region("N", { pan: 15, prd: 10 }, { pan: 0.55, prd: 0.45 }),
      region("S", { pan: 10, prd: 15 }, { pan: 0.43, prd: 0.57 }),
    ];
    expect(computeSeatsResult(regions, PLURAL).largestParty).toBe("prd");
    // Majority systems keep their old rule: the first party with the most seats.
    expect(computeSeatsResult(regions, { total: 50, threshold: 26 }).largestParty).toBe("pan");
  });

  it("an exact tie on units and votes goes to the earlier party in result order", () => {
    const r = computeSeatsResult([region("N", { prd: 20, pan: 20, pri: 10 }, { prd: 0.4, pan: 0.4, pri: 0.2 })], PLURAL);
    expect(r.voteShare.prd).toBe(r.voteShare.pan);
    expect(r.largestParty).toBe("prd");
  });
});

describe("plurality score margin", () => {
  it("is the lead over the strongest rival", () => {
    const seats = { pan: 36, prd: 35, pri: 22, oth: 7 };
    expect(multipartyUnitMargin(seats, "pan", 51, true)).toBe(1);
    expect(multipartyUnitMargin(seats, "prd", 51, true)).toBe(-1);
    expect(multipartyUnitMargin(seats, "pri", 51, true)).toBe(-14);
    // Without the flag it is still units minus the threshold.
    expect(multipartyUnitMargin(seats, "pan", 51)).toBe(-15);
    const facts = multipartyScoreFacts({ seats, voteShare: { pan: 0.359, prd: 0.353, pri: 0.222, oth: 0.066 } }, "pan", 51, 100, "normal", true);
    expect(facts.unitMargin).toBe(1);
    expect(facts.popularMargin).toBeCloseTo(0.6, 6);
  });
});

describe("plurality election night", () => {
  const unit = (id: string, allocation: Record<string, number>, margin: number): RevealUnit => ({
    id, name: id, abbr: id, winnerId: Object.keys(allocation)[0], winnerColor: "#888", winnerShort: id,
    units: Object.values(allocation).reduce((a, b) => a + b, 0), allocation, margin,
  });

  it("projects the winner once the lead cannot be overturned", () => {
    const units = [unit("A", { pan: 20, prd: 10, pri: 10 }, 20), unit("B", { pan: 20, prd: 5, pri: 5 }, 10), unit("C", { prd: 20, pan: 10 }, 5)];
    const { projectedId, entries } = buildSchedule(units, 51, "pan");
    expect(projectedId).toBe("pan");
    // After A and B: pan 40, prd 15, 30 still out. 40 > 15 + 30 is false,
    // so the call waits for C even though pan never trails.
    expect(entries.find((e) => e.projectedId)?.unit?.id).toBe("C");
    // A bigger lead clinches before the last call.
    const early = [unit("A", { pan: 31, prd: 9 }, 20), unit("B", { pan: 20, prd: 10 }, 10), unit("C", { prd: 20, pan: 10 }, 5)];
    // After A and B: pan 51, prd 19, 30 still out. 51 > 49 clinches on B.
    expect(buildSchedule(early, 101, "pan").entries.find((e) => e.projectedId)?.unit?.id).toBe("B");
  });

  it("projects a tie-break winner on the last call", () => {
    const units = [unit("A", { pan: 30, prd: 20 }, 10), unit("B", { prd: 30, pan: 20 }, 2)];
    const { projectedId, entries } = buildSchedule(units, 51, "prd");
    expect(projectedId).toBe("prd");
    const calls = entries.filter((e) => e.kind === "call");
    expect(calls[calls.length - 1]?.projectedId).toBe("prd");
  });

  it("without a plurality winner the projection waits for the threshold", () => {
    const units = [unit("A", { pan: 30, prd: 10 }, 20), unit("B", { pan: 20, prd: 10 }, 10), unit("C", { prd: 20, pan: 10 }, 5)];
    const { projectedId, entries } = buildSchedule(units, 51);
    expect(projectedId).toBe("pan");
    expect(entries.find((e) => e.projectedId)?.unit?.id).toBe("C");
  });
});

describe("plurality bundles", () => {
  it("majorityFor carries the flag only for plurality bundles", () => {
    for (const m of COUNTRY_MODULES) {
      const bundle = COUNTRIES[m.code];
      if (!bundle) continue;
      const g = createCountryGame(bundle, { seed: 3 });
      expect(majorityFor(g, bundle).plurality, m.code).toBe(bundle.plurality ? true : undefined);
    }
  });

  it("a whole campaign under the flag always ends with one outright winner", () => {
    const canada: CountryBundle = { ...COUNTRIES.CA, plurality: true };
    let g = createCountryGame(canada, { seed: "plurality", election: "2021", playerParty: "ndp" });
    for (let i = 0; i < 12 && g.phase !== "result"; i++) g = countryAdvanceTurn(g, canada, { autoResolvePlayerEvents: true });
    const r = g.result!;
    expect(r.government.kind).toBe("majority");
    expect(r.hung).toBe(false);
    expect(r.government).toEqual({ kind: "majority", party: r.largestParty, seats: r.seats[r.largestParty] });
  });
});
