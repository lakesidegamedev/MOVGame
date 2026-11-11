import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COUNTRY_MODULES, COUNTRIES } from "@content/countries";
import type { CountryModule } from "@content/countries/types";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { PACKS, STORE_PACKS, packForScenario } from "@content/packs";
import { countryCover } from "@content/covers";
import { nextScenarioFor } from "@content/nextScenario";
import { DAILY_ROLE_PAIRS, roleShortName } from "@lib/daily";
import { SCENARIOS } from "@content/scenarios";
import { UK_ELECTIONS } from "@content/uk/elections";
import { playablePartiesIn as ukPlayable } from "@engine/ukGame";
import {
  computeCountryResult,
  countryAdvanceTurn,
  createCountryGame,
  majorityFor,
  playablePartiesIn,
  type CountryBundle,
  type Difficulty,
} from "@engine/countryGame";

// ─────────────────────────────────────────────────────────────────────────
// COUNTRY COMPLETENESS: every invariant a content author can get wrong,
// checked for every registered country and election. A new country module
// gets all of this for free; if it fails here it is not ready to ship.
// See docs/adding-a-country.md.
// ─────────────────────────────────────────────────────────────────────────

const PUBLIC_DIR = resolve(__dirname, "../../../public");
const DASHES = /[\u2013\u2014]/; // en and em dashes are not allowed in player copy
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const multiparty = COUNTRY_MODULES.filter((m) => m.engine === "country");

function electionIds(m: CountryModule): string[] {
  if (m.engine === "us") return Object.keys(SCENARIOS);
  if (m.engine === "uk") return Object.keys(UK_ELECTIONS);
  return Object.keys(m.bundle!.elections);
}

function playableFor(m: CountryModule, electionId: string): string[] {
  if (m.engine === "us") return ["dem", "rep"];
  if (m.engine === "uk") return ukPlayable(electionId);
  return playablePartiesIn(m.bundle!, electionId);
}

