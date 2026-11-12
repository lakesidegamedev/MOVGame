import { describe, expect, it } from "vitest";
import { createGame } from "@engine/setup";
import { resolveEvent } from "@engine/events";
import { applyAction } from "@engine/actions";
import { createRng } from "@engine/rng";
import { SCENARIOS, issueTemplateFor } from "@content/scenarios";
import { liveIssueIds } from "@content/issues";
import { toScenario, makeDefaultCustomScenario } from "@content/customScenario";
import { createCountryGame, countryGameIssues, type CountryBundle } from "@engine/countryGame";
import { COUNTRIES } from "@content/countries/all";
import { createUkGame, ukGameIssues } from "@engine/ukGame";
import { UK_ELECTIONS } from "@content/uk/elections";

// A test race that declares two issues of its own.
SCENARIOS["test-issues"] = {
  ...SCENARIOS["2020"],
  id: "test-issues",
  issueSalience: { economy: 0.9, law_and_order: 0.6, covid_response: 0 },
  issues: [
    { id: "law_and_order", name: "The War", blurb: "A war abroad." },
    { id: "economy", name: "The Slump", blurb: "Hard times." },
  ],
};

describe("per-election issues, U.S. path", () => {
  it("a game has only the issues its election declares, in axis order", () => {
    const game = createGame({ scenario: "test-issues", seed: 1 });
    expect(liveIssueIds(game)).toEqual(["economy", "law_and_order"]);
    expect(game.issues.economy).toEqual({ id: "economy", name: "The Slump", blurb: "Hard times.", baseSalience: 0.9 });
    expect(game.issues.covid_response).toBeUndefined();
    expect(game.salience.covid_response).toBe(0);
    expect(game.salience.healthcare).toBe(0);
    expect(game.salience.law_and_order).toBe(0.6);
  });

  it("an event cannot raise an issue the election does not have", () => {
    const game = createGame({ scenario: "test-issues", seed: 1 });
    game.pendingEvents.push({ eventId: "covid_spike", forCandidate: "dem" });
    resolveEvent(game, "covid_spike", "science_plan", "dem");
    expect(game.salience.covid_response).toBe(0);
    expect(game.salience.healthcare).toBe(0);
  });

  it("issue ads and pivots on an absent issue do nothing", () => {
    const game = createGame({ scenario: "test-issues", seed: 1 });
    const before = structuredClone(game);
    applyAction(game, { type: "issue_pivot", candidate: "dem", issueId: "covid_response", newPosition: 1 }, createRng(1));
    applyAction(game, { type: "advertise", candidate: "dem", stateId: "PA", adMode: "issue", issueId: "covid_response", spend: 5_000_000 }, createRng(1));
    expect(game.candidates.dem.issuePositions).toEqual(before.candidates.dem.issuePositions);
    expect(game.resources.dem.cash).toBe(before.resources.dem.cash);
    expect(game.salience).toEqual(before.salience);
  });

  it("an issue pivot logs the issue under the election's name", () => {
    const game = createGame({ scenario: "test-issues", seed: 1 });
    applyAction(game, { type: "issue_pivot", candidate: "dem", issueId: "economy", newPosition: 0.9 }, createRng(1));
    expect(game.causes.some((c) => c.cause === "Pivot on The Slump")).toBe(true);
  });

  it("Pandemic Mode adds a year-neutral pandemic issue to an election without one", () => {
    const game = createGame({ scenario: "test-issues", seed: 1, modifiers: { pandemic: true } });
    expect(liveIssueIds(game)).toEqual(["economy", "covid_response", "law_and_order"]);
    expect(game.issues.covid_response?.name).toBe("Pandemic Response");
    expect(game.salience.covid_response).toBe(0.85);
  });

  it("a custom race borrows the issues and salience of the nearest earlier election", () => {
    expect(issueTemplateFor(1971).id).toBe("1968");
    expect(issueTemplateFor(1900).id).toBe("1932");
    expect(issueTemplateFor(2100).id).toBe("2024");
    const cs = makeDefaultCustomScenario();
    cs.year = 1971;
    const scenario = toScenario(cs);
    expect(scenario.issues).toEqual(SCENARIOS["1968"].issues);
    expect(scenario.issueSalience).toEqual(SCENARIOS["1968"].issueSalience);
  });
});

describe("per-election issues, multiparty paths", () => {
  it("a country election's list sets the game's issues and names", () => {
    const base = COUNTRIES.DE;
    const [id, election] = Object.entries(base.elections)[0];
    const keys = Object.keys(election.salience);
    const country: CountryBundle = {
      ...base,
      elections: {
        ...base.elections,
        [id]: { ...election, issues: [{ id: keys[1], name: "Second", blurb: "b" }, { id: keys[0], name: "First", blurb: "a" }] },
      },
    };
    const game = createCountryGame(country, { election: id, seed: 1 });
    expect(Object.keys(game.salience)).toEqual([keys[1], keys[0]]);
    expect(countryGameIssues(country, game).map((i) => i.name)).toEqual(["Second", "First"]);
  });

  it("a UK election's list sets the game's issues and names", () => {
    const election = UK_ELECTIONS["2024"];
    const saved = election.issues;
    election.issues = [{ id: "nhs", name: "The Health Service", blurb: "Waiting lists." }];
    try {
      const game = createUkGame({ election: "2024", seed: 1 });
      expect(Object.keys(game.salience)).toEqual(["nhs"]);
      expect(ukGameIssues(game)).toEqual([{ id: "nhs", name: "The Health Service", blurb: "Waiting lists.", salience: election.salience.nhs }]);
    } finally {
      election.issues = saved;
    }
  });

  it("a save from before per-election lists keeps its own issue ids", () => {
    const country = COUNTRIES.DE;
    const game = createCountryGame(country, { seed: 1 });
    const old = { ...game, salience: { economy: 0.5, legacy_issue: 0.3 } };
    expect(countryGameIssues(country, old).map((i) => i.id)).toEqual(["economy", "legacy_issue"]);
    expect(countryGameIssues(country, old)[1].name).toBe("legacy_issue");
  });
});
