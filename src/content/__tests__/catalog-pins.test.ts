import { describe, expect, it } from "vitest";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { ALL_PAID, GLOBAL_ALL, PACKS, PACKS_BY_ID, STORE_PACKS, packCovered } from "@content/packs";
import { COUNTRY_MODULES } from "@content/countries";
import { coalitionAllowed, countryGovernmentText } from "@engine/countryGame";
import { COUNTRIES } from "@content/countries";
import type { Government } from "@engine/types";

// ─────────────────────────────────────────────────────────────────────────
// PINS: ids that players' saves, purchases and leaderboard rows depend on.
// These lists are frozen history. Never edit them to make a test pass; new
// countries and elections are appended after them, never inserted.
// ─────────────────────────────────────────────────────────────────────────

const PINNED_SCENARIO_IDS = [
  "us-2024", "us-2020", "us-2016", "us-2012", "us-2008", "us-2004", "us-2000", "us-1996", "us-1992",
  "us-1988", "us-1984", "us-1980", "us-1976", "us-1972", "us-1968", "us-1964", "us-1960",
  "uk-2024", "uk-2019", "uk-2017", "uk-2015", "uk-2010", "uk-2005", "uk-2001", "uk-1997", "uk-1992",
  "uk-1987", "uk-1983", "uk-1979", "uk-1974feb", "uk-1974oct", "uk-1970", "uk-1966", "uk-1964", "uk-1951",
  "ca-2025", "ca-2021", "ca-2019", "ca-2015",
  "de-2025", "de-2021", "de-2017",
  "fr-2027", "fr-2022", "fr-2017", "fr-2012",
  "au-2025", "au-2022", "au-2019",
];

// [scenarioId prefix] -> [country, engine, pack]
const PINNED_ROUTING: Record<string, [string, string, string]> = {
  us: ["US", "us", "us-historical"],
  uk: ["UK", "uk", "uk-elections"],
  ca: ["CA", "country", "canada"],
  de: ["DE", "country", "germany"],
  fr: ["FR", "country", "france"],
  au: ["AU", "country", "australia"],
};

const PINNED_PACK_MEMBERS: Record<string, string[]> = {
  "us-historical": PINNED_SCENARIO_IDS.filter((id) => id.startsWith("us-") && id !== "us-2024" && id !== "us-2020"),
  "uk-elections": PINNED_SCENARIO_IDS.filter((id) => id.startsWith("uk-")),
  canada: ["ca-2025", "ca-2021", "ca-2019", "ca-2015"],
  germany: ["de-2025", "de-2021", "de-2017"],
  france: ["fr-2027", "fr-2022", "fr-2017", "fr-2012"],
  australia: ["au-2025", "au-2022", "au-2019"],
};

const PINNED_GLOBAL = [
  "ca-2025", "ca-2021", "ca-2019", "ca-2015", "de-2025", "de-2021", "de-2017",
  "fr-2027", "fr-2022", "fr-2017", "fr-2012", "au-2025", "au-2022", "au-2019",
];

describe("pinned scenario ids", () => {
  it("every shipped scenario id exists, in its original order, ahead of anything new", () => {
    // The daily challenge hashes over the registry in order, so the shipped
    // rows must stay a stable prefix.
    expect(SCENARIO_REGISTRY.slice(0, PINNED_SCENARIO_IDS.length).map((s) => s.scenarioId)).toEqual(PINNED_SCENARIO_IDS);
  });

  it("shipped scenarios keep their country, engine, native id, pack and free flag", () => {
    for (const id of PINNED_SCENARIO_IDS) {
      const meta = SCENARIOS_BY_ID[id];
      const [country, engine, pack] = PINNED_ROUTING[id.slice(0, 2)];
      expect(meta.country, id).toBe(country);
      expect(meta.engine, id).toBe(engine);
      expect(meta.nativeId, id).toBe(id.slice(3));
      const free = id === "us-2024" || id === "us-2020";
      expect(meta.free, id).toBe(free);
      expect(meta.packId, id).toBe(free ? undefined : pack);
    }
  });

  it("scenario ids are unique across the registry", () => {
    expect(new Set(SCENARIO_REGISTRY.map((s) => s.scenarioId)).size).toBe(SCENARIO_REGISTRY.length);
  });
});

