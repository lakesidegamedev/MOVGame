// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { GuidePage } from "../GuidePage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Guide tabs", () => {
  it("exposes tabs with one selected and switches panels", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let closed = 0;
    act(() => { root.render(<GuidePage onClose={() => { closed += 1; }} />); });
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tablist"] [role="tab"]')];
    expect(tabs.length).toBeGreaterThan(2);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    const blocs = tabs.find((t) => t.textContent === "Voter Blocs")!;
    act(() => { blocs.click(); });
    expect(blocs.getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    const close = container.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
    act(() => { close.click(); });
    expect(closed).toBe(1);
    act(() => root.unmount());
    container.remove();
  });
});
