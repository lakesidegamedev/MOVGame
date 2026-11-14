// @vitest-environment jsdom
// While Lakeside free access is on, signed-out visitors see the free-until line
// and a sign-in action instead of prices and "Unlock to play"; signed-in
// players see no prices; a failing endpoint means the usual paid copy.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { STORE_PACKS, PACKS_BY_ID } from "@content/packs";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { catalogFromResponse, countryPacks } from "@lib/storeModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const hoisted = vi.hoisted(() => ({ catalog: { value: null as unknown }, reload: vi.fn() }));
vi.mock("@lib/useCatalog", () => ({ useCatalog: () => ({ catalog: hoisted.catalog.value, reload: hoisted.reload }) }));

import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { resetFreeAccessCache, loadFreeAccess } from "@lib/freeAccess";
import { LandingPage } from "../LandingPage";
import { LibraryCard } from "../library/ElectionLibrary";
import { SetupScreen } from "../SetupScreen";
import StoreScreen from "../store/StoreScreen";

const UNTIL = "Free until Sunday, November 22 at 5:00 PM Eastern";
const catalog = catalogFromResponse({
  source: "platform",
  products: STORE_PACKS.map((p) => ({ id: p.id, name: p.name, priceCents: p.id === "complete" ? 399 : 99, scenarios: [], listed: true })),
});
const player = { id: "u1", username: "campaigner", email: "c@example.com", ahdLinked: true };
const paid = SCENARIO_REGISTRY.find((s) => !s.free)!;

let root: Root;
let container: HTMLElement;
const text = () => (container.textContent ?? "").replace(/\s+/g, " ");
// Struck-through prices (<s>) are allowed under free access: they show what it would cost.
const liveText = () => {
  const copy = container.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("s").forEach((el) => el.remove());
  return (copy.textContent ?? "").replace(/\s+/g, " ");
};
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(node); });
}
async function setFree(mode: "on" | "off" | "error") {
  resetFreeAccessCache();
  vi.stubGlobal("fetch", vi.fn(async () => {
    if (mode === "error") throw new Error("offline");
    return { ok: true, json: async () => ({ on: mode === "on", endsAt: "2026-11-22T22:00:00.000Z", message: "x" }) };
  }));
  await loadFreeAccess();
}
const buttonsWith = (label: string) => [...container.querySelectorAll("button")].filter((b) => b.textContent?.includes(label));

beforeEach(() => {
  hoisted.catalog.value = catalog;
  useAuthStore.setState({ user: null, unlocked: { scenarioIds: [], packIds: [] }, purchases: [], modal: null, serverDown: false });
  useStoreNav.setState({ open: true, focus: {}, resume: null });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("landing page", () => {
  it("signed out, free access on: free-until line and sign in, no prices", async () => {
    await setFree("on");
    mount(<LandingPage onGo={() => {}} onResume={() => {}} />);
    await flush();
    expect(text()).toContain(UNTIL.replace("Free", "free"));
    expect(text()).toContain(UNTIL);
    expect(liveText()).not.toMatch(/\$\d+\.\d\d/);
    expect(text()).not.toContain("or $3.99");
    expect(buttonsWith("Sign in to play free").length).toBeGreaterThan(0);
    expect(buttonsWith("View")).toHaveLength(0);
  });
  it("signed in, free access on: no prices and no sign in prompt", async () => {
    await setFree("on");
    useAuthStore.setState({ user: player });
    mount(<LandingPage onGo={() => {}} onResume={() => {}} />);
    await flush();
    expect(liveText()).not.toMatch(/\$\d+\.\d\d/);
    expect(buttonsWith("Sign in to play free")).toHaveLength(0);
  });
  it("free access off: the usual prices", async () => {
    await setFree("off");
    mount(<LandingPage onGo={() => {}} onResume={() => {}} />);
    await flush();
    expect(text()).toContain("$0.99");
    expect(text()).not.toContain("Sign in to play free");
  });
  it("endpoint failing means off", async () => {
    await setFree("error");
    mount(<LandingPage onGo={() => {}} onResume={() => {}} />);
    await flush();
    expect(text()).toContain("$0.99");
    expect(text()).not.toContain("Free until");
  });
});

describe("locked election card", () => {
  const card = () => <LibraryCard s={paid} unlocked={false} showFree onPlay={() => {}} onLocked={() => {}} />;
  it("signed out, free on: free-until line and sign in instead of Unlock to play", async () => {
    await setFree("on");
    mount(card());
    await flush();
    expect(text()).toContain(UNTIL);
    expect(text()).toContain("Sign in to play free");
    expect(text()).not.toContain("Unlock to play");
  });
  it("signed in, free on: no unlock or price text", async () => {
    await setFree("on");
    useAuthStore.setState({ user: player });
    mount(card());
    await flush();
    expect(text()).not.toContain("Unlock to play");
    expect(text()).not.toContain("Sign in to play free");
  });
  it("free off or failing: Unlock to play", async () => {
    await setFree("error");
    mount(card());
    await flush();
    expect(text()).toContain("Unlock to play");
  });
});

describe("setup screen", () => {
  async function toLastStep() {
    for (let i = 0; i < 3; i++) {
      const next = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Next"));
      if (next) act(() => { (next as HTMLElement).click(); });
    }
  }
  it("signed out, free on: Begin button asks to sign in", async () => {
    await setFree("on");
    mount(<SetupScreen initialScenarioId="2016" onExit={() => {}} onLaunch={() => {}} />);
    await flush();
    await toLastStep();
    expect(text()).toContain("Sign in to play free");
    expect(text()).toContain(UNTIL);
    expect(text()).not.toContain("Unlock to play");
  });
  it("free off: Unlock to play", async () => {
    await setFree("off");
    mount(<SetupScreen initialScenarioId="2016" onExit={() => {}} onLaunch={() => {}} />);
    await flush();
    await toLastStep();
    expect(text()).toContain("Unlock to play");
    expect(text()).not.toContain("Sign in to play free");
  });
});

describe("store", () => {
  const mountStore = () => mount(<StoreScreen onClose={() => {}} onPlay={() => {}} />);
  it("signed out, free on: free-until line, sign in, no Buy or prices", async () => {
    await setFree("on");
    mountStore();
    await flush();
    expect(text()).toContain(UNTIL);
    expect(buttonsWith("Sign in to play free").length).toBeGreaterThan(0);
    expect(text()).not.toMatch(/\$\d/);
    expect([...container.querySelectorAll("button")].filter((b) => /^Buy /.test(b.getAttribute("aria-label") ?? b.textContent ?? ""))).toHaveLength(0);
  });
  it("signed in, free on: no Buy or prices", async () => {
    await setFree("on");
    useAuthStore.setState({ user: player });
    mountStore();
    await flush();
    expect(text()).not.toMatch(/\$\d/);
    expect(buttonsWith("Sign in to play free")).toHaveLength(0);
  });
  it("free off: Buy buttons with prices", async () => {
    await setFree("off");
    useAuthStore.setState({ user: player });
    mountStore();
    await flush();
    expect(text()).toMatch(/\$\d/);
  });
  it("sanity: packs exist", () => { expect(countryPacks().length).toBeGreaterThan(0); expect(PACKS_BY_ID.complete).toBeTruthy(); });
});
