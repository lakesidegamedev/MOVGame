// @vitest-environment jsdom
// The purchase path: web redirects, desktop system-browser checkout, the return
// states (confirming, slow, success, cancelled), and the guards (owned, coming
// soon, platform down, wrong channel).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogFromResponse, unreachableCatalog, type CatalogState } from "@lib/storeModel";

const hoisted = vi.hoisted(() => ({
  policy: { channel: "web", externalStore: true, nativeStoreName: null as string | null, checkout: "window" as "window" | "system-browser" | null },
  openExternal: vi.fn(async (_url: string) => true),
}));

vi.mock("@lib/distribution", () => ({ DISTRIBUTION: hoisted.policy }));
vi.mock("@lib/externalLink", () => ({ openExternal: hoisted.openExternal }));
vi.mock("@lib/api", () => ({
  lakesideLoginUrl: (p: Record<string, string> = {}) => `https://sim.example/api/lakeside/login?return=${encodeURIComponent("/?" + new URLSearchParams(p))}`,
  lakesideCheckoutUrl: (id: string) => `https://lakeside.example/account/checkout?game=electioneer&product=${id}`,
}));

// A minimal stand-in for the auth store: ownership only changes through
// refreshEntitlements, exactly as in the real one, so a test can prove the
// client never grants anything itself.
const auth = vi.hoisted(() => ({ verified: true, serverPacks: [] as string[], refreshCalls: 0 }));
vi.mock("@store/authStore", async () => {
  const { create } = await import("zustand");
  const useAuthStore = create<Record<string, unknown>>((set) => ({
    user: { id: "u", username: "player", email: "p@example.com", ahdLinked: true },
    unlocked: { scenarioIds: [], packIds: [] },
    purchases: [],
    openModal: vi.fn(),
    refresh: vi.fn(async () => undefined),
    loadPurchases: vi.fn(async () => true),
    refreshEntitlements: vi.fn(async () => {
      auth.refreshCalls++;
      if (!auth.verified) return false;
      set({ unlocked: { scenarioIds: [], packIds: [...auth.serverPacks] } });
      return true;
    }),
  }));
  return { useAuthStore };
});

import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { consumeResume, useStoreFlow, watchForOwnership, RETURN_WATCH, DESKTOP_WATCH } from "../storeFlow";

const listed = (unlisted: string[] = []): CatalogState =>
  catalogFromResponse({
    source: "platform",
    products: ["canada", "germany", "complete", "us-historical", "uk-elections", "france", "australia"].map((id) => ({
      id, name: id, priceCents: id === "complete" ? 399 : 99, scenarios: [], listed: !unlisted.includes(id),
    })),
  });

const authState = () => useAuthStore.getState() as unknown as {
  user: { ahdLinked: boolean } | null; openModal: ReturnType<typeof vi.fn>;
};
const setUser = (user: { id: string; username: string; email: string; ahdLinked: boolean } | null) => useAuthStore.setState({ user });
const assign = vi.fn();
const phase = () => useStoreFlow.getState().phase;

beforeEach(() => {
  vi.useFakeTimers();
  hoisted.policy.channel = "web"; hoisted.policy.externalStore = true; hoisted.policy.nativeStoreName = null; hoisted.policy.checkout = "window";
  hoisted.openExternal.mockReset(); hoisted.openExternal.mockResolvedValue(true);
  auth.verified = true; auth.serverPacks = []; auth.refreshCalls = 0;
  assign.mockReset();
  Object.defineProperty(window, "location", { value: { assign, hostname: "x.test", search: "", pathname: "/", origin: "https://x.test" }, writable: true });
  sessionStorage.clear();
  useAuthStore.setState({ user: { id: "u", username: "player", email: "p@example.com", ahdLinked: true }, unlocked: { scenarioIds: [], packIds: [] }, purchases: [] });
  useStoreFlow.getState().dismiss();
  useStoreNav.setState({ open: false, focus: {}, resume: null });
});
afterEach(() => { vi.useRealTimers(); });

