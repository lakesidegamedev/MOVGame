// @vitest-environment jsdom
// Startup sign-in from the Lakeside launcher: the desktop app gets its code from
// the shell (LAKESIDE_HANDOFF_CODE), the web game from #launcher_code=. Both
// must reach the same redeem call, once.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CODE = "Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3";
const USER = { id: "u1", username: "launched", email: "", ahdLinked: true };

interface Call { url: string; body: unknown }
let calls: Call[];
let invoke: ReturnType<typeof vi.fn>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  calls = [];
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url: String(url), body });
    if (String(url).endsWith("/api/lakeside/launcher-exchange")) {
      return body?.code === CODE
        ? json(200, { token: "game-token", user: USER, unlocked: { scenarioIds: [], packIds: ["canada"] } })
        : json(401, { error: "launcher sign in expired" });
    }
    if (String(url).endsWith("/api/auth/me")) return json(200, { user: USER, unlocked: { scenarioIds: [], packIds: ["canada"] } });
    return json(404, { error: "not mocked" });
  }));
  invoke = vi.fn(async () => null);
  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = { invoke };
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  vi.unstubAllGlobals();
});

async function boot() {
  const { useAuthStore } = await import("../authStore");
  await vi.waitFor(() => {
    expect(calls.some((c) => c.url.endsWith("/api/auth/me") || c.url.endsWith("/api/daily"))).toBe(true);
  });
  return useAuthStore;
}
const exchanges = () => calls.filter((c) => c.url.endsWith("/api/lakeside/launcher-exchange"));

describe("launcher sign-in at startup", () => {
  it("redeems the code the desktop shell was started with", async () => {
    invoke.mockImplementation(async (cmd: string) => (cmd === "take_launcher_code" ? CODE : null));
    const store = await boot();
    expect(invoke).toHaveBeenCalledWith("take_launcher_code");
    expect(exchanges()).toEqual([{ url: expect.stringContaining("/api/lakeside/launcher-exchange"), body: { code: CODE } }]);
    expect(store.getState().user?.username).toBe("launched");
    expect(store.getState().unlocked.packIds).toEqual(["canada"]);
    expect(store.getState().notice).toEqual({ kind: "lakeside-signed-in", username: "launched" });
    expect(localStorage.getItem("campaign_token")).toBe("game-token");
    // The code never lands in the address bar or in storage.
    expect(window.location.href).not.toContain(CODE);
    expect(JSON.stringify({ ...localStorage })).not.toContain(CODE);
  });

  it("tells the player when the shell's code is unusable, without calling the server", async () => {
    invoke.mockImplementation(async () => "short");
    const store = await boot();
    expect(exchanges()).toEqual([]);
    expect(store.getState().notice).toEqual({ kind: "launcher-failed" });
    expect(store.getState().user).toBeNull();
  });

  it("does nothing when the shell has no code", async () => {
    const store = await boot();
    expect(invoke).toHaveBeenCalledWith("take_launcher_code");
    expect(exchanges()).toEqual([]);
    expect(store.getState().notice).toBeNull();
  });

  it("prefers a code in the fragment and leaves the shell's alone", async () => {
    window.history.replaceState(null, "", `/#launcher_code=${CODE}`);
    const store = await boot();
    expect(invoke).not.toHaveBeenCalledWith("take_launcher_code");
    expect(exchanges().map((c) => c.body)).toEqual([{ code: CODE }]);
    expect(window.location.hash).toBe("");
    expect(store.getState().user?.username).toBe("launched");
  });
});
