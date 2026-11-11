import { describe, it, expect } from "vitest";
import { createGame } from "../setup";
import { computeResult } from "../voteModel";
import { electoralRule } from "../electoralCollege";

// Neutral (do-nothing) play must land on each election's real electoral map,
// with the model's documented departures (see each scenario's evNote).
const HISTORY: { id: string; dem: number; rep: number; winner: "dem" | "rep" }[] = [
  // Eisenhower 457, Stevenson 73, one Alabama elector for Walter B. Jones (the model gives Stevenson all 11).
  { id: "1956", dem: 74, rep: 457, winner: "rep" },
  // Eisenhower 442, Stevenson 89.
  { id: "1952", dem: 89, rep: 442, winner: "rep" },
  // Truman 303, Dewey 189, Thurmond 39. Thurmond's four states (38) open in the
  // Republican column (the 1968 Wallace handling); his Tennessee elector stays with Truman.
  { id: "1948", dem: 304, rep: 227, winner: "dem" },
  // Roosevelt's four elections.
  { id: "1944", dem: 432, rep: 99, winner: "dem" },
  { id: "1940", dem: 449, rep: 82, winner: "dem" },
  { id: "1936", dem: 523, rep: 8, winner: "dem" },
  { id: "1932", dem: 472, rep: 59, winner: "dem" },
];

describe("US elections before 1960", () => {
  for (const h of HISTORY) {
    it(`${h.id}: 48 states, 531 votes, neutral play reproduces the real map`, () => {
      const game = createGame({ scenario: h.id, seed: "calibration" });
      expect(electoralRule(game.states)).toEqual({ total: 531, majority: 266 });
      for (const id of ["AK", "HI", "DC"]) expect(game.states.some((s) => s.id === id), `${h.id} ${id}`).toBe(false);
      const r = computeResult(game);
      expect(r.electoralVotes).toEqual({ dem: h.dem, rep: h.rep });
      expect(r.winner).toBe(h.winner);
    });
  }

  it("1948: Thurmond's states open against Truman, the rest of the South with him", () => {
    const r = computeResult(createGame({ scenario: "1948", seed: "dixiecrat" }));
    const winner = (id: string) => r.stateResults.find((s) => s.stateId === id)!.winner;
    for (const id of ["AL", "LA", "MS", "SC"]) expect(winner(id), id).toBe("rep");
    for (const id of ["GA", "TX", "TN", "NC", "VA", "AR", "FL"]) expect(winner(id), id).toBe("dem");
    // The famous close calls go Truman's way: Ohio, California, Illinois.
    for (const id of ["OH", "CA", "IL"]) expect(winner(id), id).toBe("dem");
    // Dewey's New York, where Wallace's vote cost Truman the state.
    expect(winner("NY")).toBe("rep");
  });
});
