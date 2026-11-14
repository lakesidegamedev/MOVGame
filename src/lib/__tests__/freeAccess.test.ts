import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FREE_ACCESS_OFF, formatFreeUntil, loadFreeAccess, parseFreeAccess, resetFreeAccessCache } from "../freeAccess";

const NOW = Date.parse("2026-11-14T12:00:00Z");

describe("parseFreeAccess", () => {
  it("is on with an end time in the future", () => {
    expect(parseFreeAccess({ on: true, endsAt: "2026-11-22T22:00:00.000Z", message: "x" }, NOW))
      .toEqual({ on: true, endsAt: "2026-11-22T22:00:00.000Z" });
  });
  it("is off when the switch is off, malformed, or already over", () => {
    expect(parseFreeAccess({ on: false }, NOW)).toEqual(FREE_ACCESS_OFF);
    expect(parseFreeAccess(null, NOW)).toEqual(FREE_ACCESS_OFF);
    expect(parseFreeAccess("on", NOW)).toEqual(FREE_ACCESS_OFF);
    expect(parseFreeAccess({ on: true, endsAt: "2026-11-01T00:00:00Z" }, NOW)).toEqual(FREE_ACCESS_OFF);
  });
  it("stays on with no usable end time", () => {
    expect(parseFreeAccess({ on: true, endsAt: "nonsense" }, NOW)).toEqual({ on: true, endsAt: null });
  });
});

describe("formatFreeUntil", () => {
  it("writes the end in US Eastern", () => {
    expect(formatFreeUntil("2026-11-22T22:00:00.000Z")).toBe("Sunday, November 22 at 5:00 PM Eastern");
  });
});

describe("loadFreeAccess", () => {
  beforeEach(() => resetFreeAccessCache());
  afterEach(() => vi.unstubAllGlobals());

  it("reads the public endpoint once per session", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ on: true, endsAt: "2999-01-01T00:00:00Z" }) }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await loadFreeAccess()).on).toBe(true);
    await loadFreeAccess();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/account/api/free-access");
  });
  it("treats a network error as off", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await loadFreeAccess()).toEqual(FREE_ACCESS_OFF);
  });
  it("treats a bad status or bad body as off", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ on: true }) })));
    expect(await loadFreeAccess()).toEqual(FREE_ACCESS_OFF);
    resetFreeAccessCache();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => { throw new Error("bad json"); } })));
    expect(await loadFreeAccess()).toEqual(FREE_ACCESS_OFF);
  });
});