describe("watchForOwnership", () => {
  const harness = (results: Array<"owned" | "pending" | "unverified">) => {
    let t = 0;
    const calls: number[] = [];
    return {
      calls,
      deps: {
        now: () => t,
        sleep: async (ms: number) => { t += ms; },
        stopped: () => false,
        check: async () => { calls.push(t); return results[Math.min(calls.length - 1, results.length - 1)]; },
      },
    };
  };

  it("returns as soon as the pack shows up", async () => {
    const h = harness(["pending", "pending", "owned"]);
    expect(await watchForOwnership(h.deps, RETURN_WATCH)).toEqual({ outcome: "owned" });
    expect(h.calls).toHaveLength(3);
  });

  it("gives up at the deadline, never later", async () => {
    const h = harness(["pending"]);
    const res = await watchForOwnership(h.deps, RETURN_WATCH);
    expect(res).toEqual({ outcome: "timeout", unverified: false });
    expect(Math.max(...h.calls)).toBeLessThanOrEqual(RETURN_WATCH.deadlineMs);
  });

  it("says so when it could never reach the platform", async () => {
    const h = harness(["unverified"]);
    expect(await watchForOwnership(h.deps, RETURN_WATCH)).toEqual({ outcome: "timeout", unverified: true });
  });

  it("stops quietly when superseded", async () => {
    const h = harness(["pending"]);
    let n = 0;
    const res = await watchForOwnership({ ...h.deps, stopped: () => ++n > 2 }, RETURN_WATCH);
    expect(res).toEqual({ outcome: "stopped" });
  });

  it("polls a bounded number of times on the longest watch", async () => {
    const h = harness(["pending"]);
    await watchForOwnership(h.deps, DESKTOP_WATCH);
    expect(h.calls.length).toBeGreaterThan(5);
    expect(h.calls.length).toBeLessThan(90);
  });
});

