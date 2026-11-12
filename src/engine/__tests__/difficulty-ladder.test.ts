// ─────────────────────────────────────────────────────────────────────────
// DIFFICULTY LADDER: easy ≥ normal ≥ hard for the same election and side,
// and normal is a real contest (never 0% or 100% for the focused underdog)
// in a few historically close elections on every engine path. Fixed seeds
// (the gauntlet's own `${scenarioId}-${side}-${bot}-${i}`), so the numbers
// are identical on every run. Plus unit checks for the difficulty helpers.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { runGauntlet, scenarioBaseline, type GauntletRow } from "../balance/harness";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { COUNTRIES } from "@content/countries";
import {
  applyCountryAction,
  computeCountryResult,
  countryAdvanceTurn,
  createCountryGame,
  COUNTRY_HANDICAP,
  type CountryGameState,
} from "../countryGame";
import { createUkGame } from "../ukGame";
import { createGame, HANDICAP } from "../setup";
import { usLevelingTilt } from "../voteModel";
import { chiefRival, climateTilt, levelingTilt } from "../multiparty";
import { nationalPrepFactor } from "../planBonuses";
import { createRng } from "../rng";

// Contested on normal: one or more per engine path (US, UK, FPTP country,
// runoff, plurality presidency, proportional).
const CONTESTED_ON_NORMAL = ["us-2008", "uk-1970", "uk-2010", "ca-2019", "fr-2027", "br-2022", "mx-2006", "ie-2020"];
const SEEDS = 8;

let rows: GauntletRow[] = [];

describe("difficulty ladder", () => {
  beforeAll(() => {
    rows = runGauntlet({ scenarios: CONTESTED_ON_NORMAL, bots: ["focused"], seedsPerCell: SEEDS, sides: "winner-underdog" });
  }, 300_000);

  const rate = (id: string, side: string, difficulty: string) =>
    rows.find((r) => r.scenarioId === id && r.side === side && r.difficulty === difficulty)!.winRate;

  for (const id of CONTESTED_ON_NORMAL) {
    const b = scenarioBaseline(SCENARIOS_BY_ID[id]);
    for (const side of [b.underdog, b.winner]) {
      it(`${id} as ${side}: easy ≥ normal ≥ hard`, () => {
        const [easy, normal, hard] = (["easy", "normal", "hard"] as const).map((d) => rate(id, side, d));
        expect(easy, `${id}/${side} easy ${easy} < normal ${normal}`).toBeGreaterThanOrEqual(normal);
        expect(normal, `${id}/${side} normal ${normal} < hard ${hard}`).toBeGreaterThanOrEqual(hard);
      });
    }
    it(`${id}: the focused underdog (${b.underdog}) sometimes wins on normal, never always`, () => {
      const normal = rate(id, b.underdog, "normal");
      expect(normal).toBeGreaterThan(0);
      expect(normal).toBeLessThan(1);
    });
  }
});