describe("country modules", () => {
  it("codes, pack ids and engines are unique and well formed", () => {
    const codes = COUNTRY_MODULES.map((m) => m.code);
    expect(new Set(codes).size, "unique codes").toBe(codes.length);
    const packIds = COUNTRY_MODULES.map((m) => m.pack.id);
    expect(new Set(packIds).size, "unique pack ids").toBe(packIds.length);
    for (const m of COUNTRY_MODULES) {
      expect(m.code, m.code).toMatch(/^[A-Z]{2}$/);
      expect(m.pack.id, m.code).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(["complete", "global"]).not.toContain(m.pack.id);
      expect(m.pack.price, `${m.code} price`).toBeGreaterThan(0);
      expect(m.name.length, `${m.code} name`).toBeGreaterThan(0);
      expect(m.flag.length, `${m.code} flag`).toBeGreaterThan(0);
      if (m.engine === "country") {
        expect(m.bundle, `${m.code} bundle`).toBeDefined();
        expect(m.bundle!.id, `${m.code} bundle id`).toBe(m.code);
        expect(COUNTRIES[m.code], m.code).toBe(m.bundle);
      } else {
        expect(m.bundle, `${m.code} has its own engine path`).toBeUndefined();
      }
    }
  });

  it("player copy is plain: no em or en dashes in labels, descriptions, blurbs or pack copy", () => {
    for (const m of COUNTRY_MODULES) {
      for (const text of [m.blurb, m.pack.name, m.pack.description, m.guide?.title ?? "", m.guide?.body ?? ""]) {
        expect(DASHES.test(text), `${m.code}: ${text}`).toBe(false);
      }
      for (const row of m.scenarios) expect(DASHES.test(row.description), `${m.code} ${row.electionId}`).toBe(false);
    }
    for (const s of SCENARIO_REGISTRY) expect(DASHES.test(s.label), s.scenarioId).toBe(false);
  });

  it("every country has a landing cover photo with attribution, and scenario art colours", () => {
    const attribution = JSON.parse(readFileSync(resolve(PUBLIC_DIR, "images/covers/ATTRIBUTION.json"), "utf8")) as { file: string; license: string }[];
    for (const m of COUNTRY_MODULES) {
      const cover = countryCover(m.code);
      expect(cover, `${m.code} cover`).toBeTruthy();
      expect(existsSync(resolve(PUBLIC_DIR, cover!)), `${m.code} cover ${cover}`).toBe(true);
      const credit = attribution.find((a) => `images/covers/${a.file}` === cover);
      expect(credit?.license, `${m.code} cover attribution`).toBeTruthy();
      for (const c of [m.art.a, m.art.b]) expect(c, `${m.code} art`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(m.art.glow, `${m.code} glow`).toMatch(/^rgba\(/);
    }
  });

  it("the daily pairing is two playable rivals with display names", () => {
    for (const m of COUNTRY_MODULES) {
      const [a, b] = m.daily.pair;
      expect(a, m.code).not.toBe(b);
      expect(DAILY_ROLE_PAIRS[m.code], m.code).toEqual([a, b]);
      for (const role of [a, b]) {
        expect(m.daily.names[role], `${m.code} name for ${role}`).toBeTruthy();
        // Role ids are shared across countries: a reused id must mean the same thing.
        expect(roleShortName(role), `${m.code} ${role} name collides with another country`).toBe(m.daily.names[role]);
      }
      for (const row of m.scenarios) {
        const playable = playableFor(m, row.electionId);
        for (const role of [a, b]) expect(playable, `${m.code} ${row.electionId} daily role ${role}`).toContain(role);
      }
    }
  });
});

describe("registry rows", () => {
  it("every election in content has exactly one registry row and every row resolves to content", () => {
    for (const m of COUNTRY_MODULES) {
      const rows = m.scenarios.map((r) => r.electionId);
      expect(new Set(rows).size, `${m.code} duplicate rows`).toBe(rows.length);
      expect([...rows].sort(), `${m.code} rows vs content`).toEqual([...electionIds(m)].sort());
    }
  });

  it("every row has a label, year, difficulty, pack (if paid) and a play-next link", () => {
    for (const s of SCENARIO_REGISTRY) {
      expect(s.label, s.scenarioId).toMatch(/^\d{4}( \([A-Za-z]+\))? · \S/);
      expect(s.label.startsWith(String(s.year)), `${s.scenarioId} label year`).toBe(true);
      expect(s.year, s.scenarioId).toBeGreaterThan(1900);
      expect(["easy", "medium", "hard"]).toContain(s.difficulty);
      expect(s.description.length, s.scenarioId).toBeGreaterThan(20);
      if (!s.free) {
        expect(s.packId, s.scenarioId).toBeTruthy();
        expect(PACKS.find((p) => p.id === s.packId)?.scenarios, s.scenarioId).toContain(s.scenarioId);
        expect(packForScenario(s.scenarioId)?.id, s.scenarioId).toBe(s.packId);
      }
    }
  });

  it("play-next links stay inside the country and point at real elections", () => {
    for (const m of multiparty) {
      for (const row of m.scenarios) {
        const next = nextScenarioFor(m.code, row.electionId);
        expect(next, `${m.code} ${row.electionId}`).toBeTruthy();
        expect(m.bundle!.elections[next!.id], `${m.code} -> ${next!.id}`).toBeDefined();
        expect(SCENARIOS_BY_ID[`${m.code.toLowerCase()}-${next!.id}`], `${m.code} -> ${next!.id} registry`).toBeDefined();
      }
    }
  });

  it("every country pack is on sale and holds exactly that country's paid rows", () => {
    for (const m of COUNTRY_MODULES) {
      const pack = STORE_PACKS.find((p) => p.id === m.pack.id);
      expect(pack, m.code).toBeDefined();
      const paid = SCENARIO_REGISTRY.filter((s) => s.country === m.code && !s.free).map((s) => s.scenarioId);
      expect(pack!.scenarios, m.code).toEqual(paid);
    }
  });
});

// ── Multiparty content: the invariants that keep a bundle honest ─────────
function partyIds(c: CountryBundle): Set<string> {
  return new Set(c.system.parties.map((p) => p.id));
}

describe.each(multiparty.map((m) => [m.code, m.bundle!] as const))("%s content", (code, country) => {
  const parties = partyIds(country);
  const blocIds = new Set(country.blocs.map((b) => b.id));
  const issueIds = new Set(country.issues.map((i) => i.id));
  const regionIds = new Set(country.regions.map((r) => r.id));

  it("bundle-level references resolve", () => {
    expect(parties.size, "unique party ids").toBe(country.system.parties.length);
    expect(regionIds.size, "unique region ids").toBe(country.regions.length);
    for (const p of [...country.playable, ...country.abstaining]) expect(parties.has(p), `party ${p}`).toBe(true);
    for (const b of country.blocs) for (const p of Object.keys(b.tilt)) expect(parties.has(p), `bloc ${b.id} tilt ${p}`).toBe(true);
    for (const r of country.regions) {
      for (const b of Object.keys(r.profile ?? {})) expect(blocIds.has(b), `region ${r.id} profile ${b}`).toBe(true);
      expect(r.electorate, `region ${r.id} electorate`).toBeGreaterThan(0);
    }
    const rules = country.coalitions;
    const ruled = [...(rules?.isolated ?? []), ...(rules?.forbidden ?? []).flat(),
      ...Object.keys(rules?.onlyWith ?? {}), ...Object.values(rules?.onlyWith ?? {}).flat()];
    for (const p of ruled) expect(parties.has(p), `coalition rule party ${p}`).toBe(true);
    for (const e of country.events) if (e.party) expect(parties.has(e.party), `event ${e.id} party`).toBe(true);
    expect(country.system.majority.threshold).toBe(Math.floor(country.system.majority.total / 2) + 1);
  });

  it("text templates use only placeholders the engines fill", () => {
    // Both engines fill these keys per government kind and leave anything else
    // in the text. Kotlin reads the same templates from the exported bundle.
    const allowed: Record<string, string[]> = {
      majority: ["party", "seats"], minority: ["party", "seats"], coalition: ["parties", "seats"],
      confidence_supply: ["lead", "partner", "seats"], hung: ["largest"],
    };
    for (const [kind, template] of Object.entries(country.governmentText ?? {})) {
      expect(allowed[kind], `governmentText kind ${kind}`).toBeDefined();
      for (const [, key] of template!.matchAll(/\{(\w+)\}/g)) {
        expect(allowed[kind], `governmentText.${kind} uses {${key}}`).toContain(key);
      }
    }
    for (const [, key] of (country.goalHint ?? "").matchAll(/\{(\w+)\}/g)) {
      expect(["majority", "total"], `goalHint uses {${key}}`).toContain(key);
    }
    // Headlines are filled with a single replace, which only swaps the first {party}.
    const events = [...country.events, ...Object.values(country.elections).flatMap((e) => e.events ?? [])];
    for (const e of events) {
      expect(e.headline.split("{party}").length, `event ${e.id} uses {party} more than once`).toBeLessThanOrEqual(2);
    }
  });

  it("every region has a map shape and a unique tile", () => {
    expect(country.map, "map").toBeDefined();
    const tiles = new Set<string>();
    for (const r of country.regions) {
      const shape = country.map!.shapes[r.id];
      expect(shape, `map shape ${r.id}`).toBeDefined();
      expect(shape.d.length, `${r.id} path`).toBeGreaterThan(10);
      expect(/^[MLZmlz0-9.,\s-]+$/.test(shape.d), `${r.id} path uses only M/L/Z commands (native parser)`).toBe(true);
      const tile = `${r.tile.row}:${r.tile.col}`;
      expect(tiles.has(tile), `tile ${tile} reused by ${r.id}`).toBe(false);
      tiles.add(tile);
    }
    for (const id of Object.keys(country.map!.shapes)) expect(regionIds.has(id), `stray map shape ${id}`).toBe(true);
  });

  for (const [eid, election] of Object.entries(country.elections)) {
    describe(`${code} ${eid}`, () => {
      it("regional seats sum to the chamber and vote shares sum to about 1", () => {
        expect(election.id).toBe(eid);
        const majority = election.majority ?? country.system.majority;
        expect(majority.threshold, "threshold").toBe(Math.floor(majority.total / 2) + 1);
        let total = 0;
        for (const [rid, res] of Object.entries(election.regions)) {
          expect(regionIds.has(rid), `region meta ${rid}`).toBe(true);
          const share = Object.values(res.v).reduce((s, x) => s + x, 0);
          expect(Math.abs(share - 1), `${rid} vote shares sum ${share.toFixed(3)}`).toBeLessThan(0.02);
          for (const p of [...Object.keys(res.v), ...Object.keys(res.s)]) expect(parties.has(p), `${rid} party ${p}`).toBe(true);
          for (const p of Object.keys(res.s)) expect(res.v[p], `${rid}: ${p} wins seats with no votes`).toBeGreaterThan(0);
          for (const s of Object.values(res.s)) expect(Number.isInteger(s) && s >= 0, `${rid} seats`).toBe(true);
          total += Object.values(res.s).reduce((s, x) => s + x, 0);
        }
        expect(total, "seats sum to the chamber").toBe(majority.total);
        expect(Object.keys(election.regions).length, "every region has results").toBe(country.regions.length);
      });

      it("has salience, a story-beat deck and leaders for every playable party", () => {
        expect(Object.keys(election.salience).length, "salience").toBeGreaterThan(0);
        for (const i of Object.keys(election.salience)) expect(issueIds.has(i), `salience issue ${i}`).toBe(true);
        for (const p of Object.keys(election.campaignPower ?? {})) expect(parties.has(p), `campaignPower ${p}`).toBe(true);
        const deck = election.events ?? [];
        expect(deck.length, "deck size").toBeGreaterThanOrEqual(5);
        expect(deck.some((e) => e.turn !== undefined), "scheduled beats").toBe(true);
        expect(new Set(deck.map((e) => e.id)).size, "deck ids unique").toBe(deck.length);
        for (const e of deck) {
          if (e.turn !== undefined) expect(e.turn, `${e.id} turn`).toBeLessThan(6);
          if (e.party) expect(parties.has(e.party), `${e.id} pinned party`).toBe(true);
          expect(DASHES.test(e.headline), `${e.id} headline dash`).toBe(false);
        }
        const playable = playablePartiesIn(country, eid);
        expect(playable.length, "playable parties").toBeGreaterThanOrEqual(2);
        for (const p of playable) {
          const leader = country.leaders[eid]?.[p];
          expect(leader, `leader for ${p}`).toBeDefined();
          expect(leader!.partyId, `leader ${p} partyId`).toBe(p);
        }
        for (const p of Object.keys(country.leaders[eid] ?? {})) expect(parties.has(p), `leader party ${p}`).toBe(true);
        expect(DASHES.test(election.tagline), "tagline dash").toBe(false);
      });

      it("neutral play lands within tolerance of the historical seats", () => {
        let g = createCountryGame(country, { election: eid, seed: 42 });
        for (let t = 0; t < g.totalTurns; t++) g = countryAdvanceTurn(g, country, { disableAi: true });
        const result = g.result ?? computeCountryResult(g, country);
        const expected: Record<string, number> = {};
        for (const res of Object.values(election.regions)) {
          for (const [p, s] of Object.entries(res.s)) expected[p] = (expected[p] ?? 0) + s;
        }
        for (const [p, s] of Object.entries(expected)) {
          expect(Math.abs((result.seats[p] ?? 0) - s), `${p}: got ${result.seats[p]}, real ${s}`).toBeLessThanOrEqual(2);
        }
        expect(Object.values(result.seats).reduce((a, b) => a + b, 0)).toBe(majorityFor(g, country).total);
      });

      it("every playable party runs to completion on every difficulty", () => {
        for (const party of playablePartiesIn(country, eid)) {
          for (const difficulty of DIFFICULTIES) {
            let g = createCountryGame(country, { election: eid, playerParty: party, difficulty, seed: `complete-${party}-${difficulty}` });
            expect(g.playerParty).toBe(party);
            for (let t = 0; t < g.totalTurns + 2 && g.phase !== "result"; t++) {
              g = countryAdvanceTurn(g, country, { autoResolvePlayerEvents: true });
            }
            expect(g.phase, `${party} ${difficulty}`).toBe("result");
            expect(g.result, `${party} ${difficulty}`).toBeDefined();
          }
        }
      });
    });
  }
});
