// @vitest-environment jsdom
// The Store screen as a player meets it: ownership, coming soon, platform down,
// pack pages, the purchase banner, and keyboard behaviour.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PACKS_BY_ID } from "@content/packs";
import { catalogFromResponse, countryPacks, packFacts, summarizeComplete, unreachableCatalog, type CatalogState } from "@lib/storeModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const hoisted = vi.hoisted(() => ({
  policy: { channel: "web", externalStore: true, nativeStoreName: null as string | null, checkout: "window" as "window" | "system-browser" | null },
  catalog: { value: null as unknown },
}));
vi.mock("@lib/distribution", () => ({ DISTRIBUTION: hoisted.policy }));
vi.mock("@lib/useCatalog", () => ({
  useCatalog: () => ({ catalog: hoisted.catalog.value, reload: vi.fn() }),
}));

import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { useStoreFlow } from "@store/storeFlow";
import StoreScreen from "../StoreScreen";

const readyCatalog = (unlisted: string[] = []): CatalogState =>
  catalogFromResponse({
    source: "platform",
    products: [...countryPacks(), PACKS_BY_ID.complete].map((p) => ({ id: p.id, name: p.name, priceCents: p.price, scenarios: [], listed: !unlisted.includes(p.id) })),
  });

const player = { id: "u1", username: "campaigner", email: "c@example.com", ahdLinked: true };
const stripe = (packId: string) => ({ packId, packName: null, scenarioId: null, provider: "stripe" as const, amountCents: 99, currency: "usd", status: "paid" as const, createdAt: 1_700_000_000_000 });