describe("difficulty helpers", () => {
  it("chiefRival is the strongest other party at the opening", () => {
    const g = createUkGame({ election: "2024", seed: 1, playerParty: "con" });
    expect(chiefRival(g.regions, "con")).toBe("lab");
    expect(chiefRival(g.regions, "lab")).toBe("con");
    expect(chiefRival(g.regions, "ld")).toBe("lab");
  });

  it("levelingTilt is zero for the leader and grows with the gap", () => {
    const uk = (election: string, party: string) => {
      const g = createUkGame({ election, seed: 1, playerParty: party });
      return levelingTilt(g.regions, party);
    };
    expect(uk("2024", "lab")).toBe(0);
    expect(uk("2017", "lab")).toBeGreaterThan(0);
    expect(uk("2024", "con")).toBeGreaterThan(uk("2017", "lab"));
    // Tilting by that much really does make the player the largest party.
    const g = createUkGame({ election: "2017", seed: 1, playerParty: "lab" });
    expect(levelingTilt(g.regions, "lab")).toBeLessThan(0.15);
  });

  it("the US leveling tilt is zero for the winner and real for a landslide loser", () => {
    expect(usLevelingTilt(createGame({ scenario: "1984", seed: "t", playerCandidate: "rep" }), "rep")).toBe(0);
    const mondale = usLevelingTilt(createGame({ scenario: "1984", seed: "t", playerCandidate: "dem" }), "dem");
    expect(mondale).toBeGreaterThan(0.3);
    expect(mondale).toBeLessThan(1.5);
  });

  it("easy's climate closes a share of the gap and never leaves more than the residual", () => {
    const easy = COUNTRY_HANDICAP.easy;
    expect(climateTilt(easy, 0)).toBe(0);
    expect(climateTilt(easy, 0.1)).toBeCloseTo(0.06, 10);
    expect(climateTilt(easy, 1)).toBeCloseTo(1 - easy.gapResidual, 10);
    expect(climateTilt(COUNTRY_HANDICAP.normal, 0.5)).toBe(0);
    expect(climateTilt(COUNTRY_HANDICAP.hard, 0.5)).toBe(0);
    expect(HANDICAP.normal.gapShare).toBe(0);
  });

  it("normal and hard leave the opening map at the historical baseline", () => {
    for (const difficulty of ["normal", "hard"] as const) {
      const base = createCountryGame(COUNTRIES.FR, { election: "2012", seed: 1, playerParty: "rn" });
      const g = createCountryGame(COUNTRIES.FR, { election: "2012", seed: 1, playerParty: "rn", difficulty });
      expect(computeCountryResult(g, COUNTRIES.FR).voteShare).toEqual(computeCountryResult(base, COUNTRIES.FR).voteShare);
    }
  });

  it("presidential points follow the national vote", () => {
    const br = createCountryGame(COUNTRIES.BR, { election: "2022", seed: 1 });
    const r = computeCountryResult(br, COUNTRIES.BR);
    expect(r.seats.pt).toBe(51);
    expect(r.seats.dir).toBe(49);
    expect(r.largestParty).toBe("pt");
  });

  it("repeated national prep in one week lands at half strength each time", () => {
    const prep = { type: "policy_prep" };
    expect(nationalPrepFactor(prep, [])).toBe(1);
    expect(nationalPrepFactor(prep, [prep])).toBe(0.5);
    expect(nationalPrepFactor({ type: "debate_prep" }, [prep, { type: "canvass" }, { type: "issue_pivot" }])).toBe(0.25);
    expect(nationalPrepFactor({ type: "canvass" }, [prep, prep])).toBe(1);
  });

  it("an attack is scaled by the attacker's handicap, not the target's", () => {
    // On easy the player's campaigning is 1.5x and the chief rival's 0.5x. A
    // rival contrast broadcast against the player must use the rival's 0.5x.
    const delta = (difficulty: "easy" | "normal") => {
      const g: CountryGameState = createCountryGame(COUNTRIES.FR, { election: "2022", seed: 1, playerParty: "rn", difficulty });
      applyCountryAction(g, { type: "broadcast", party: "ens", spend: 1.5, mode: "contrast", targetParty: "rn" }, createRng(1));
      return g.causes.filter((c) => c.cause.includes("contrast broadcast")).reduce((s, c) => s + c.marginDelta, 0);
    };
    expect(delta("easy")).toBeCloseTo(delta("normal") * COUNTRY_HANDICAP.easy.aiPersuasion, 10);
  });

  it("a save from before this balance pass resumes and finishes", () => {
    // Old saves carry no presidential flag on regions: the game must still play out.
    let g = createCountryGame(COUNTRIES.FR, { election: "2022", seed: 3, playerParty: "rn", difficulty: "easy" });
    g = countryAdvanceTurn(g, COUNTRIES.FR, { autoResolvePlayerEvents: true });
    const old = JSON.parse(JSON.stringify(g)) as CountryGameState;
    for (const r of old.regions) delete r.proportional;
    let resumed = old;
    while (resumed.phase !== "result") resumed = countryAdvanceTurn(resumed, COUNTRIES.FR, { autoResolvePlayerEvents: true });
    const seats = Object.values(resumed.result!.seats).reduce((a, b) => a + b, 0);
    expect(seats).toBe(100);
  });
});
