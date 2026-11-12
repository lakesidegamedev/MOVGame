import { describe, expect, it } from "vitest";
import { countryAdvanceTurn, createCountryGame, type CountryBundle } from "@engine/countryGame";
import { COUNTRY_MODULES } from "@content/countries";
import { oncePerCampaign } from "@content/countries/types";

// The engine draws a country's generic events every week and may draw one
// again; election-deck events fire at most once a game. One-off beats such
// as a debate win live in every election's deck (oncePerCampaign).

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
  it("oncePerCampaign moves generic events into every deck", () => {
    const mx = bundles.find((b) => b.id === "MX")!;
    expect(mx.events.some((e) => e.id === "debate_mx")).toBe(false);
    for (const e of Object.values(mx.elections)) expect(e.events?.some((x) => x.id === "debate_mx")).toBe(true);
    expect(() => oncePerCampaign(mx, ["no_such_event"])).toThrow();
  });

  it("no debate win is left in a generic pool", () => {
    for (const b of bundles) {
      for (const e of b.events) {
        if (e.choices) continue;
        expect(/\b(wins|winner|takes|survives)\b.*\b(debate|duell)\b|\b(debate|duell)\b.*\bon points\b/i.test(e.headline), `${b.id} ${e.id}`).toBe(false);
      }
    }
  });

  it("a Mexico 2006 campaign never shows the debate win twice", () => {
    const mx = bundles.find((b) => b.id === "MX")!;
    for (let seed = 0; seed < 40; seed++) {
      const wins = headlines(mx, "2006", `debate-${seed}`).filter((h) => h.includes("wins the debate"));
      expect(wins.length, `seed ${seed}`).toBeLessThanOrEqual(1);
    }
  });
});
