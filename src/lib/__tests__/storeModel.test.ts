import { describe, it, expect } from "vitest";
import { PACKS_BY_ID, STORE_PACKS } from "@content/packs";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import type { Purchase } from "@lib/api";
import {
  catalogFromResponse, countryPacks, countryPriceLabel, describeReason, electionsToOffer, offerFor, ownedReason, ownershipRows,
  freeElectionsByCountry, packFacts, priceCents, priceLabel, summarizeComplete, unavailableMessage, unreachableCatalog, LOADING_CATALOG,
  PRICE_UNAVAILABLE, type CatalogState, type OfferContext, type OwnedReason,
} from "@lib/storeModel";
import { packPricesFrom } from "@lib/usePackPrices";
import { FREE_ELECTIONS_LINE } from "@content/facts";

const WEB = { externalStore: true, nativeStoreName: null };
const STEAM = { externalStore: false, nativeStoreName: "Steam" };

// What a platform answer might say. Test data only: the game has no prices of its own.
const PLATFORM_CENTS = (id: string) => (id === "complete" ? 399 : id === "global" ? 599 : 99);

function readyCatalog(unlisted: string[] = [], prices: Record<string, number> = {}): CatalogState {
  return catalogFromResponse({
    source: "platform",
    products: STORE_PACKS.concat(PACKS_BY_ID.global).map((p) => ({
      id: p.id, name: p.name, priceCents: prices[p.id] ?? PLATFORM_CENTS(p.id), scenarios: p.scenarios, listed: !unlisted.includes(p.id),
    })),
  });
}

function purchase(packId: string, provider: Purchase["provider"] = "stripe", createdAt = 1_700_000_000_000): Purchase {
  return { packId, packName: null, scenarioId: null, provider, amountCents: provider === "stripe" ? 99 : 0, currency: "usd", status: "paid", createdAt };
}

const ctx = (over: Partial<OfferContext> = {}): OfferContext => ({
  ownedPackIds: [], purchases: [], catalog: readyCatalog(), policy: WEB, ...over,
});

