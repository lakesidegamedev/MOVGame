// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SHELL_FOCUS_EVENT, takeShellLauncherCode } from "../desktopShell";
import { shellLauncherCode } from "../launcherHandoff";

const CODE = "Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3";
const setBridge = (invoke: unknown) => {
  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = { invoke };
};

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe("the desktop shell's focus report", () => {
  it("uses the event name the Rust shell dispatches", () => {
    const rust = readFileSync(resolve(__dirname, "../../../apps/native/src-tauri/src/lib.rs"), "utf8");
    expect(rust).toContain(`window.dispatchEvent(new Event('${SHELL_FOCUS_EVENT}'))`);
    expect(rust).toMatch(/WindowEvent::Focused\(true\)/);
  });
});

describe("takeShellLauncherCode", () => {
  it("asks the shell for the launcher code", async () => {
    const invoke = vi.fn(async () => CODE);
    setBridge(invoke);
    expect(await takeShellLauncherCode()).toBe(CODE);
    expect(invoke).toHaveBeenCalledWith("take_launcher_code");
  });

  it("is null in a browser, when the shell has none, and in a shell without the command", async () => {
    expect(await takeShellLauncherCode()).toBeNull();
    setBridge(vi.fn(async () => null));
    expect(await takeShellLauncherCode()).toBeNull();
    setBridge(vi.fn(async () => { throw new Error("command take_launcher_code not found"); }));
    expect(await takeShellLauncherCode()).toBeNull();
  });
});

describe("shellLauncherCode", () => {
  it("is absent when the shell had nothing", () => {
    expect(shellLauncherCode(null, "#x=1")).toEqual({ code: null, hash: "#x=1", present: false });
  });

  it("accepts a well-formed code and leaves the fragment alone", () => {
    expect(shellLauncherCode(` ${CODE} `, "")).toEqual({ code: CODE, hash: "", present: true });
  });

  it("marks a malformed or empty code as present but unusable, so the player is told", () => {
    expect(shellLauncherCode("short", "")).toEqual({ code: null, hash: "", present: true });
    expect(shellLauncherCode("", "")).toEqual({ code: null, hash: "", present: true });
    expect(shellLauncherCode("<script>alert(1)</script>xxxxxxxx", "")).toEqual({ code: null, hash: "", present: true });
  });
});