describe("pinned packs", () => {
  it("every shipped pack id still exists, and the store order is stable", () => {
    for (const id of [...Object.keys(PINNED_PACK_MEMBERS), "complete", "global"]) expect(PACKS_BY_ID[id], id).toBeDefined();
    expect(STORE_PACKS.slice(0, 6).map((p) => p.id)).toEqual(Object.keys(PINNED_PACK_MEMBERS));
    expect(STORE_PACKS[STORE_PACKS.length - 1]?.id).toBe("complete");
    expect(PACKS[PACKS.length - 1]?.id).toBe("global");
  });

  it("country packs keep every scenario they ever held, and only their own country's", () => {
    for (const [id, members] of Object.entries(PINNED_PACK_MEMBERS)) {
      const pack = PACKS_BY_ID[id];
      for (const sid of members) expect(pack.scenarios, `${id} keeps ${sid}`).toContain(sid);
      const country = SCENARIOS_BY_ID[members[0]].country;
      for (const sid of pack.scenarios) expect(SCENARIOS_BY_ID[sid]?.country, `${id} holds ${sid}`).toBe(country);
    }
  });

  it("the Complete Collection holds every paid scenario of every registered country", () => {
    const paid = SCENARIO_REGISTRY.filter((s) => !s.free).map((s) => s.scenarioId);
    expect([...PACKS_BY_ID.complete.scenarios].sort()).toEqual([...paid].sort());
    expect([...ALL_PAID].sort()).toEqual([...paid].sort());
    for (const pack of STORE_PACKS) expect(packCovered(pack.id, ["complete"]), pack.id).toBe(true);
  });

  it("the retired Global pack is frozen at its original fourteen scenarios", () => {
    // Decision: Global owners keep exactly what they bought. Elections added
    // later to Canada, Germany, France or Australia are not in Global; those
    // owners need the country pack or the Complete Collection for them.
    expect(PACKS_BY_ID.global.legacy).toBe(true);
    expect(PACKS_BY_ID.global.scenarios).toEqual(PINNED_GLOBAL);
    expect([...GLOBAL_ALL]).toEqual(PINNED_GLOBAL);
    expect(STORE_PACKS.some((p) => p.id === "global")).toBe(false);
  });
});

// The retired hand-written predicates and texts, verbatim, as fixtures for
// the declarative rules that replaced them (the Kotlin side has the twin of
// this test in CountryRulesTest.kt).
const LEGACY_COMPATIBLE: Record<string, (lead: string, partner: string) => boolean> = {
  CA: (lead, partner) => {
    const rivals = new Set(["lpc", "cpc"]);
    if (rivals.has(lead) && rivals.has(partner)) return false;
    if (partner === "bq" || lead === "bq") return false;
    return true;
  },
  DE: (lead, partner) => {
    if (lead === "afd" || partner === "afd") return false;
    const cduLnk = new Set([lead, partner]);
    if (cduLnk.has("cdu") && cduLnk.has("lnk")) return false;
    return true;
  },
  FR: () => false,
  AU: (lead, partner) => {
    const rivals = new Set(["alp", "lnp"]);
    if (rivals.has(lead) && rivals.has(partner)) return false;
    if (lead === "grn" || partner === "grn") return lead === "alp" || partner === "alp";
    if (lead === "ind" || partner === "ind") return false;
    if (lead === "onp" || partner === "onp") return false;
    return true;
  },
};

const LEGACY_GOV_TEXT: Record<string, (g: Government, partyName: (p: string) => string) => string | undefined> = {
  FR: (g, partyName) => {
    if (g.kind === "majority") return `${partyName(g.party)} wins the presidency with ${g.seats} points.`;
    if (g.kind === "minority") return `${partyName(g.party)} scrapes the narrowest of wins: ${g.seats} points.`;
    if (g.kind === "hung") return `Dead heat. France recounts through the night; the Republic holds its breath.`;
    return undefined;
  },
  AU: (g, partyName) => {
    if (g.kind === "majority") return `${partyName(g.party)} forms majority government with ${g.seats} seats.`;
    if (g.kind === "coalition") return `${g.parties.map(partyName).join(" and ")} strike a governing agreement (${g.seats} seats).`;
    if (g.kind === "confidence_supply") return `${partyName(g.lead)} governs with confidence and supply from ${partyName(g.partner)}.`;
    if (g.kind === "minority") return `${partyName(g.party)} forms minority government, and the crossbench holds the balance of power.`;
    if (g.kind === "hung") return `Hung parliament: the crossbench decides who governs.`;
    return undefined;
  },
};

describe("declarative country rules match the retired functions", () => {
  it("coalition compatibility is identical for every party pair", () => {
    for (const [code, legacy] of Object.entries(LEGACY_COMPATIBLE)) {
      const country = COUNTRIES[code];
      const parties = [...country.system.parties.map((p) => p.id), "zzz"];
      for (const a of parties) for (const b of parties) {
        if (a === b) continue;
        expect(coalitionAllowed(country.coalitions!, a, b), `${code} ${a}+${b}`).toBe(legacy(a, b));
      }
    }
  });

  it("government text is identical for every government kind", () => {
    const name = (p: string) => `<${p}>`;
    const kinds: Government[] = [
      { kind: "majority", party: "a", seats: 80 },
      { kind: "minority", party: "a", seats: 70 },
      { kind: "coalition", parties: ["a", "b", "c"], seats: 90 },
      { kind: "confidence_supply", lead: "a", partner: "b", seats: 77 },
      { kind: "hung", largest: "a" },
    ];
    for (const m of COUNTRY_MODULES) {
      if (!m.bundle || !["CA", "DE", "FR", "AU"].includes(m.code)) continue;
      for (const g of kinds) {
        expect(countryGovernmentText(m.bundle, g, name), `${m.code} ${g.kind}`).toBe(LEGACY_GOV_TEXT[m.code]?.(g, name));
      }
    }
  });
});
