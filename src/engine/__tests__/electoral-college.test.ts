import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { computeResult, projectElection } from "../voteModel";
import { electoralRule, electoralWinner, evMajority, evTotalOf, noMajorityTally } from "../electoralCollege";
import { usScoreFacts } from "../scoring";
import { ACHIEVEMENTS } from "../achievements";
import { usReveal } from "@ui/electionNight/adapters";
import { SCENARIOS, SCENARIO_IDS } from "@content/scenarios";
import type { CandidateId, GameResult, GameState } from "../types";

// A 48-state college, as in 1912 to 1956: 1960's map without Alaska and Hawaii.
function college531(seed = "ec531"): GameState {
  const game = createGame({ scenario: "1960", seed });
  game.states = game.states.filter((s) => s.id !== "AK" && s.id !== "HI");
  return game;
}

// Hand a fixed set of contests to one ticket and the rest to the other, by
// pushing every bloc hard; the result is then computed by the real model.
function forceMap(game: GameState, demIds: Set<string>): GameState {
  for (const st of game.states) {
    const lean = demIds.has(st.id) || st.aggregateOf?.some((id) => demIds.has(id)) ? 6 : -6;
    for (const b of st.blocs) b.campaignMargin = lean;
  }
  return game;
}

function fakeResult(ev: Record<CandidateId, number>, total: number): GameResult {
  return {
    electoralVotes: ev,
    winner: electoralWinner(ev, total),
    popularVote: { dem: 1, rep: 1 },
    popularShare: { dem: 0.5, rep: 0.5 },
    // One placeholder row carries any unpledged votes so the rows sum to the college.
    stateResults: [
      { stateId: "D", electoralVotes: ev.dem, demShare: 0.6, winner: "dem", margin: 20 },
      { stateId: "R", electoralVotes: ev.rep, demShare: 0.4, winner: "rep", margin: 20 },
      { stateId: "U", electoralVotes: total - ev.dem - ev.rep, demShare: 0.5, winner: "dem", margin: 0 },
    ],
    postMortem: [],
  };
}

describe("electoral college arithmetic", () => {
  it("derives the majority from the total", () => {
    expect(evMajority(538)).toBe(270);
    expect(evMajority(537)).toBe(269);
    expect(evMajority(531)).toBe(266);
  });

  it("in a 531-vote college, 266 wins and 265 does not", () => {
    expect(electoralWinner({ dem: 266, rep: 265 }, 531)).toBe("dem");
    expect(electoralWinner({ dem: 265, rep: 266 }, 531)).toBe("rep");
    // 265 to 265 with one elector unpledged: no majority, the House decides.
    expect(electoralWinner({ dem: 265, rep: 265 }, 531)).toBe("tie");
    expect(noMajorityTally({ dem: 265, rep: 265 })).toBe("265-265");
    // The modern map is unchanged.
    expect(electoralWinner({ dem: 270, rep: 268 }, 538)).toBe("dem");
    expect(electoralWinner({ dem: 269, rep: 269 }, 538)).toBe("tie");
  });

  it("an empty contest list falls back to the modern map", () => {
    expect(evTotalOf([])).toBe(538);
  });
});

