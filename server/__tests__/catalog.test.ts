// The catalog the game serves to its own store: platform prices on the game's
// pack membership, with an honest `listed` flag per product so a pack the
// platform does not sell yet shows as "coming soon", and `source` so the client
// can tell "not for sale" from "could not ask". No answer ever carries a price
// the platform did not give in that answer.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.LAKESIDE_CATALOG_URL = "https://catalog.example.test/catalog";
const { getCatalogResult, clearCatalogCache } = await import("../catalog.ts");
const { PACKS } = await import("../../src/content/packs.ts");

function platformAnswers(products: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ products }), { status: 200 }));
}

beforeEach(() => clearCatalogCache());
afterEach(() => vi.restoreAllMocks());

describe("getCatalogResult", () => {
  it("lists exactly what the platform sells, at the platform's prices", async () => {
    platformAnswers([{ id: "canada", name: "Canada", priceCents: 149 }, { id: "complete", priceCents: 449 }]);
    const { source, items } = await getCatalogResult();
    expect(source).toBe("platform");
    const by = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(by.canada).toMatchObject({ listed: true, priceCents: 149 });
    expect(by.complete).toMatchObject({ listed: true, priceCents: 449 });
    expect(by.france).toMatchObject({ listed: false, priceCents: null }); // the platform did not price it
    expect(items.map((i) => i.id)).toEqual(PACKS.map((p) => p.id)); // the game's membership, in the game's order
  });

  it("keeps pack membership from the game, whatever the platform says", async () => {
    platformAnswers([{ id: "canada", priceCents: 99, scenarios: ["us-2016"] }]);
    const { items } = await getCatalogResult();
    expect(items.find((i) => i.id === "canada")!.scenarios).toEqual(PACKS.find((p) => p.id === "canada")!.scenarios);
  });

  it("does not list or price a product the platform returned without a usable price", async () => {
    platformAnswers([{ id: "canada", priceCents: "99" }, { id: "germany", priceCents: -5 }, { id: "france", priceCents: 1.5 }, { id: "australia" }, { id: "japan", priceCents: 0 }]);
    const { items } = await getCatalogResult();
    expect(items.filter((i) => i.listed)).toEqual([]);
    expect(items.every((i) => i.priceCents === null)).toBe(true);
  });

  it("treats a listing without a channels block as buyable on the web (older platform deploys)", async () => {
    platformAnswers([{ id: "canada", priceCents: 149 }]);
    const { items } = await getCatalogResult();
    expect(items.find((i) => i.id === "canada")!.listed).toBe(true);
  });

  it("sells on the web only what the platform marks web purchasable (newer platform deploys)", async () => {
    platformAnswers([
      { id: "canada", priceCents: 149, channels: { web: { purchasable: true }, apple: { purchasable: false } } },
      { id: "germany", priceCents: 149, channels: { web: { purchasable: false }, apple: { purchasable: true } } },
      { id: "france", priceCents: 149, channels: { apple: { purchasable: true } } },
      { id: "australia", priceCents: 149, channels: { web: { purchasable: "yes" } } },
      { id: "complete", priceCents: 449, channels: {} },
    ]);
    const by = Object.fromEntries((await getCatalogResult()).items.map((i) => [i.id, i]));
    expect(by.canada.listed).toBe(true);
    expect(by.germany).toMatchObject({ listed: false, priceCents: 149 });
    expect(by.france.listed).toBe(false);
    expect(by.australia.listed).toBe(false);
    expect(by.complete.listed).toBe(false);
  });

  it("answers unavailable with no prices at all when the platform is down", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    const { source, items } = await getCatalogResult();
    expect(source).toBe("unavailable");
    expect(items.every((i) => !i.listed && i.priceCents === null)).toBe(true);
    expect(items.map((i) => i.id)).toEqual(PACKS.map((p) => p.id));
  });

  it("treats an HTTP error as unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 503 }));
    expect((await getCatalogResult()).source).toBe("unavailable");
  });

  it("treats an answer with no product list as unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "maintenance" }), { status: 200 }));
    const { source, items } = await getCatalogResult();
    expect(source).toBe("unavailable");
    expect(items.every((i) => i.priceCents === null)).toBe(true);
  });

  it("treats a slow platform as unavailable", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => new Promise((_resolve, reject) => {
        (init as RequestInit).signal!.addEventListener("abort", () => reject(new Error("aborted")));
      }));
      const pending = getCatalogResult();
      await vi.advanceTimersByTimeAsync(5_000);
      expect((await pending).source).toBe("unavailable");
    } finally {
      vi.useRealTimers();
    }
  });

  it("caches a platform answer but retries straight away after a failure", async () => {
    const spy = platformAnswers([{ id: "canada", priceCents: 99 }]);
    await getCatalogResult();
    await getCatalogResult();
    expect(spy).toHaveBeenCalledTimes(1);

    clearCatalogCache();
    spy.mockReset();
    spy.mockRejectedValueOnce(new Error("blip")).mockResolvedValue(new Response(JSON.stringify({ products: [{ id: "canada", priceCents: 99 }] }), { status: 200 }));
    expect((await getCatalogResult()).source).toBe("unavailable");
    expect((await getCatalogResult()).source).toBe("platform");
  });
});
