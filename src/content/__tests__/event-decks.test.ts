import { describe, expect, it } from "vitest";
import { countryAdvanceTurn, createCountryGame, type CountryBundle } from "@engine/countryGame";
import { COUNTRY_MODULES } from "@content/countries";

// A general event runs at most once a campaign (engine rule, see
// unfiredGenericEvents), so a one-off beat such as a debate win can sit in a
// country's generic pool without ever repeating.

const bundles = COUNTRY_MODULES.flatMap((m) => (m.bundle ? [m.bundle] : []));

/** Every headline that reached the news in one campaign, in order. */
function headlines(country: CountryBundle, election: string, seed: string): string[] {
  let g = createCountryGame(country, { election, playerParty: country.playable[0], seed });
  const seen: string[] = [];
  let last = new Set<string>();
  for (let t = 0; t < g.totalTurns + 2 && g.phase !== "result"; t++) {
    g = countryAdvanceTurn(g, country, { autoResolvePlayerEvents: true });
    for (const n of g.news) {
      const key = `${n.turn}:${n.text}`;
      if (!last.has(key)) seen.push(n.text);
    }
    last = new Set(g.news.map((n) => `${n.turn}:${n.text}`));
  }
  return seen;
}

describe("one-off campaign beats", () => {
  it("a Mexico 2006 campaign never shows the debate win twice", () => {
    const mx = bundles.find((b) => b.id === "MX")!;
    for (let seed = 0; seed < 40; seed++) {
      const wins = headlines(mx, "2006", `debate-${seed}`).filter((h) => h.includes("wins the debate"));
      expect(wins.length, `seed ${seed}`).toBeLessThanOrEqual(1);
    }
  });
});