describe("catalog interpretation", () => {
  it("is ready only when the platform itself answered", () => {
    expect(readyCatalog().status).toBe("ready");
    expect(catalogFromResponse({ source: "bundled", products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [], listed: false }] }).status).toBe("unreachable");
  });

  it("never treats a response that does not say 'listed' as for sale", () => {
    const old = catalogFromResponse({ products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [] }] });
    expect(old.status).toBe("unreachable");
    expect(old.entries).toEqual({});
    const unlabelled = catalogFromResponse({ source: "platform", products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [] }] });
    expect(unlabelled.entries.canada.listed).toBe(false);
  });

  it("keeps no price from an outage answer or an older server's bundled fallback", () => {
    const down = catalogFromResponse({ source: "unavailable", products: [{ id: "canada", name: "Canada", priceCents: null, scenarios: [], listed: false }] });
    expect(down).toEqual(unreachableCatalog());
    const bundled = catalogFromResponse({ source: "bundled", products: [{ id: "canada", name: "Canada", priceCents: 199, scenarios: [], listed: false }] });
    expect(bundled).toEqual(unreachableCatalog());
    expect(priceCents("canada", bundled)).toBeNull();
  });

  it("ignores malformed products", () => {
    const c = catalogFromResponse({ source: "platform", products: [null, { id: 4 }, { id: "canada", priceCents: "99" }, { id: "france", priceCents: null }, { id: "japan", priceCents: 0 }, { id: "germany", name: "G", priceCents: 150, scenarios: [], listed: true }] as never });
    expect(Object.keys(c.entries)).toEqual(["germany"]);
  });

  it("prices only from a platform answer, never from anything else", () => {
    expect(priceCents("canada", readyCatalog([], { canada: 149 }))).toBe(149);
    expect(priceCents("canada", unreachableCatalog())).toBeNull();
    expect(priceCents("canada", LOADING_CATALOG)).toBeNull();
    // Ready, but the platform gave no price for this pack.
    const partial = catalogFromResponse({ source: "platform", products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [], listed: true }] });
    expect(priceCents("germany", partial)).toBeNull();
  });

  it("labels prices only when live", () => {
    expect(priceLabel("canada", readyCatalog([], { canada: 99 }))).toBe("$0.99");
    expect(priceLabel("complete", readyCatalog())).toBe("$3.99");
    expect(priceLabel("canada", unreachableCatalog())).toBeNull();
    expect(priceLabel("canada", LOADING_CATALOG)).toBeNull();
  });

  it("names one country price, or 'from' the lowest when they differ, or nothing", () => {
    expect(countryPriceLabel(readyCatalog())).toBe("$0.99");
    expect(countryPriceLabel(readyCatalog([], { japan: 149 }))).toBe("from $0.99");
    expect(countryPriceLabel(unreachableCatalog())).toBeNull();
    expect(countryPriceLabel(LOADING_CATALOG)).toBeNull();
    const partial = catalogFromResponse({ source: "platform", products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [], listed: true }] });
    expect(countryPriceLabel(partial)).toBeNull();
  });

  it("gives the landing page and guide no number unless live", () => {
    const ready = packPricesFrom(readyCatalog());
    expect(ready).toMatchObject({ ready: true, loading: false, country: "$0.99", complete: "$3.99" });
    expect(ready.label("canada")).toBe("$0.99");
    for (const catalog of [LOADING_CATALOG, unreachableCatalog()]) {
      const p = packPricesFrom(catalog);
      expect(p.ready).toBe(false);
      expect(p.country).toBeNull();
      expect(p.complete).toBeNull();
      expect(STORE_PACKS.map((pack) => p.label(pack.id))).toEqual(STORE_PACKS.map(() => null));
    }
    expect(packPricesFrom(LOADING_CATALOG).loading).toBe(true);
    expect(packPricesFrom(unreachableCatalog()).loading).toBe(false);
  });

  it("says plainly when the price is unavailable", () => {
    expect(PRICE_UNAVAILABLE).toBe("Price unavailable, try again");
    expect(unavailableMessage("unreachable")).toBe(PRICE_UNAVAILABLE);
    expect(unavailableMessage("loading")).not.toMatch(/\$/);
  });
});

