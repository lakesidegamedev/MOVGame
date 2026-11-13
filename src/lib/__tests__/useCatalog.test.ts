// The shared catalog loader: a price exists only after the platform answered
// in this session. Down, slow or fallback answers are "unreachable" with no
// prices, a failure is never kept, and a good answer that is late still lands.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const catalog = vi.hoisted(() => vi.fn());
vi.mock("../api", () => ({ api: { catalog } }));

const { CATALOG_SLOW_MS, loadCatalog, resetCatalogCache } = await import("../useCatalog");

const platform = (cents = 99) => ({
  source: "platform" as const,
  products: [{ id: "canada", name: "Canada", priceCents: cents, scenarios: [], listed: true }],
});

beforeEach(() => {
  resetCatalogCache();
  catalog.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("loadCatalog", () => {
  it("is ready with the platform's prices when it answers", async () => {
    catalog.mockResolvedValue(platform(99));
    const state = await loadCatalog();
    expect(state.status).toBe("ready");
    expect(state.entries.canada.priceCents).toBe(99);
  });

  it("is unreachable with no prices when the request fails", async () => {
    catalog.mockRejectedValue(new Error("offline"));
    expect(await loadCatalog()).toEqual({ status: "unreachable", entries: {} });
  });

  it("is unreachable with no prices when the server can only offer a fallback", async () => {
    catalog.mockResolvedValue({ source: "unavailable", products: [{ id: "canada", name: "Canada", priceCents: null, scenarios: [], listed: false }] });
    expect(await loadCatalog()).toEqual({ status: "unreachable", entries: {} });
    // An older server's bundled fallback is treated the same way.
    resetCatalogCache();
    catalog.mockResolvedValue({ source: "bundled", products: [{ id: "canada", name: "Canada", priceCents: 199, scenarios: [], listed: false }] });
    expect(await loadCatalog()).toEqual({ status: "unreachable", entries: {} });
  });

  it("gives up after the slow cut-off, then takes a good answer that arrives late", async () => {
    vi.useFakeTimers();
    let answer: (v: unknown) => void = () => {};
    catalog.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
    const pending = loadCatalog();
    await vi.advanceTimersByTimeAsync(CATALOG_SLOW_MS);
    expect(await pending).toEqual({ status: "unreachable", entries: {} });
    answer(platform(99));
    await vi.advanceTimersByTimeAsync(0);
    catalog.mockClear();
    const after = await loadCatalog();
    expect(after.status).toBe("ready");
    expect(catalog).not.toHaveBeenCalled(); // served from the late answer
  });

  it("never keeps a failure: the next call asks again", async () => {
    catalog.mockRejectedValueOnce(new Error("blip")).mockResolvedValue(platform(99));
    expect((await loadCatalog()).status).toBe("unreachable");
    expect((await loadCatalog()).status).toBe("ready");
    expect(catalog).toHaveBeenCalledTimes(2);
  });

  it("keeps a good answer for the session and asks again only when forced", async () => {
    catalog.mockResolvedValue(platform(99));
    await loadCatalog();
    await loadCatalog();
    expect(catalog).toHaveBeenCalledTimes(1);
    await loadCatalog(true);
    expect(catalog).toHaveBeenCalledTimes(2);
  });
});
