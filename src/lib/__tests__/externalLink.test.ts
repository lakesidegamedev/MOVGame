// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { inDesktopShell, openExternal } from "../externalLink";

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  vi.restoreAllMocks();
});

describe("openExternal", () => {
  it("asks the desktop shell's opener to open the URL, not the game window", async () => {
    const invoke = vi.fn(async () => null);
    (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = { invoke };
    const open = vi.spyOn(window, "open");
    expect(inDesktopShell()).toBe(true);
    expect(await openExternal("https://lakesidegames.net/account/checkout?game=electioneer&product=canada")).toBe(true);
    expect(invoke).toHaveBeenCalledWith("plugin:opener|open_url", { url: "https://lakesidegames.net/account/checkout?game=electioneer&product=canada" });
    expect(open).not.toHaveBeenCalled();
  });

  it("reports failure when the shell refuses", async () => {
    (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = { invoke: vi.fn(async () => { throw new Error("denied"); }) };
    expect(await openExternal("https://lakesidegames.net/")).toBe(false);
  });

  it("opens a new tab in a normal browser", async () => {
    const fake = { opener: {} } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(fake);
    expect(inDesktopShell()).toBe(false);
    expect(await openExternal("https://lakesidegames.net/")).toBe(true);
    expect(open).toHaveBeenCalledWith("https://lakesidegames.net/", "_blank");
    expect(fake.opener).toBeNull();
  });

  it("reports a blocked popup", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(await openExternal("https://lakesidegames.net/")).toBe(false);
  });

  it("only ever opens http(s) pages", async () => {
    const open = vi.spyOn(window, "open");
    for (const bad of ["javascript:alert(1)", "file:///etc/passwd", "not a url", "tauri://localhost/"]) {
      expect(await openExternal(bad)).toBe(false);
    }
    expect(open).not.toHaveBeenCalled();
  });
});