describe("covered-by rules", () => {
  it("owns a pack it was granted directly, and says how", () => {
    const r = ownedReason("canada", ["canada"], [purchase("canada")]);
    expect(r).toMatchObject({ kind: "purchase", provider: "stripe" });
  });

  it("maps each platform source to a reason", () => {
    expect(ownedReason("canada", ["canada"], [purchase("canada", "code")])).toMatchObject({ kind: "code" });
    expect(ownedReason("canada", ["canada"], [purchase("canada", "apple")])).toMatchObject({ kind: "purchase", provider: "apple" });
    expect(ownedReason("canada", ["canada"], [purchase("canada", "google")])).toMatchObject({ kind: "purchase", provider: "google" });
    expect(ownedReason("complete", ["complete"], [purchase("complete", "supporter")])).toMatchObject({ kind: "supporter" });
  });

  it("falls back to 'account' when a grant has no receipt", () => {
    expect(ownedReason("canada", ["canada"], [])).toEqual({ kind: "account" });
  });

  it("ignores refunded purchases when picking the reason", () => {
    const refunded = { ...purchase("canada", "stripe", 5), status: "refunded" as const };
    expect(ownedReason("canada", ["canada"], [refunded])).toEqual({ kind: "account" });
  });

  it("covers every country pack through the Complete Collection", () => {
    for (const p of countryPacks()) {
      const r = ownedReason(p.id, ["complete"], [purchase("complete", "supporter")]);
      expect(r?.kind).toBe("included");
      if (r?.kind === "included") expect(r.via.map((v) => v.pack.id)).toEqual(["complete"]);
    }
  });

  it("covers no country pack through the legacy Global pack once each one grew past it", () => {
    // Canada, Australia, Germany and France all gained earlier elections after
    // Global was frozen, so Global alone covers none of its four country packs.
    for (const id of ["canada", "australia", "germany", "france"]) expect(ownedReason(id, ["global"], [])).toBeNull();
    expect(ownedReason("uk-elections", ["global"], [])).toBeNull();
    expect(ownedReason("us-historical", ["global"], [])).toBeNull();
  });

  it("does not own a pack that is only partly covered", () => {
    expect(ownedReason("canada", ["germany"], [])).toBeNull();
    expect(ownedReason("complete", ["canada", "germany"], [])).toBeNull();
  });

  it("counts the Complete Collection as owned once every pack is owned some other way", () => {
    const all = countryPacks().map((p) => p.id);
    expect(ownedReason("complete", all, [])?.kind).toBe("included");
  });

  it("knows nothing about unknown pack ids", () => {
    expect(ownedReason("not-a-pack", ["complete"], [])).toBeNull();
  });

  it("describes reasons in plain words", () => {
    expect(describeReason({ kind: "free" })).toBe("Included free with the game");
    expect(describeReason({ kind: "supporter", at: null })).toBe("Included with your Supporter membership");
    expect(describeReason({ kind: "code", at: null })).toBe("Unlocked with a code");
    expect(describeReason({ kind: "purchase", provider: "apple", at: null })).toBe("Bought on the App Store");
    const via = ownedReason("canada", ["complete"], [purchase("complete", "supporter")])!;
    expect(describeReason(via)).toBe("Included in your Complete Collection from your Supporter membership");
    // No current country pack sits wholly inside Global any more, so build the
    // reason by hand to keep the wording for a single named pack covered.
    const global: OwnedReason = { kind: "included", via: [{ pack: PACKS_BY_ID.global, reason: { kind: "purchase", provider: "stripe", at: null } }] };
    expect(describeReason(global)).toBe("Included in your Global Elections Pack");
    const mixed = ownedReason("complete", [], []);
    expect(mixed).toBeNull();
  });
});

describe("offers", () => {
  it("never shows a price or Buy for an owned pack, whatever the catalog says", () => {
    for (const catalog of [readyCatalog(), unreachableCatalog(), LOADING_CATALOG, readyCatalog(["canada"])]) {
      expect(offerFor("canada", ctx({ ownedPackIds: ["canada"], catalog })).kind).toBe("owned");
    }
  });

  it("offers Buy at the platform price for a listed pack", () => {
    expect(offerFor("canada", ctx({ catalog: readyCatalog([], { canada: 129 }) }))).toEqual({ kind: "buy", priceCents: 129 });
  });

  it("shows 'coming soon' for a pack the platform does not list, never a dead Buy", () => {
    const catalog = readyCatalog(["france"]);
    expect(offerFor("france", ctx({ catalog })).kind).toBe("coming-soon");
    expect(offerFor("canada", ctx({ catalog })).kind).toBe("buy");
  });

  it("treats a pack missing from the platform answer entirely as coming soon", () => {
    const catalog = catalogFromResponse({ source: "platform", products: [{ id: "canada", name: "Canada", priceCents: 99, scenarios: [], listed: true }] });
    expect(offerFor("germany", ctx({ catalog })).kind).toBe("coming-soon");
  });

  it("pauses buying, with no price at all, when the platform cannot be reached", () => {
    const offer = offerFor("canada", ctx({ catalog: unreachableCatalog() }));
    expect(offer).toEqual({ kind: "unavailable", reason: "unreachable" });
  });

  it("waits, with no price, while the catalog loads", () => {
    expect(offerFor("canada", ctx({ catalog: LOADING_CATALOG }))).toEqual({ kind: "unavailable", reason: "loading" });
  });

  it("never shows Lakeside checkout on a channel that sells elsewhere", () => {
    expect(offerFor("canada", ctx({ policy: STEAM }))).toEqual({ kind: "native-store", storeName: "Steam" });
  });

  it("offers nothing to buy in the preview build, even when the catalog is unreachable", () => {
    const PREVIEW = { ...WEB, preview: true };
    expect(offerFor("canada", ctx({ policy: PREVIEW }))).toEqual({ kind: "preview" });
    expect(offerFor("canada", ctx({ policy: PREVIEW, catalog: LOADING_CATALOG }))).toEqual({ kind: "preview" });
  });
});