describe("per-scenario electoral college", () => {
  it("every US scenario declares its college and the built map matches it", () => {
    for (const id of SCENARIO_IDS) {
      const sc = SCENARIOS[id];
      expect(sc.electoralCollege, `${id} declares electoralCollege`).toBeDefined();
      const game = createGame({ scenario: id, seed: "ec" });
      const ids = new Set(game.states.map((s) => s.id));
      for (const absent of sc.electoralCollege!.absent ?? []) expect(ids.has(absent), `${id} leaves out ${absent}`).toBe(false);
      expect(electoralRule(game.states).total, `${id} total`).toBe(sc.electoralCollege!.total);
    }
  });

  it("1960 is 537 votes: no DC, Maine 5, Nebraska 6, Alaska and Hawaii 3 each", () => {
    const game = createGame({ scenario: "1960", seed: "1960" });
    const ev = (id: string) => game.states.find((s) => s.id === id)?.electoralVotes;
    expect(game.states.some((s) => s.id === "DC")).toBe(false);
    expect(ev("ME-1")! + ev("ME-2")! + ev("ME-AL")!).toBe(5);
    expect(ev("NE-1")! + ev("NE-2")! + ev("NE-3")! + ev("NE-AL")!).toBe(6);
    expect(ev("AK")).toBe(3);
    expect(ev("HI")).toBe(3);
    expect(electoralRule(game.states)).toEqual({ total: 537, majority: 269 });
    const r = computeResult(game);
    expect(r.electoralVotes.dem + r.electoralVotes.rep).toBe(537);
    expect(r.stateResults.some((s) => s.stateId === "DC")).toBe(false);
    // Neutral 1960 still returns Kennedy.
    expect(r.winner).toBe("dem");
  });

  it("an absent contest adds nothing to the popular vote or the projection", () => {
    const withDc = createGame({ scenario: "1964", seed: "pv" });
    const dcVotes = withDc.states.find((s) => s.id === "DC")!.blocs.reduce((s, b) => s + b.size * b.turnoutPropensity * b.enthusiasm, 0);
    const rWith = computeResult(withDc);
    const noDc = createGame({ scenario: "1964", seed: "pv" });
    noDc.states = noDc.states.filter((s) => s.id !== "DC");
    const rWithout = computeResult(noDc);
    const total = (r: GameResult) => r.popularVote.dem + r.popularVote.rep;
    expect(total(rWith) - total(rWithout)).toBeCloseTo(dcVotes, 3);
    const p = projectElection(noDc);
    expect(p.ev.dem + p.ev.rep + p.tossupEv).toBe(535);
    expect(p.contests.some((c) => c.stateId === "DC")).toBe(false);
  });
});

describe("a 531-vote election end to end", () => {
  // 1912-to-1956 sized college: the model's own tally decides the winner.
  it("a 266 win is a win, with score, achievement and reveal measured from 266", () => {
    const game = college531();
    expect(electoralRule(game.states)).toEqual({ total: 531, majority: 266 });
    // Dem carries a block that sums to exactly 266 of 531.
    const demIds = new Set(["CA", "NY", "PA", "IL", "OH", "TX", "MI", "MA", "NJ", "NC", "GA", "NV"]);
    forceMap(game, demIds);
    const r = computeResult(game);
    expect(r.electoralVotes.dem + r.electoralVotes.rep).toBe(531);
    expect(r.electoralVotes.dem).toBe(266);
    expect(r.winner).toBe("dem");

    const facts = usScoreFacts(r, "dem", "normal");
    expect(facts.unitMargin).toBe(0);
    expect(facts.chamberSize).toBe(531);

    const nailbiter = ACHIEVEMENTS.find((a) => a.id === "nailbiter")!;
    expect(nailbiter.check({ result: r, game, player: "dem", difficulty: "normal" })).toBe(true);

    game.result = r;
    const reveal = usReveal(game);
    expect(reveal.totalUnits).toBe(531);
    expect(reveal.threshold).toBe(266);
    expect(reveal.noMajorityLabel).toBe("265-265: ELECTION GOES TO THE HOUSE");
    // Alaska, Hawaii and DC keep their outlines on the reveal map, drawn inert.
    expect(reveal.map?.shapes.AK).toBeUndefined();
    expect(reveal.map?.inert?.length).toBe(3);
  });

  it("265 to 265 with one elector unpledged goes to the House", () => {
    const r = fakeResult({ dem: 265, rep: 265 }, 531);
    expect(r.winner).toBe("tie");
    const facts = usScoreFacts(r, "dem", "normal", 531);
    expect(facts.unitMargin).toBe(-1);
    expect(facts.chamberSize).toBe(531);
  });

  it("a third candidate's states have no third slot: they fall to one ticket and the college still sums", () => {
    // 1968 handling: Wallace's Deep South folds into the Republican column.
    const r68 = computeResult(createGame({ scenario: "1968", seed: "wallace" }));
    for (const id of ["AL", "GA", "LA", "MS"]) {
      expect(r68.stateResults.find((s) => s.stateId === id)!.winner, `1968 ${id}`).toBe("rep");
    }
    expect(r68.electoralVotes.dem + r68.electoralVotes.rep).toBe(538);
    expect(r68.winner).toBe("rep");
  });
});
