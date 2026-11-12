import { describe, expect, it } from "vitest";
import { createGame } from "@engine/setup";
import { queueEventsForTurn } from "@engine/events";
import { createRng } from "@engine/rng";
import { GENERIC_EVENTS } from "@content/events";
import { unfiredGenericEvents } from "@engine/mpTurnHelpers";
import { countryAdvanceTurn, createCountryGame, playablePartiesIn, type CountryEventDef } from "@engine/countryGame";
import { ukAdvanceTurn, createUkGame } from "@engine/ukGame";
import { COUNTRIES } from "@content/countries";
import { UK_EVENTS } from "@content/uk/events";
import { UK_ELECTION_IDS } from "@content/uk/elections";

// The headline of a generic event as it appears in the news log.
function headlinePattern(headline: string): RegExp {
  const escaped = headline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{party\\}", ".+");
  return new RegExp(`^${escaped}$`);
}

function repeatedHeadlines(news: { text: string }[], events: readonly CountryEventDef[]): string[] {
  const repeats: string[] = [];
  for (const ev of events) {
    if (ev.choices?.length) continue; // decisions may recur by design
    const pattern = headlinePattern(ev.headline);
    if (news.filter((n) => pattern.test(n.text)).length > 1) repeats.push(ev.id);
  }
  return repeats;
}

describe("general events never repeat in a campaign", () => {
  it("drops fired general events from the draw, keeps decision events", () => {
    const events = [
      { id: "a", headline: "A" },
      { id: "b", headline: "B", choices: [{}] },
      { id: "c", headline: "C" },
    ];
    expect(unfiredGenericEvents(events, new Set(["a", "b"])).map((e) => e.id)).toEqual(["b", "c"]);
    expect(unfiredGenericEvents(events, new Set(["a", "b", "c"])).map((e) => e.id)).toEqual(["b"]);
  });

  it("U.S.: a random event that already ran is never drawn again", () => {
    const fired = GENERIC_EVENTS.filter((e) => !e.oncePerGame).map((e) => e.id);
    expect(fired.length).toBeGreaterThan(0);
    for (let seed = 1; seed <= 200; seed++) {
      const game = createGame({ scenario: "2016", seed, eventMode: "plausible" });
      game.firedEventIds = fired.map((id) => `${id}:${seed % 2 ? "dem" : "rep"}`);
      game.turn = 3;
      queueEventsForTurn(game, createRng(seed));
      for (const p of game.pendingEvents) expect(fired, `seed ${seed}`).not.toContain(p.eventId);
    }
  });

  for (const [code, country] of Object.entries(COUNTRIES)) {
    it(`${code}: no general headline runs twice`, () => {
      const elections = Object.keys(country.elections);
      for (let i = 0; i < 12; i++) {
        const election = elections[i % elections.length];
        const parties = playablePartiesIn(country, election);
        let game = createCountryGame(country, { election, seed: `repeat-${code}-${i}`, playerParty: parties[i % parties.length] });
        while (game.phase !== "result") game = countryAdvanceTurn(game, country, { autoResolvePlayerEvents: true });
        expect(repeatedHeadlines(game.news, country.events), `${election} seed ${i}`).toEqual([]);
      }
    });
  }

  it("UK: no general headline runs twice", () => {
    for (let i = 0; i < 24; i++) {
      const election = UK_ELECTION_IDS[i % UK_ELECTION_IDS.length];
      let game = createUkGame({ election, seed: `repeat-uk-${i}` });
      while (game.phase !== "result") game = ukAdvanceTurn(game, { autoResolvePlayerEvents: true });
      expect(repeatedHeadlines(game.news, UK_EVENTS as CountryEventDef[]), `${election} seed ${i}`).toEqual([]);
    }
  });
});
