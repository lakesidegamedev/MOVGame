import { describe, it, expect } from "vitest";
import { PACKS_BY_ID, STORE_PACKS } from "@content/packs";
import type { Purchase } from "@lib/api";
import {
  catalogFromResponse, countryPacks, describeReason, electionsToOffer, offerFor, ownedReason, ownershipRows,
  packFacts, priceCents, summarizeComplete, unreachableCatalog, LOADING_CATALOG, type CatalogState, type OfferContext,
} from "@lib/storeModel";

const WEB = { externalStore: true, nativeStoreName: null };
const STEAM = { externalStore: false, nativeStoreName: "Steam" };

function readyCatalog(unlisted: string[] = [], prices: Record<string, number> = {}): CatalogState {
  return catalogFromResponse({
    source: "platform",
    products: STORE_PACKS.concat(PACKS_BY_ID.global).map((p) => ({
      id: p.id, name: p.name, priceCents: prices[p.id] ?? p.price, scenarios: p.scenarios, listed: !unlisted.includes(p.id),
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
    expect(old.entries.canada.listed).toBe(false);
  });

  it("ignores malformed products", () => {
    const c = catalogFromResponse({ source: "platform", products: [null, { id: 4 }, { id: "canada", priceCents: "99" }, { id: "germany", name: "G", priceCents: 150, scenarios: [], listed: true }] as never });
    expect(Object.keys(c.entries)).toEqual(["germany"]);
  });

  it("prices from the platform, falling back to the bundled price", () => {
    expect(priceCents("canada", readyCatalog([], { canada: 149 }))).toBe(149);
    expect(priceCents("canada", unreachableCatalog())).toBe(PACKS_BY_ID.canada.price);
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

  it("covers Canada and Australia through the legacy Global pack, and nothing else", () => {
    // Germany and France grew past the frozen Global pack (earlier elections were
    // added to them), so Global alone no longer covers those two packs.
    for (const id of ["canada", "australia"]) expect(ownedReason(id, ["global"], [])?.kind).toBe("included");
    for (const id of ["germany", "france"]) expect(ownedReason(id, ["global"], [])).toBeNull();
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
    const global = ownedReason("canada", ["global"], [purchase("global")])!;
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

  it("pauses buying, with the bundled price, when the platform cannot be reached", () => {
    const offer = offerFor("canada", ctx({ catalog: unreachableCatalog() }));
    expect(offer).toEqual({ kind: "unavailable", priceCents: PACKS_BY_ID.canada.price, reason: "unreachable" });
  });

  it("waits while the catalog loads", () => {
    expect(offerFor("canada", ctx({ catalog: LOADING_CATALOG })).kind).toBe("unavailable");
  });

  it("never shows Lakeside checkout on a channel that sells elsewhere", () => {
    expect(offerFor("canada", ctx({ policy: STEAM }))).toEqual({ kind: "native-store", storeName: "Steam" });
  });
});

describe("Complete Collection summary", () => {
  it("counts countries and elections from the data", () => {
    const sum = summarizeComplete([], readyCatalog())!;
    expect(sum.elections).toBe(PACKS_BY_ID.complete.scenarios.length);
    expect(sum.countries).toBe(countryPacks().length);
    expect(sum.addsPacks.map((p) => p.id)).toEqual(countryPacks().map((p) => p.id));
    expect(sum.addsElections).toBe(sum.elections);
    expect(sum.havePacks).toEqual([]);
  });

  it("lists only the packs it would add when some are owned", () => {
    const sum = summarizeComplete(["canada", "germany"], readyCatalog())!;
    expect(sum.havePacks.map((p) => p.id).sort()).toEqual(["canada", "germany"]);
    expect(sum.addsPacks.map((p) => p.id)).not.toContain("canada");
    expect(sum.addsPacks).toHaveLength(countryPacks().length - 2);
    expect(sum.addsElections).toBe(sum.elections - PACKS_BY_ID.canada.scenarios.length - PACKS_BY_ID.germany.scenarios.length);
  });

  it("treats packs covered through the legacy Global pack as already had", () => {
    const sum = summarizeComplete(["global"], readyCatalog())!;
    expect(sum.havePacks.map((p) => p.id).sort()).toEqual(["australia", "canada"]);
  });

  it("computes the saving from current prices", () => {
    const sum = summarizeComplete([], readyCatalog())!;
    expect(sum.separateCents).toBe(countryPacks().reduce((n, p) => n + p.price, 0));
    expect(sum.saveCents).toBe(sum.separateCents - PACKS_BY_ID.complete.price);
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
    expect(f.elections).toHaveLength(PACKS_BY_ID.canada.scenarios.length);
    expect(f.yearRange).toBe("2015 to 2025");
    expect(f.yearRange).not.toMatch(/[\u2013\u2014]/);
    expect(f.elections[0].year).toBeGreaterThanOrEqual(f.elections[f.elections.length - 1].year);
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