let root: Root;
let container: HTMLElement;
const onClose = vi.fn();
const onPlay = vi.fn();

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<StoreScreen onClose={onClose} onPlay={onPlay} />); });
}
const text = () => container.textContent ?? "";
const buttons = (label: RegExp) => [...container.querySelectorAll<HTMLButtonElement>("button")].filter((b) => label.test(b.getAttribute("aria-label") ?? b.textContent ?? ""));
const click = (el: Element) => act(() => { (el as HTMLElement).click(); });
const tile = (packId: string) => container.querySelector(`#tile-${packId}`)!.closest("article") as HTMLElement;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  Object.assign(hoisted.policy, { channel: "web", externalStore: true, nativeStoreName: null, checkout: "window" });
  hoisted.catalog.value = readyCatalog();
  useAuthStore.setState({ user: null, unlocked: { scenarioIds: [], packIds: [] }, purchases: [], modal: null, serverDown: false });
  useStoreNav.setState({ open: true, focus: {}, resume: null });
  useStoreFlow.getState().dismiss();
  onClose.mockReset(); onPlay.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("the shelf", () => {
  it("leads with the Complete Collection and states what it contains from the data", () => {
    mount();
    const sum = summarizeComplete([], readyCatalog())!;
    const hero = container.querySelector(".store-hero")!;
    expect(hero.textContent).toContain("Complete Collection");
    expect(hero.textContent).toContain(String(sum.elections));
    expect(hero.textContent).toContain(String(sum.countries));
    expect(hero.textContent).toContain("$3.99");
    expect(hero.textContent).toContain("every one we add in later updates");
  });

  it("shows one tile per country pack with price, count, years and electoral system", () => {
    mount();
    for (const p of countryPacks()) {
      const t = tile(p.id);
      expect(t.textContent).toContain(p.name);
      expect(t.textContent).toContain(`${packFacts(p).elections.length} elections, `);
      expect(t.textContent).toMatch(/elections, [12] free/);
      expect(t.textContent).toContain("$0.99");
      expect(t.querySelector("img.store-cover, .store-cover.fallback")).not.toBeNull();
      expect(buttons(/^Buy /).some((b) => tile(p.id).contains(b))).toBe(true);
    }
    expect(tile("canada").textContent).toContain("1984 to 2025");
    expect(tile("germany").textContent).toContain("Mixed-member proportional");
  });

  it("shows the free base game as owned by everyone, with Play", () => {
    mount();
    const free = container.querySelector(".store-free")!;
    expect(free.textContent).toContain("Free for everyone");
    expect(free.textContent).toContain("Harris v. Trump");
    expect(free.textContent).toContain("Biden v. Trump");
    expect(free.textContent).toContain("Daily Challenge");
    // One group per country, each with its free election.
    expect(free.querySelectorAll(".store-free-country:not(.store-free-daily)")).toHaveLength(countryPacks().length);
    expect(free.textContent).toContain("France");
    click(buttons(/Play 2024/)[0]);
    expect(onPlay).toHaveBeenCalledWith("us-2024");
  });

  it("never shows a price or Buy for a pack the player already has", () => {
    useAuthStore.setState({ user: player, unlocked: { scenarioIds: [], packIds: ["canada"] }, purchases: [stripe("canada")] });
    mount();
    const t = tile("canada");
    expect(t.textContent).toContain("Owned");
    expect(t.textContent).not.toContain("$");
    expect(t.querySelector("button.primary")).toBeNull();
    expect(t.textContent).toContain("Purchased");
    expect(tile("germany").querySelector("button.primary")).not.toBeNull();
  });

  it("says what the Complete Collection would add when some packs are owned", () => {
    useAuthStore.setState({ user: player, unlocked: { scenarioIds: [], packIds: ["canada", "germany"] }, purchases: [] });
    mount();
    const sum = summarizeComplete(["canada", "germany"], readyCatalog())!;
    const adds = container.querySelector(".store-adds")!.textContent!;
    expect(adds).toContain("You already have Canada and Germany");
    expect(adds).toContain(`${sum.addsElections} more elections`);
    expect(adds).not.toMatch(/adds [^.]*Canada/);
  });

  it("shows packs covered by Complete as owned with the reason, and offers nothing to buy", () => {
    useAuthStore.setState({
      user: player, unlocked: { scenarioIds: [], packIds: ["complete"] },
      purchases: [{ ...stripe("complete"), provider: "supporter" as const, amountCents: 0 }],
    });
    mount();
    expect(container.querySelector(".store-hero")!.textContent).toContain("Included with your Supporter membership");
    for (const p of countryPacks()) {
      expect(tile(p.id).textContent).toContain("Included in your Complete Collection");
      expect(tile(p.id).querySelector("button.primary")).toBeNull();
    }
    expect(buttons(/^Buy /)).toHaveLength(0);
  });

  it("shows a pack the platform does not list as coming soon, with no Buy button", () => {
    hoisted.catalog.value = readyCatalog(["france"]);
    mount();
    expect(tile("france").textContent).toContain("Coming soon");
    expect(tile("france").querySelector("button.primary")).toBeNull();
    expect(tile("france").textContent).not.toContain("$");
    expect(tile("canada").querySelector("button.primary")).not.toBeNull();
  });

  it("stays browsable with Buy disabled, and says why, when the platform is unreachable", () => {
    hoisted.catalog.value = unreachableCatalog();
    mount();
    const buys = buttons(/^Buy /);
    expect(buys.length).toBeGreaterThan(0);
    expect(buys.every((b) => b.disabled)).toBe(true);
    expect(text()).toContain("can't be reached");
    expect(tile("canada").textContent).toContain("$0.99"); // bundled price for reference
    expect(buttons(/Try again/).length).toBeGreaterThan(0);
    click(tile("canada").querySelector("button.pack-tile-main")!);
    expect(text()).toContain("Elections in this pack"); // still browsable
  });

  it("filters the shelf to owned and not owned packs", () => {
    useAuthStore.setState({ user: player, unlocked: { scenarioIds: [], packIds: ["canada"] }, purchases: [stripe("canada")] });
    mount();
    click(buttons(/^Owned 1/)[0]);
    expect(container.querySelectorAll(".pack-tile")).toHaveLength(1);
    click(buttons(/^Not owned/)[0]);
    expect(container.querySelectorAll(".pack-tile")).toHaveLength(countryPacks().length - 1);
  });
});