describe("starting a purchase on the web", () => {
  it("signs in with Lakeside first when the account is not linked, then carries the pack through", () => {
    setUser({ id: "u", username: "player", email: "p@example.com", ahdLinked: false });
    useStoreFlow.getState().start("canada", { catalog: listed(), scenarioId: "ca-2021" });
    expect(phase()).toMatchObject({ kind: "redirecting", to: "sign-in" });
    expect(assign).toHaveBeenCalledTimes(1);
    expect(String(assign.mock.calls[0][0])).toContain("buy%3Dcanada");
  });

  it("signs in with Lakeside when signed out", () => {
    setUser(null);
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(phase()).toMatchObject({ kind: "redirecting", to: "sign-in" });
  });

  it("goes straight to checkout when linked, and remembers what the player was after", () => {
    useStoreFlow.getState().start("canada", { catalog: listed(), scenarioId: "ca-2021" });
    expect(phase()).toMatchObject({ kind: "redirecting", to: "checkout" });
    expect(assign).toHaveBeenCalledWith("https://lakeside.example/account/checkout?game=electioneer&product=canada");
    expect(JSON.parse(sessionStorage.getItem("mov.store.intent")!)).toMatchObject({ packId: "canada", scenarioId: "ca-2021" });
  });

  it("does nothing for a pack that is already owned", () => {
    useAuthStore.setState({ unlocked: { scenarioIds: [], packIds: ["complete"] } });
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(assign).not.toHaveBeenCalled();
    expect(phase().kind).toBe("idle");
  });

  it("refuses a pack the platform does not list (coming soon)", () => {
    useStoreFlow.getState().start("france", { catalog: listed(["france"]) });
    expect(assign).not.toHaveBeenCalled();
    expect(phase()).toMatchObject({ kind: "error", message: expect.stringContaining("not on sale yet") });
  });

  it("refuses while the platform is unreachable or the catalog has not loaded", () => {
    useStoreFlow.getState().start("canada", { catalog: unreachableCatalog() });
    expect(phase()).toMatchObject({ kind: "error", message: expect.stringContaining("can't be reached") });
    useStoreFlow.getState().start("canada", { catalog: { status: "loading", entries: {} } });
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses a pack id that is not on sale at all, including the legacy Global pack", () => {
    useStoreFlow.getState().start("global", { catalog: listed() });
    expect(phase()).toMatchObject({ kind: "error" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("never shows Lakeside checkout on Steam", () => {
    Object.assign(hoisted.policy, { channel: "steam", externalStore: false, nativeStoreName: "Steam", checkout: null });
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(phase()).toMatchObject({ kind: "error", message: expect.stringContaining("Steam") });
    expect(assign).not.toHaveBeenCalled();
    expect(hoisted.openExternal).not.toHaveBeenCalled();
  });
});

describe("starting a purchase in the desktop app", () => {
  beforeEach(() => { Object.assign(hoisted.policy, { channel: "desktop-direct", checkout: "system-browser" }); });

  it("opens checkout in the system browser and leaves the game window where it is", async () => {
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(hoisted.openExternal).toHaveBeenCalledWith("https://lakeside.example/account/checkout?game=electioneer&product=canada");
    expect(assign).not.toHaveBeenCalled();
    expect(phase()).toMatchObject({ kind: "checkout-open", packId: "canada" });
  });

  it("unlocks the pack when the platform records it while the player is in the browser", async () => {
    useStoreFlow.getState().start("canada", { catalog: listed(), scenarioId: "ca-2025" });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(phase().kind).toBe("checkout-open"); // not paid yet: still waiting, nothing granted
    auth.serverPacks = ["canada"];
    await vi.advanceTimersByTimeAsync(10_000);
    expect(phase()).toMatchObject({ kind: "success", packId: "canada", focusScenarioId: "ca-2025" });
  });

  it("picks the purchase up at once when the window regains focus", async () => {
    useStoreFlow.getState().start("canada", { catalog: listed() });
    auth.serverPacks = ["canada"];
    await useStoreFlow.getState().checkNow();
    expect(phase().kind).toBe("success");
  });

  it("stops waiting at the deadline and offers a manual refresh instead", async () => {
    useStoreFlow.getState().start("canada", { catalog: listed() });
    await vi.advanceTimersByTimeAsync(DESKTOP_WATCH.deadlineMs + 20_000);
    expect(phase()).toMatchObject({ kind: "slow", fromCheckout: true });
    auth.serverPacks = ["canada"];
    await useStoreFlow.getState().checkNow();
    expect(phase().kind).toBe("success");
  });

  it("shows the link when the browser cannot be opened", async () => {
    hoisted.openExternal.mockResolvedValue(false);
    useStoreFlow.getState().start("canada", { catalog: listed() });
    await vi.advanceTimersByTimeAsync(0);
    expect(phase()).toMatchObject({ kind: "error", url: expect.stringContaining("checkout") });
  });

  it("asks a signed-out player to log in rather than leaving the window", () => {
    setUser(null);
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(phase()).toMatchObject({ kind: "needs-login", reason: "buy" });
    expect(authState().openModal).toHaveBeenCalledWith("login");
    expect(assign).not.toHaveBeenCalled();
    expect(hoisted.openExternal).not.toHaveBeenCalled();
  });

  it("walks an unlinked account through linking in the browser, then continues", async () => {
    setUser({ id: "u", username: "player", email: "p@example.com", ahdLinked: false });
    useStoreFlow.getState().start("canada", { catalog: listed() });
    expect(phase()).toMatchObject({ kind: "link-external", opened: false });
    expect(hoisted.openExternal).not.toHaveBeenCalled(); // only on the player's explicit click
    useStoreFlow.getState().openLinkPage();
    await vi.advanceTimersByTimeAsync(0);
    expect(hoisted.openExternal).toHaveBeenCalledTimes(1);
    expect(phase()).toMatchObject({ kind: "link-external", opened: true });
    expect(assign).not.toHaveBeenCalled();
  });
});

describe("coming back from checkout", () => {
  it("shows the cancelled state and charges nothing", () => {
    useStoreFlow.getState().handleReturn("cancelled", "canada");
    expect(phase()).toEqual({ kind: "cancelled", packId: "canada" });
    expect(auth.refreshCalls).toBe(0);
  });

  it("confirms, then names the unlocked pack and remembers the election they came for", async () => {
    sessionStorage.setItem("mov.store.intent", JSON.stringify({ packId: "canada", scenarioId: "ca-2021", ownedBefore: ["uk-elections"], at: Date.now() }));
    useStoreFlow.getState().handleReturn("success", "canada");
    expect(phase()).toEqual({ kind: "confirming", packId: "canada" });
    await vi.advanceTimersByTimeAsync(3_000); // the webhook has not landed yet
    expect(phase().kind).toBe("confirming");
    auth.serverPacks = ["canada"];
    await vi.advanceTimersByTimeAsync(6_000);
    expect(phase()).toMatchObject({ kind: "success", packId: "canada", focusScenarioId: "ca-2021", ownedBefore: ["uk-elections"] });
  });

  it("falls back to a calm 'still processing' state when the webhook is late, with a working manual refresh", async () => {
    useStoreFlow.getState().handleReturn("success", "canada");
    await vi.advanceTimersByTimeAsync(RETURN_WATCH.deadlineMs + 10_000);
    expect(phase()).toMatchObject({ kind: "slow", packId: "canada", unverified: false, fromCheckout: false });
    const callsAtGiveUp = auth.refreshCalls;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(auth.refreshCalls).toBe(callsAtGiveUp); // bounded: no polling after the deadline
    auth.serverPacks = ["canada"];
    await useStoreFlow.getState().checkNow();
    expect(phase()).toMatchObject({ kind: "success", packId: "canada" });
  });

  it("does not mistake an unreachable platform for a missing purchase", async () => {
    auth.verified = false;
    useStoreFlow.getState().handleReturn("success", "canada");
    await vi.advanceTimersByTimeAsync(RETURN_WATCH.deadlineMs + 10_000);
    expect(phase()).toMatchObject({ kind: "slow", unverified: true });
    expect((useAuthStore.getState() as unknown as { unlocked: { packIds: string[] } }).unlocked.packIds).toEqual([]);
  });

  it("never marks a pack owned on its own: success needs the server to say so", async () => {
    useStoreFlow.getState().handleReturn("success", "complete");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(phase().kind).toBe("confirming");
  });

  it("asks a signed-out player to log in to see their purchase", () => {
    setUser(null);
    useStoreFlow.getState().handleReturn("success", "canada");
    expect(phase()).toMatchObject({ kind: "needs-login", reason: "return" });
  });

  it("ignores a stale intent for a different pack", () => {
    sessionStorage.setItem("mov.store.intent", JSON.stringify({ packId: "germany", scenarioId: "de-2021", ownedBefore: [], at: Date.now() }));
    useStoreFlow.getState().handleReturn("success", "canada");
    auth.serverPacks = ["canada"];
    return useStoreFlow.getState().checkNow().then(() => {
      expect((phase() as { focusScenarioId?: string }).focusScenarioId).toBeUndefined();
    });
  });

  it("dismiss stops any wait in progress", async () => {
    useStoreFlow.getState().handleReturn("success", "canada");
    useStoreFlow.getState().dismiss();
    auth.serverPacks = ["canada"];
    await vi.advanceTimersByTimeAsync(RETURN_WATCH.deadlineMs);
    expect(phase().kind).toBe("idle");
  });
});

describe("redirect landings handed to the Store", () => {
  it("resumes a Buy after sign-in once the catalog is known", () => {
    useStoreNav.setState({ open: true, resume: { kind: "buy", packId: "canada" } });
    consumeResume({ status: "loading", entries: {} });
    expect(assign).not.toHaveBeenCalled();
    expect(useStoreNav.getState().resume).not.toBeNull();
    consumeResume(listed());
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("product=canada"));
    expect(useStoreNav.getState().resume).toBeNull();
  });

  it("handles a checkout return without waiting for the catalog", () => {
    useStoreNav.setState({ open: true, resume: { kind: "return", result: "cancelled", packId: "germany" } });
    consumeResume({ status: "loading", entries: {} });
    expect(phase()).toEqual({ kind: "cancelled", packId: "germany" });
  });
});
