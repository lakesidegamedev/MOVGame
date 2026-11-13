// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { ScenarioMeta } from "@content/scenarioRegistry";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { ElectionLibrary } from "../ElectionLibrary";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(canPlay: (id: string) => boolean = (id) => id === "us-2024" || id === "us-2020") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const played: ScenarioMeta[] = [];
  const locked: ScenarioMeta[] = [];
  act(() => {
    root.render(
      <ElectionLibrary rows={SCENARIO_REGISTRY} canPlay={canPlay} showAccess
        onPlay={(s) => played.push(s)} onLocked={(s) => locked.push(s)} />,
    );
  });
  const press = (group: string, label: string) => {
    const btn = [...container.querySelectorAll<HTMLButtonElement>(`[aria-label="${group}"] button`)]
      .find((b) => b.textContent?.trim().startsWith(label));
    if (!btn) throw new Error(`${group} ${label} not found`);
    act(() => { btn.click(); });
    return btn;
  };
  const cards = () => [...container.querySelectorAll<HTMLButtonElement>(".library-card")];
  return { container, press, cards, played, locked, cleanup: () => { act(() => root.unmount()); container.remove(); } };
}

describe("ElectionLibrary", () => {
  it("lists every country as a group with a country rail", () => {
    const m = mount();
    const countries = new Set(SCENARIO_REGISTRY.map((s) => s.country));
    expect(m.container.querySelectorAll(".library-group")).toHaveLength(countries.size);
    expect(m.container.querySelectorAll('[aria-label="Country"] button')).toHaveLength(countries.size + 1);
    m.cleanup();
  });

  it("narrows by country chip and shows every election of that country", () => {
    const m = mount();
    const chip = m.press("Country", "🇬🇧");
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    const uk = SCENARIO_REGISTRY.filter((s) => s.country === "UK");
    expect(m.cards()).toHaveLength(uk.length);
    expect(m.container.querySelectorAll(".library-group")).toHaveLength(1);
    m.cleanup();
  });

  it("filters by ownership, difficulty and era, and clears", () => {
    const m = mount();
    m.press("Show", "Owned");
    expect(m.cards()).toHaveLength(2);
    m.press("Show", "All");
    const hard = m.press("Difficulty", "Hard");
    expect(hard.getAttribute("aria-pressed")).toBe("true");
    expect(m.cards().length).toBe(SCENARIO_REGISTRY.filter((s) => s.difficulty === "hard").length);
    m.press("Era", "2020s");
    const years = m.cards().map((c) => Number(c.querySelector(".library-card-year")?.textContent));
    expect(years.length).toBeGreaterThan(0);
    expect(years.every((y) => y >= 2020 && y <= 2029)).toBe(true);
    const clear = [...m.container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")!;
    act(() => { clear.click(); });
    expect(m.container.querySelectorAll(".library-group")).toHaveLength(new Set(SCENARIO_REGISTRY.map((s) => s.country)).size);
    m.cleanup();
  });

  it("plays unlocked elections and routes locked ones to the unlock prompt", () => {
    const m = mount();
    m.press("Country", "🇺🇸");
    const open = m.cards().find((c) => c.textContent?.includes("Harris v. Trump"))!;
    const shut = m.cards().find((c) => c.textContent?.includes("Clinton v. Trump"))!;
    act(() => { open.click(); });
    act(() => { shut.click(); });
    expect(m.played.map((s) => s.scenarioId)).toEqual(["us-2024"]);
    expect(m.locked.map((s) => s.scenarioId)).toEqual(["us-2016"]);
    m.cleanup();
  });

  it("collapses long countries until asked, and shows an empty state", () => {
    const m = mount();
    const us = SCENARIO_REGISTRY.filter((s) => s.country === "US").length;
    const more = [...m.container.querySelectorAll("button")].find((b) => b.textContent?.startsWith(`Show all ${us}`));
    if (us > 8) {
      expect(more).toBeDefined();
      act(() => { more!.click(); });
    }
    const usGroup = m.container.querySelector('[aria-label="United States"]')!;
    expect(usGroup.querySelectorAll(".library-card")).toHaveLength(us);
    const input = m.container.querySelector<HTMLInputElement>('input[type="search"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    act(() => { setter?.call(input, "no such campaign"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(m.container.textContent).toContain('No elections match these filters for "no such campaign"');
    m.cleanup();
  });

  it("counts free and owned elections as playable, never today's Daily Challenge", () => {
    // us-1960 stands in for a paid election that is today's Daily Challenge:
    // it can be opened today, but it is not owned, so the count stays at 2.
    const today = (id: string) => id === "us-2024" || id === "us-2020" || id === "us-1960";
    const owned = (id: string) => id === "us-2024" || id === "us-2020";
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(<ElectionLibrary rows={SCENARIO_REGISTRY} canPlay={today} owns={owned} showAccess onPlay={() => {}} onLocked={() => {}} />);
    });
    const us = container.querySelector('[aria-label="United States"] .library-group-meta')!;
    expect(us.textContent).toContain("2 playable");
    act(() => root.unmount());
    container.remove();
  });
});
