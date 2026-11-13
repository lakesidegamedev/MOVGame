import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn((..._args: unknown[]) => "event-id") }));
vi.mock("@sentry/browser", () => sentry);

import { initErrorReporting, reportingEnabled, SENTRY_TEST_HASH, sentryEnvironment, sentryRelease, withoutSessions } from "../errorReporting";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("error reporting settings", () => {
  it("names the web game production and every other build after its channel", () => {
    expect(sentryEnvironment("web")).toBe("production");
    for (const channel of ["desktop-direct", "desktop-preview", "steam", "ios", "android"] as const) {
      expect(sentryEnvironment(channel)).toBe(channel);
    }
  });

  it("builds the release from the version and the commit", () => {
    expect(sentryRelease("2.0.0", "e8fe5ee")).toBe("2.0.0+e8fe5ee");
    expect(sentryRelease(undefined, undefined)).toBe("0.0.0+unknown");
  });

  it("sends no session pings", () => {
    const kept = withoutSessions([{ name: "BrowserSession" }, { name: "GlobalHandlers" }, { name: "Dedupe" }]);
    expect(kept.map((i) => i.name)).toEqual(["GlobalHandlers", "Dedupe"]);
  });

  it("treats an empty or blank DSN as off", () => {
    expect(reportingEnabled(undefined)).toBe(false);
    expect(reportingEnabled("")).toBe(false);
    expect(reportingEnabled("  ")).toBe(false);
    expect(reportingEnabled("https://key@example.invalid/1")).toBe(true);
  });

  it("commits every build env file with the one DSN setting left empty", () => {
    const files = readdirSync(root).filter((f) => f.startsWith(".env.") && f !== ".env.example");
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(join(root, file), "utf8");
      expect(text, file).toMatch(/^VITE_SENTRY_DSN=$/m);
      expect(text, file).not.toMatch(/DSN=\S/);
      expect(text, file).not.toMatch(/GLITCHTIP/i);
    }
  });
});

describe("initErrorReporting", () => {
  let hash = "";
  const replaceState = vi.fn((..._args: unknown[]) => { hash = ""; });

  beforeEach(() => {
    sentry.init.mockClear();
    sentry.captureException.mockClear();
    replaceState.mockClear();
    hash = "";
    vi.stubGlobal("window", { location: { get hash() { return hash; }, pathname: "/games/electioneer/", search: "" } });
    vi.stubGlobal("history", { replaceState });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const opts = { channel: "web" as const, version: "2.0.0", commit: "abc1234" };

  it("sends nothing without a DSN", () => {
    hash = SENTRY_TEST_HASH;
    expect(initErrorReporting({ ...opts, dsn: "" })).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("starts with environment and release, errors only, no personal data", () => {
    expect(initErrorReporting({ ...opts, channel: "desktop-direct", dsn: "https://key@example.invalid/1" })).toBe(true);
    expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      environment: "desktop-direct",
      release: "2.0.0+abc1234",
      tracesSampleRate: 0,
      sendDefaultPii: false,
      integrations: withoutSessions,
    }));
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("sends one test error for #sentry-test and clears the hash", () => {
    hash = SENTRY_TEST_HASH;
    initErrorReporting({ ...opts, dsn: "https://key@example.invalid/1" });
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    expect(String(sentry.captureException.mock.calls[0][0])).toContain("Sentry test error (production 2.0.0+abc1234)");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/games/electioneer/");
    initErrorReporting({ ...opts, dsn: "https://key@example.invalid/1" });
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
