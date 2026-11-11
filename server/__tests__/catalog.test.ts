// The catalog the game serves to its own store: platform prices overlaid on the
// bundled membership, with an honest `listed` flag per product so a pack the
// platform does not sell yet shows as "coming soon", and `source` so the client
// can tell "not for sale" from "could not ask".
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
    expect(by.france).toMatchObject({ listed: false, priceCents: PACKS.find((p) => p.id === "france")!.price });
    expect(items.map((i) => i.id)).toEqual(PACKS.map((p) => p.id)); // the game's membership, in the game's order
  });

  it("keeps pack membership from the game, whatever the platform says", async () => {
    platformAnswers([{ id: "canada", priceCents: 99, scenarios: ["us-2016"] }]);
    const { items } = await getCatalogResult();
    expect(items.find((i) => i.id === "canada")!.scenarios).toEqual(PACKS.find((p) => p.id === "canada")!.scenarios);
  });

  it("does not list a product the platform returned without a usable price", async () => {
    platformAnswers([{ id: "canada", priceCents: "99" }, { id: "germany", priceCents: -5 }, { id: "france", priceCents: 1.5 }, { id: "australia" }]);
    const { items } = await getCatalogResult();
    expect(items.filter((i) => i.listed)).toEqual([]);
  });

  it("falls back to bundled prices, marked unlisted and unreachable, when the platform is down", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    const { source, items } = await getCatalogResult();
    expect(source).toBe("bundled");
    expect(items.every((i) => !i.listed)).toBe(true);
    expect(items.find((i) => i.id === "complete")!.priceCents).toBe(PACKS.find((p) => p.id === "complete")!.price);
  });

  it("treats an HTTP error as unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 503 }));
    expect((await getCatalogResult()).source).toBe("bundled");
  });

  it("caches a platform answer but retries straight away after a failure", async () => {
    const spy = platformAnswers([{ id: "canada", priceCents: 99 }]);
    await getCatalogResult();
    await getCatalogResult();
    expect(spy).toHaveBeenCalledTimes(1);

    clearCatalogCache();
    spy.mockReset();
    spy.mockRejectedValueOnce(new Error("blip")).mockResolvedValue(new Response(JSON.stringify({ products: [{ id: "canada", priceCents: 99 }] }), { status: 200 }));
    expect((await getCatalogResult()).source).toBe("bundled");
    expect((await getCatalogResult()).source).toBe("platform");
  });
});