describe("Complete Collection summary", () => {
  it("counts countries and elections from the data", () => {
    const sum = summarizeComplete([], readyCatalog())!;
    // Every election counts, free ones included; what it adds is the paid ones.
    expect(sum.elections).toBe(SCENARIO_REGISTRY.length);
    expect(sum.freeElections).toBe(SCENARIO_REGISTRY.filter((s) => s.free).length);
    expect(sum.elections - sum.freeElections).toBe(PACKS_BY_ID.complete.scenarios.length);
    expect(sum.countries).toBe(countryPacks().length);
    expect(sum.addsPacks.map((p) => p.id)).toEqual(countryPacks().map((p) => p.id));
    expect(sum.addsElections).toBe(PACKS_BY_ID.complete.scenarios.length);
    expect(sum.havePacks).toEqual([]);
  });

  it("lists only the packs it would add when some are owned", () => {
    const sum = summarizeComplete(["canada", "germany"], readyCatalog())!;
    expect(sum.havePacks.map((p) => p.id).sort()).toEqual(["canada", "germany"]);
    expect(sum.addsPacks.map((p) => p.id)).not.toContain("canada");
    expect(sum.addsPacks).toHaveLength(countryPacks().length - 2);
    expect(sum.addsElections).toBe(PACKS_BY_ID.complete.scenarios.length - PACKS_BY_ID.canada.scenarios.length - PACKS_BY_ID.germany.scenarios.length);
  });

  it("has no pack covered through the legacy Global pack to treat as already had", () => {
    const sum = summarizeComplete(["global"], readyCatalog())!;
    expect(sum.havePacks).toEqual([]);
  });

  it("computes the saving from live prices", () => {
    const sum = summarizeComplete([], readyCatalog())!;
    expect(sum.separateCents).toBe(countryPacks().length * 99);
    expect(sum.saveCents).toBe(countryPacks().length * 99 - 399);
  });

  it("names no total and no saving until every price is live", () => {
    for (const catalog of [LOADING_CATALOG, unreachableCatalog()]) {
      const sum = summarizeComplete([], catalog)!;
      expect(sum.separateCents).toBeNull();
      expect(sum.saveCents).toBeNull();
    }
    const partial = catalogFromResponse({ source: "platform", products: [{ id: "complete", name: "Complete Collection", priceCents: 399, scenarios: [], listed: true }] });
    expect(summarizeComplete([], partial)!.saveCents).toBeNull();
  });

  it("says so when the remaining packs are cheaper than the collection", () => {
    const owned = countryPacks().slice(0, countryPacks().length - 1).map((p) => p.id);
    const sum = summarizeComplete(owned, readyCatalog())!;
    expect(sum.addsPacks).toHaveLength(1);
    expect(sum.saveCents).toBeLessThan(0);
  });

  it("adds nothing once everything is owned", () => {
    const sum = summarizeComplete(["complete"], readyCatalog())!;
    expect(sum.addsPacks).toEqual([]);
    expect(sum.addsElections).toBe(0);
  });
});

