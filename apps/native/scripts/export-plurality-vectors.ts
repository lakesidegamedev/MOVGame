// Plurality win rule vectors: the web engine's answers for single-round
// plurality contests (most units wins outright, no threshold, no coalition
// step), so the Kotlin engine can prove it agrees. Covers a clear plurality
// winner below half, a near tie (Mexico 2006 was decided by 0.6 points), a tie
// on units broken by national vote share, an exact tie broken by result order,
// the score margin (lead over the strongest rival), the election-night
// projection, and a full Canada 2021 campaign played under the flag.
//
// Regenerate with: npx tsx apps/native/scripts/export-plurality-vectors.ts
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COUNTRIES } from "../../../src/content/countries/all";
import { computeSeatsResult, tallyRegion } from "../../../src/engine/multiparty";
import { createCountryGame, countryAdvanceTurn, majorityFor, playablePartiesIn, type CountryBundle } from "../../../src/engine/countryGame";
import { multipartyScoreFacts } from "../../../src/engine/scoring";
import { buildSchedule, type RevealUnit } from "../../../src/lib/electionReveal";
import type { StateContest } from "../../../src/engine/types";

const template = createCountryGame(COUNTRIES.CA, { seed: 1, election: "2021" }).regions[0];

// One region whose neutral seats are `seats` and whose blocs vote by `appeal`
// (logit space). The baseline share is the tally itself, so the swing is zero
// and the region returns exactly `seats`.
function region(id: string, seats: Record<string, number>, appeal: Record<string, number>): StateContest {
  const r: StateContest = structuredClone(template);
  r.id = id;
  r.name = id;
  r.abbr = id;
  r.seats = Object.values(seats).reduce((a, b) => a + b, 0);
  r.baselineSeats = { ...seats };
  r.seatElasticity = 1;
  r.blocs = [{ ...structuredClone(template.blocs[0]), size: 1000, turnoutPropensity: 0.6, enthusiasm: 1, appeal: { ...appeal }, campaignAppeal: {} }];
  r.baselineShare = tallyRegion(r).shareByParty;
  return r;
}

const ln = Math.log;
const cases: { name: string; regions: StateContest[] }[] = [
  {
    // Fox 2000 shape: the winner takes 42 points, far below half.
    name: "clear plurality below half",
    regions: [
      region("N", { pan: 24, pri: 18, prd: 8 }, { pan: ln(0.46), pri: ln(0.36), prd: ln(0.18) }),
      region("S", { pan: 18, pri: 19, prd: 13 }, { pan: ln(0.38), pri: ln(0.37), prd: ln(0.25) }),
    ],
  },
  {
    // 2006 shape: 36 to 35, decided by well under a point of the vote.
    name: "near tie",
    regions: [
      region("N", { pan: 22, prd: 14, pri: 14 }, { pan: ln(0.44), prd: ln(0.28), pri: ln(0.28) }),
      region("S", { pan: 14, prd: 21, pri: 15 }, { pan: ln(0.276), prd: ln(0.424), pri: ln(0.30) }),
    ],
  },
  {
    // Tie on units (25 each); prd has the larger national vote and wins.
    name: "units tie broken by vote share",
    regions: [
      region("N", { pan: 15, prd: 10 }, { pan: ln(0.55), prd: ln(0.45) }),
      region("S", { pan: 10, prd: 15 }, { pan: ln(0.43), prd: ln(0.57) }),
    ],
  },
  {
    // Identical units and identical votes: the earlier party in result order wins.
    name: "exact tie broken by result order",
    regions: [region("N", { prd: 20, pan: 20, pri: 10 }, { prd: ln(0.4), pan: ln(0.4), pri: ln(0.2) })],
  },
];

const units = (r: ReturnType<typeof computeSeatsResult>): RevealUnit[] =>
  r.seatResults.map((s) => ({
    id: s.contestId, name: s.name, abbr: s.contestId, winnerId: s.winner, winnerColor: "#888888", winnerShort: s.winner,
    units: s.totalSeats, allocation: s.seatsByParty, margin: 0,
  }));

const seatCases = cases.map(({ name, regions }) => {
  const total = regions.reduce((s, r) => s + (r.seats ?? 0), 0);
  const majority = { total, threshold: Math.floor(total / 2) + 1 };
  const plural = computeSeatsResult(regions, { ...majority, plurality: true });
  const strict = computeSeatsResult(regions, majority);
  const reveal = {
    title: name, totalUnits: total, threshold: majority.threshold,
    parties: Object.keys(plural.seats).map((id) => ({ id, short: id, color: "#888888" })),
    units: units(plural), playerPartyId: Object.keys(plural.seats)[0], unitLabel: "points",
    noMajorityLabel: "NO OVERALL MAJORITY: HUNG PARLIAMENT", storageKey: name, pluralityWinner: plural.largestParty,
  };
  return {
    name, regions, majority,
    plurality: { seats: plural.seats, voteShare: plural.voteShare, largestParty: plural.largestParty, hung: plural.hung, government: plural.government },
    majorityRule: { largestParty: strict.largestParty, hung: strict.hung, government: strict.government },
    facts: Object.fromEntries(Object.keys(plural.seats).map((p) => [p,
      multipartyScoreFacts(plural, p, majority.threshold, total, "normal", true)])),
    reveal,
    schedule: buildSchedule(reveal.units, reveal.threshold, reveal.pluralityWinner),
  };
});

// A whole campaign on a real bundle with the flag switched on: AI, events,
// projections and the final result all run through the plurality rule.
const canada: CountryBundle = { ...COUNTRIES.CA, plurality: true };
const games = playablePartiesIn(canada, "2021").slice(0, 3).map((party) => {
  let g = createCountryGame(canada, { seed: `plurality-${party}`, election: "2021", playerParty: party, difficulty: "normal" });
  for (let i = 0; i < 12 && g.phase !== "result"; i++) g = countryAdvanceTurn(g, canada, { autoResolvePlayerEvents: true });
  const r = g.result!;
  const maj = majorityFor(g, canada);
  return {
    country: "CA", election: "2021", party, seed: `plurality-${party}`,
    seats: r.seats, voteShare: r.voteShare, largestParty: r.largestParty, hung: r.hung, government: r.government,
    facts: multipartyScoreFacts(r, party, maj.threshold, maj.total, "normal", true),
  };
});

const text = "// Generated by apps/native/scripts/export-plurality-vectors.ts. Do not edit.\n" +
  "package com.lakesidegames.electioneer.engine\n\n" +
  "internal val PLURALITY_WEB_VECTORS = " + JSON.stringify(JSON.stringify({ seatCases, games })).replace(/\$/g, "\\$") + "\n";
const target = fileURLToPath(new URL("../shared/src/commonTest/kotlin/com/lakesidegames/electioneer/engine/PluralityWebVectors.kt", import.meta.url));
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== text) throw new Error("Plurality web vectors are stale; run npx tsx apps/native/scripts/export-plurality-vectors.ts");
} else writeFileSync(target, text);
console.log(`${process.argv.includes("--check") ? "Verified" : "Wrote"} ${seatCases.length} plurality seat cases and ${games.length} plurality campaigns.`);