describe("channels that sell elsewhere", () => {
  it("shows ownership and elections but never a Lakeside price or Buy on Steam", () => {
    Object.assign(hoisted.policy, { channel: "steam", externalStore: false, nativeStoreName: "Steam", checkout: null });
    mount();
    expect(buttons(/^Buy /)).toHaveLength(0);
    expect(container.querySelector(".store-hero")!.textContent).toContain("Sold through Steam");
    expect(container.querySelector(".store-hero")!.textContent).not.toContain("$3.99");
    expect(tile("canada").textContent).toContain("Sold through Steam");
    expect(text()).toContain("sold and restored through Steam");
  });
});

describe("a pack page", () => {
  it("opens on the pack behind a locked election, highlights it, and shows the pack and the Complete Collection side by side", () => {
    useStoreNav.setState({ focus: { scenarioId: "ca-2019" } });
    mount();
    expect(container.querySelector("h2")!.textContent).toBe("Canada");
    const rows = [...container.querySelectorAll(".store-election")];
    // The paid elections plus the country's free one, marked Free with Play.
    expect(rows).toHaveLength(PACKS_BY_ID.canada.scenarios.length + 1);
    const free = rows.filter((r) => r.querySelector(".tag-free"));
    expect(free).toHaveLength(1);
    expect(free[0].textContent).toContain("2025");
    expect(free[0].querySelector("button")?.textContent).toContain("Play");
    const focus = container.querySelector(".store-election.is-focus")!;
    expect(focus.textContent).toContain("Trudeau v. Scheer");
    expect(focus.textContent).toContain("The election you tried to open");
    expect(rows.every((r) => /Easier|Medium|Harder/.test(r.textContent!))).toBe(true);
    const box = container.querySelector(".store-buybox")!;
    expect(box.textContent).toContain("Canada");
    expect(box.textContent).toContain("$0.99");
    expect(box.textContent).toContain("Complete Collection");
    expect(box.textContent).toContain("$3.99");
    expect(box.querySelectorAll("button")).toHaveLength(2);
    expect(rows.filter((r) => !r.querySelector(".tag-free")).every((r) => r.textContent!.includes("Locked"))).toBe(true);
  });

  it("lets the owner jump straight into an election", () => {
    useAuthStore.setState({ user: player, unlocked: { scenarioIds: PACKS_BY_ID.canada.scenarios, packIds: ["canada"] }, purchases: [stripe("canada")] });
    useStoreNav.setState({ focus: { packId: "canada" } });
    mount();
    const box = container.querySelector(".store-buybox")!;
    expect(box.textContent).toContain("Owned");
    expect(box.querySelector("button")).toBeNull();
    expect(box.textContent).not.toContain("$");
    click(buttons(/^Play 2025/)[0]);
    expect(onPlay).toHaveBeenCalledWith("ca-2025");
  });

  it("goes back to the shelf with Escape, then closes", () => {
    useStoreNav.setState({ focus: { packId: "canada" } });
    mount();
    const esc = () => act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    esc();
    expect(container.querySelector(".store-hero")).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    esc();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("purchase messages", () => {
  const setPhase = (phase: Parameters<typeof useStoreFlow.setState>[0]) => act(() => { useStoreFlow.setState(phase); });

  it("names what was unlocked and offers to play it", () => {
    useAuthStore.setState({ user: player, unlocked: { scenarioIds: [], packIds: ["canada"] }, purchases: [stripe("canada")] });
    mount();
    setPhase({ phase: { kind: "success", packId: "canada", focusScenarioId: "ca-2021", ownedBefore: [] } });
    const banner = container.querySelector(".store-banner.good")!;
    expect(banner.textContent).toContain("Canada unlocked");
    expect(banner.textContent).toContain("All 12 elections in the pack are yours");
    const first = banner.querySelector("button.primary")!;
    expect(first.textContent).toContain("Play");
    expect(first.textContent).toContain("2021");
    click(first);
    expect(onPlay).toHaveBeenCalledWith("ca-2021");
  });

  it("states the whole collection when the Complete Collection was bought", () => {
    mount();
    setPhase({ phase: { kind: "success", packId: "complete", ownedBefore: ["canada"] } });
    const sum = summarizeComplete([], readyCatalog())!;
    expect(container.querySelector(".store-banner.good")!.textContent).toContain(`All ${sum.elections} elections in ${sum.countries} countries`);
  });

  it("tells a late webhook calmly and offers a manual refresh", () => {
    mount();
    setPhase({ phase: { kind: "slow", packId: "canada", unverified: false, fromCheckout: false } });
    const banner = container.querySelector(".store-banner.warn")!;
    expect(banner.textContent).toContain("Still processing");
    expect(banner.textContent).toContain("Nothing else is needed");
    expect(banner.querySelector("button.primary")!.textContent).toContain("Refresh");
  });

  it("says plainly when the store could not be reached to check", () => {
    mount();
    setPhase({ phase: { kind: "slow", packId: "canada", unverified: true, fromCheckout: false } });
    expect(container.querySelector(".store-banner.warn")!.textContent).toContain("couldn't reach the Lakeside store");
  });

  it("confirms a cancelled checkout and lets the player try again", () => {
    mount();
    setPhase({ phase: { kind: "cancelled", packId: "canada" } });
    const banner = container.querySelector(".store-banner")!;
    expect(banner.textContent).toContain("Checkout cancelled");
    expect(banner.textContent).toContain("Nothing was charged");
    expect(banner.textContent).toContain("Try again");
  });

  it("locks every Buy button while a purchase is in progress", () => {
    mount();
    setPhase({ phase: { kind: "confirming", packId: "canada" } });
    expect(buttons(/^Buy /).every((b) => b.disabled)).toBe(true);
    expect(container.querySelector("[aria-live='polite']")).not.toBeNull();
  });

  it("keeps Buy locked while a returned payment has not shown up yet, so it cannot be charged twice", () => {
    mount();
    setPhase({ phase: { kind: "slow", packId: "canada", unverified: false, fromCheckout: false } });
    expect(buttons(/^Buy /).every((b) => b.disabled)).toBe(true);
    // A desktop wait that ran out may mean nothing was paid: buying stays possible.
    setPhase({ phase: { kind: "slow", packId: "canada", unverified: false, fromCheckout: true } });
    expect(buttons(/^Buy /).some((b) => !b.disabled)).toBe(true);
  });

  it("walks a desktop player through checkout in their browser", () => {
    Object.assign(hoisted.policy, { channel: "desktop-direct", checkout: "system-browser" });
    useAuthStore.setState({ user: player });
    mount();
    setPhase({ phase: { kind: "checkout-open", packId: "canada", url: "https://lakesidegames.net/account/checkout?game=electioneer&product=canada" } });
    const banner = container.querySelector(".store-banner")!;
    expect(banner.textContent).toContain("Checkout is open in your browser");
    expect(banner.textContent).toContain("I've paid, check now");
    expect(banner.textContent).toContain("product=canada");
  });
});

describe("keyboard and screen readers", () => {
  it("is a labelled modal dialog and keeps Tab inside it", () => {
    mount();
    const dialog = container.querySelector("[role='dialog']")!;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("store-title");
    expect(container.querySelector("#store-title")!.textContent).toContain("Store");
    const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
    const last = focusable[focusable.length - 1];
    last.focus();
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    act(() => { document.dispatchEvent(tab); });
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusable[0]);
  });

  it("gives every Buy button a name with the pack and the price", () => {
    mount();
    expect(buttons(/^Buy Canada for \$0\.99$/)).toHaveLength(1);
    expect(buttons(/^Buy the Complete Collection for \$3\.99$/)).toHaveLength(1);
    click(buttons(/^Buy Canada for/)[0].closest("article")!.querySelector("button.pack-tile-main")!);
    // On the pack page: the pack's own button and "Buy everything" each name what they buy.
    expect(buttons(/^Buy Canada for \$0\.99$/)).toHaveLength(1);
    expect(buttons(/^Buy the Complete Collection for \$3\.99$/)).toHaveLength(1); // the "Buy everything" option
  });

  it("stands down while a log in dialog is open above it", () => {
    useAuthStore.setState({ modal: "login" });
    mount();
    expect(container.querySelector("[role='dialog']")!.hasAttribute("inert")).toBe(true);
  });
});