describe("pack facts", () => {
  it("derives flag, count and year range from the scenario registry", () => {
    const f = packFacts(PACKS_BY_ID.canada);
    expect(f.flag).toBe("🇨🇦");
    // The page lists the paid elections and the country's free one.
    expect(f.elections).toHaveLength(PACKS_BY_ID.canada.scenarios.length + 1);
    expect(f.freeCount).toBe(1);
    expect(f.elections.find((m) => m.free)?.scenarioId).toBe("ca-2025");
    expect(PACKS_BY_ID.canada.scenarios).not.toContain("ca-2025");
    expect(f.countLabel).toBe(`${f.elections.length} elections, 1 free`);
    expect(f.yearRange).toBe("1984 to 2025");
    expect(f.yearRange).not.toMatch(/[\u2013\u2014]/);
    expect(f.elections[0].year).toBeGreaterThanOrEqual(f.elections[f.elections.length - 1].year);
  });
  it("Complete counts every election in the game and says how many are free", () => {
    const f = packFacts(PACKS_BY_ID.complete);
    const sum = summarizeComplete([], LOADING_CATALOG)!;
    expect(f.elections).toHaveLength(SCENARIO_REGISTRY.length);
    expect(f.elections).toHaveLength(sum.elections);
    expect(f.freeCount).toBe(SCENARIO_REGISTRY.filter((s) => s.free).length);
    expect(f.freeCount).toBe(sum.freeElections);
    expect(f.countLabel).toBe(`${SCENARIO_REGISTRY.length} elections, ${f.freeCount} free`);
  });
  it("Global lists only its own scenarios", () => {
    expect(packFacts(PACKS_BY_ID.global).elections).toHaveLength(PACKS_BY_ID.global.scenarios.length);
  });
  it("groups the free elections by country, one group per country", () => {
    const groups = freeElectionsByCountry();
    expect(groups.map((g) => g.country)).toEqual([...new Set(SCENARIO_REGISTRY.map((s) => s.country))]);
    expect(groups.find((g) => g.country === "US")?.elections.map((m) => m.scenarioId)).toEqual(["us-2024", "us-2020"]);
    expect(groups.find((g) => g.country === "FR")?.elections.map((m) => m.scenarioId)).toEqual(["fr-2022"]);
  });
  it("names an electoral system for every shipped country", () => {
    for (const p of countryPacks()) expect(packFacts(p).system, p.id).toBeTruthy();
  });
});

describe("account ownership list", () => {
  it("leads with the free base game and lists each owned pack with why", () => {
    const rows = ownershipRows(
      { packIds: ["complete", "canada"], scenarioIds: [] },
      [purchase("complete", "supporter"), purchase("canada")],
    );
    expect(rows.map((r) => r.key)).toEqual(["free", "complete", "canada"]);
    expect(rows[0].reason.kind).toBe("free");
    expect(rows[0].detail).toBe(`${FREE_ELECTIONS_LINE}, and the Daily Challenge`);
    expect(rows[1].reason.kind).toBe("supporter");
    expect(rows[2].reason.kind).toBe("purchase");
  });
  it("skips pack ids the game does not know", () => {
    expect(ownershipRows({ packIds: ["mystery"], scenarioIds: [] }, []).map((r) => r.key)).toEqual(["free"]);
  });
});

describe("what to offer after a purchase", () => {
  it("puts the election the player tried to open first", () => {
    const list = electionsToOffer("canada", "ca-2019", []);
    expect(list[0].scenarioId).toBe("ca-2019");
    expect(list.length).toBeLessThanOrEqual(3);
  });
  it("ignores a focus election that is not in the pack", () => {
    expect(electionsToOffer("canada", "uk-2024", []).every((m) => m.country === "CA")).toBe(true);
  });
  it("spreads the Complete Collection across countries and skips what was already owned", () => {
    const list = electionsToOffer("complete", undefined, ["canada", "germany"]);
    expect(new Set(list.map((m) => m.country)).size).toBe(list.length);
    expect(list.some((m) => m.country === "CA" || m.country === "DE")).toBe(false);
  });
  it("returns nothing for an unknown pack", () => {
    expect(electionsToOffer("nope", undefined, [])).toEqual([]);
  });
});
