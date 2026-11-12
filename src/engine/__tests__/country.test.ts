import { describe, expect, it } from "vitest";
import { createCountryGame, countryAdvanceTurn, computeCountryResult, playablePartiesIn, regionalReach } from "../countryGame";
import { COUNTRIES } from "@content/countries/all";
import { computeScoreFromFacts, multipartyScoreFacts } from "../scoring";

describe("country bundles", () => {
  // Seat sums and neutral-play calibration for every election live in
  // src/content/__tests__/country-completeness.test.ts.

  it("known winners: LPC largest in CA-2025, Union in DE-2025, Centre wins FR-2027", () => {
    const expectWinner = (cid: string, party: string) => {
      const country = COUNTRIES[cid];
      let g = createCountryGame(country, { seed: 7 });
      for (let t = 0; t < g.totalTurns; t++) g = countryAdvanceTurn(g, country, { disableAi: true });
      expect(g.result!.largestParty, cid).toBe(party);
    };
    expectWinner("CA", "lpc");
    expectWinner("DE", "cdu");
    expectWinner("FR", "ens");
  });

  it("Germany's firewall: no government ever includes the AfD as a partner", () => {
    const country = COUNTRIES.DE;
    for (const seed of [1, 2, 3, 4, 5]) {
      let g = createCountryGame(country, { seed, playerParty: "afd" });
      // autoResolvePlayerEvents: bots/tests pick the first choice so the loop
      // never stalls on a pending decision modal.
      for (let t = 0; t < g.totalTurns + 2; t++) {
        if (g.phase === "result") break;
        g = countryAdvanceTurn(g, country, { autoResolvePlayerEvents: true });
      }
      const gov = g.result!.government;
      if (gov.kind === "coalition") expect(gov.parties).not.toContain("afd");
      if (gov.kind === "confidence_supply") expect(gov.partner).not.toBe("afd");
    }
  });

  it("a played game runs to completion and scores sanely", () => {
    const country = COUNTRIES.CA;
    let g = createCountryGame(country, { seed: 99, playerParty: "cpc" });
    expect(playablePartiesIn(country, "2025")).toContain("cpc");
    for (let t = 0; t < g.totalTurns + 2; t++) {
      if (g.phase === "result") break;
      g.queuedActions = [
        { type: "rally", party: "cpc", regionId: "ON" },
        { type: "canvass", party: "cpc", regionId: "QC" },
        { type: "fundraise", party: "cpc" },
      ];
      g = countryAdvanceTurn(g, country, { autoResolvePlayerEvents: true });
    }
    expect(g.phase).toBe("result");
    const facts = multipartyScoreFacts(g.result!, "cpc", 172, 343, "normal");
    const score = computeScoreFromFacts(facts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1000);
  });

  it("France 2022 preserves the historic opening but rewards a national RN campaign", () => {
    const country = COUNTRIES.FR;
    const opening = createCountryGame(country, { election: "2022", playerParty: "rn", seed: "fr-opening" });
    const openingResult = computeCountryResult(opening, country);
    expect(openingResult.seats.rn).toBeLessThan(51);
    expect(openingResult.voteShare.rn).toBeCloseTo(0.4145, 1);

    // A week of national contrast broadcasts and platform prep, every week.
    // It moves real votes, but repeated prep in one week lands weaker
    // (nationalPrepFactor), so it cannot flip a 17-point landslide on normal.
    let passiveWins = 0;
    let preparedWins = 0;
    let passiveShare = 0;
    let preparedShare = 0;
    for (let seed = 0; seed < 12; seed++) {
      for (const prepared of [false, true]) {
        let game = createCountryGame(country, {
          election: "2022", playerParty: "rn", difficulty: "normal", seed: `fr-probe-${seed}`,
        });
        while (game.phase !== "result") {
          if (prepared) {
            game.queuedActions = Array.from({ length: game.resources.rn.actions }, (_, action) =>
              action < 2
                ? { type: "broadcast" as const, party: "rn", spend: 0.5, mode: "contrast" as const, targetParty: "ens" }
                : { type: "policy_prep" as const, party: "rn" },
            );
          }
          game = countryAdvanceTurn(game, country, { autoResolvePlayerEvents: true });
        }
        const won = (game.result?.seats.rn ?? 0) >= 51;
        const share = (game.result?.voteShare.rn ?? 0) / 12;
        if (prepared) { preparedShare += share; if (won) preparedWins++; }
        else { passiveShare += share; if (won) passiveWins++; }
      }
    }
    expect(passiveWins).toBe(0);
    expect(preparedShare - passiveShare).toBeGreaterThan(0.03);
    expect(preparedWins).toBeLessThanOrEqual(2);
  });
});

describe("regional parties (Spain)", () => {
  const es = COUNTRIES.ES;

  it("are playable in every election they stood in, with their reach and real result", () => {
    for (const id of ["2011", "2015", "2019", "2023"]) {
      for (const p of ["erc", "ciu", "pnv", "bil"]) expect(playablePartiesIn(es, id), `${id} ${p}`).toContain(p);
    }
    expect(regionalReach(es, "2023", "erc")).toEqual({ regions: ["CAT"], seats: 48, historical: 7 });
    expect(regionalReach(es, "2011", "bil")).toMatchObject({ historical: 7 });
    expect(regionalReach(es, "2023", "bil")?.regions.sort()).toEqual(["NAV", "PV"]);
    expect(regionalReach(es, "2023", "psoe")).toBeNull();
  });

  it("are never the target of a generic random event", () => {
    const shorts = (es.regional ?? []).map((p) => es.system.parties.find((x) => x.id === p)!.shortName);
    const forbidden = new Set(es.events.filter((e) => e.role !== "player" && !e.party)
      .flatMap((e) => shorts.map((short) => e.headline.replace("{party}", short))));
    let checked = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let g = createCountryGame(es, { seed, election: "2023", playerParty: "pp" });
      for (let t = 0; t < g.totalTurns + 2 && g.phase !== "result"; t++) {
        g = countryAdvanceTurn(g, es, { autoResolvePlayerEvents: true });
        for (const n of g.news) { checked++; expect(forbidden.has(n.text), n.text).toBe(false); }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("easy difficulty and parties that stand in only some regions", () => {
  it("the easy tilt never puts a party on the ballot where it did not stand", () => {
    const es = COUNTRIES.ES;
    const g = createCountryGame(es, { seed: 3, election: "2023", playerParty: "erc", difficulty: "easy" });
    for (const r of g.regions) {
      const stands = r.baselineShare?.erc !== undefined;
      for (const b of r.blocs) if (!stands) expect((b.support as Record<string, number> | undefined)?.erc ?? 0, `${r.id}`).toBe(0);
    }
    const result = computeCountryResult(g, es);
    expect(result.seats.erc ?? 0).toBeLessThanOrEqual(48);
  });
});
