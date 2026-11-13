// @vitest-environment jsdom
// The landing page shows a price only from the live platform catalog. While
// it loads, or when it cannot be reached, there is no number anywhere on the
// page and a way to try again; counts come from the content data.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { STORE_PACKS } from "@content/packs";
import { FREE_ELECTIONS_LINE } from "@content/facts";
import { catalogFromResponse, unreachableCatalog, LOADING_CATALOG, PRICE_UNAVAILABLE } from "@lib/storeModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const hoisted = vi.hoisted(() => ({ catalog: { value: null as unknown }, reload: vi.fn() }));
vi.mock("@lib/useCatalog", () => ({
  useCatalog: () => ({ catalog: hoisted.catalog.value, reload: hoisted.reload }),
}));

import { LandingPage } from "../LandingPage";

const live = (country: number, complete: number) => catalogFromResponse({
  source: "platform",
  products: STORE_PACKS.map((p) => ({ id: p.id, name: p.name, priceCents: p.id === "complete" ? complete : country, scenarios: [], listed: true })),
});

let root: Root;
let container: HTMLElement;
function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<LandingPage onGo={() => {}} onResume={() => {}} />); });
}
const text = () => container.textContent ?? "";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  hoisted.reload.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("landing page prices", () => {
  it("shows exactly the platform's numbers once it answered", () => {
    hoisted.catalog.value = live(129, 449);
    mount();
    expect(text()).toContain("$1.29");
    expect(text()).toContain("$4.49");
    expect(text()).not.toContain("$0.99");
    expect(text()).not.toContain("$3.99");
  });

  it("shows no price at all, and offers to try again, when the platform cannot be reached", () => {
    hoisted.catalog.value = unreachableCatalog();
    mount();
    expect(text()).not.toMatch(/\$\d+\.\d\d/); // the Free card's "$0" is not a price from anywhere
    expect(text()).toContain(PRICE_UNAVAILABLE);
    const retry = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Try again"))!;
    act(() => { retry.click(); });
    expect(hoisted.reload).toHaveBeenCalled();
  });

  it("shows no price while the catalog is still loading", () => {
    hoisted.catalog.value = LOADING_CATALOG;
    mount();
    expect(text()).not.toMatch(/\$\d+\.\d\d/); // the Free card's "$0" is not a price from anywhere
    expect(text()).toContain("Checking the price");
  });

  it("names the free elections the same way everywhere", () => {
    hoisted.catalog.value = live(99, 399);
    mount();
    expect(text()).toContain(FREE_ELECTIONS_LINE);
  });

  it("links the Lakeside mark in the top bar to the studio site", () => {
    hoisted.catalog.value = live(99, 399);
    mount();
    const mark = container.querySelector<HTMLAnchorElement>(".landing-topbar a.lakeside-mark")!;
    expect(mark).not.toBeNull();
    expect(mark.getAttribute("href")).toBe("https://lakesidegames.net/");
    expect(mark.getAttribute("aria-label")).toMatch(/Lakeside Games/);
    expect(mark.tabIndex).toBe(0);
    // Small and at the far left, before the game's own name.
    expect(container.querySelector(".landing-brand")!.firstElementChild).toBe(mark);
    expect(mark.textContent).not.toContain("Lakeside Games");
  });

  it("links back to the Lakeside store, account, other games and support in the footer", () => {
    hoisted.catalog.value = live(99, 399);
    mount();
    const links = [...container.querySelectorAll<HTMLAnchorElement>(".landing-lakeside-links a")]
      .map((a) => [a.textContent, a.getAttribute("href"), a.getAttribute("target")]);
    expect(links).toEqual([
      ["Lakeside store", "https://lakesidegames.net/store", "_blank"],
      ["Account", "https://lakesidegames.net/account", "_blank"],
      ["Other games", "https://lakesidegames.net/games", "_blank"],
      ["Support", "https://lakesidegames.net/services/#support", "_blank"],
    ]);
  });
});
