// Lakeside launcher handoff: the single-use code exchange and the pack summary
// the launcher tile reads. The platform is a local fake; the SQLite file is a
// throwaway (CAMPAIGN_DB_PATH must be set before the db module loads).

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import http, { type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "mov-launcher-test-")), "test.db");
process.env.JWT_SECRET = "fixture-launcher-jwt";
process.env.INTERNAL_TOKEN = "fixture-internal";

const { getDb } = await import("../db.ts");
const { signToken, verifyToken } = await import("../auth.ts");
const { lakesideRouter } = await import("../routes/lakeside.ts");
const { authRouter } = await import("../routes/auth.ts");
const { linkOrCreateUser } = await import("../lakeside.ts");
const { identityForUser } = await import("../entitlements.ts");
const { launcherPackSummary, parseOwnedQuery, ownedPacksFromEntitlements, resetLauncherRedeemPause } =
  await import("../launcherHandoff.ts");
const { PACKS_BY_ID, STORE_PACKS } = await import("../../src/content/packs.ts");
const { SCENARIO_REGISTRY } = await import("../../src/content/scenarioRegistry.ts");

let api: Server, platform: Server, base = "";
let platformStatus = 200;
let platformBody: unknown = {};
let platformHeaders: Record<string, string> = {};
let calls: Array<{ path: string; auth: string; body: Record<string, unknown> }> = [];

const code = () => randomUUID().replace(/-/g, "") + "_xY";
const ahdId = () => randomUUID().replace(/-/g, "").slice(0, 24);
const entitlementReads = () => calls.filter((x) => x.path.startsWith("/entitlements"));

/** A redeem answer in the platform's shape: no email. */
function redeemed(over: Record<string, unknown> = {}) {
  const id = ahdId();
  return { accountId: id, displayName: `player_${id.slice(0, 6)}`, entitlements: [], ...over };
}

async function exchange(body: unknown, token?: string) {
  const r = await fetch(`${base}/api/lakeside/launcher-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: r.status, cache: r.headers.get("cache-control"), body: await r.json() as Record<string, any> };
}

function localUser(email: string, ahd: string | null = null) {
  const id = randomUUID(), username = "u_" + id.slice(0, 8);
  getDb().prepare("INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id) VALUES (?, ?, ?, 'x', ?, ?)")
    .run(id, username, email, Date.now(), ahd);
  return { id, username, token: signToken({ userId: id, username }) };
}

const userRow = (id: string) =>
  getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as { email: string; ahd_user_id: string; username: string };

beforeAll(async () => {
  platform = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    calls.push({ path: req.url ?? "", auth: req.headers.authorization ?? "", body: JSON.parse(Buffer.concat(chunks).toString() || "{}") });
    // Entitlement reads after sign in: an empty ledger.
    if ((req.url ?? "").startsWith("/entitlements")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ purchases: [] }));
    }
    res.writeHead(platformStatus, { "Content-Type": "application/json", ...platformHeaders });
    res.end(JSON.stringify(platformBody));
  });
  await new Promise<void>((r) => platform.listen(0, "127.0.0.1", () => r()));
  const port = (platform.address() as { port: number }).port;
  process.env.LAKESIDE_LAUNCHER_REDEEM_URL = `http://127.0.0.1:${port}/redeem`;
  process.env.LAKESIDE_ENTITLEMENTS_URL = `http://127.0.0.1:${port}/entitlements`;

  const app = express();
  app.use(express.json());
  app.use(lakesideRouter);
  app.use("/api/auth", authRouter);
  await new Promise<void>((r) => { api = app.listen(0, "127.0.0.1", () => r()); });
  base = `http://127.0.0.1:${(api.address() as { port: number }).port}`;
});

afterAll(async () => {
  await Promise.all([
    new Promise<void>((r) => api.close(() => r())),
    new Promise<void>((r) => platform.close(() => r())),
  ]);
});

beforeEach(() => {
  calls = [];
  platformStatus = 200;
  platformBody = {};
  platformHeaders = {};
  resetLauncherRedeemPause();
});

describe("POST /api/lakeside/launcher-exchange", () => {
  it("redeems the code with the shared handoff contract and signs the player in", async () => {
    const who = redeemed();
    platformBody = who;
    const c = code();
    const r = await exchange({ code: c });

    expect(r.status).toBe(200);
    expect(r.cache).toBe("no-store");
    const redeem = calls.find((x) => x.path === "/redeem")!;
    expect(redeem.body).toEqual({ code: c, clientId: "margin-of-victory" });
    // Public call: the code is the credential, no game secret goes with it.
    expect(redeem.auth).toBe("");

    expect(r.body.user.ahdLinked).toBe(true);
    expect(r.body.user.username).toBe(who.displayName);
    expect(r.body.user.email).toBe("");
    expect(verifyToken(r.body.token)?.userId).toBe(r.body.user.id);
    expect(r.body.unlocked).toEqual({ scenarioIds: [], packIds: [] });
    expect(userRow(r.body.user.id).ahd_user_id).toBe(who.accountId);

    // The same platform account lands on the same game account next time.
    platformBody = { ...who, displayName: "renamed_player" };
    const again = await exchange({ code: code() });
    expect(again.body.user.id).toBe(r.body.user.id);
  });

  it("gives an account without an email an inert placeholder", async () => {
    const who = redeemed();
    platformBody = who;
    const r = await exchange({ code: code() });
    const row = userRow(r.body.user.id);
    expect(row.email).toBe(`${who.accountId}@launcher.invalid`);
    // Never sent to the platform, never shown.
    expect(identityForUser(r.body.user.id)).toEqual({ ahdUserId: who.accountId, email: null });
    const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${r.body.token}` } });
    expect((await me.json()).user.email).toBe("");
    const read = new URL(`http://x${entitlementReads().at(-1)?.path}`);
    expect(read.searchParams.get("ahdUserId")).toBe(who.accountId);
    expect(read.searchParams.get("email")).toBe("");
    // Nobody can sign up with it or log in with it.
    const reg = await fetch(`${base}/api/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "squatter_1", email: row.email, password: "longenough1" }),
    });
    expect(reg.status).toBe(400);
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: row.email, password: "anything-at-all" }),
    });
    expect(login.status).toBe(401);
    // Account deletion works as for any account.
    const del = await fetch(`${base}/api/auth/account`, { method: "DELETE", headers: { Authorization: `Bearer ${r.body.token}` } });
    expect(del.status).toBe(200);
    expect(getDb().prepare("SELECT 1 FROM users WHERE id = ?").get(r.body.user.id)).toBeUndefined();
  });

  it("keeps the real email once a Lakeside sign in brings one", async () => {
    const who = redeemed();
    platformBody = who;
    const r = await exchange({ code: code() });
    const email = `real_${who.accountId.slice(0, 8)}@example.com`;
    const user = linkOrCreateUser({ ahdUserId: who.accountId, email, username: "ignored" });
    expect(user.id).toBe(r.body.user.id);
    expect(userRow(user.id).email).toBe(email);
  });

  it("never matches an existing account by display name or anything but the platform id", async () => {
    const other = localUser(`someone_${ahdId()}@example.com`);
    platformBody = redeemed({ displayName: other.username });
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    expect(r.body.user.id).not.toBe(other.id);
    expect(r.body.user.username).not.toBe(other.username);
  });

  it("finds the game account already keyed to the platform id", async () => {
    const accountId = ahdId();
    const mine = localUser(`keyed_${accountId.slice(0, 8)}@example.com`, accountId);
    platformBody = redeemed({ accountId });
    const r = await exchange({ code: code() });
    expect(r.body.user.id).toBe(mine.id);
    expect(r.body.user.email).toBe(`keyed_${accountId.slice(0, 8)}@example.com`);
  });

  it("keys a Discord launcher account by the platform's discord: id", async () => {
    platformBody = redeemed({ accountId: "discord:123456789012345678" });
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    const row = userRow(r.body.user.id);
    expect(row.ahd_user_id).toBe("discord:123456789012345678");
    expect(row.email).toBe("discord-123456789012345678@launcher.invalid");
  });

  it("links the account the player is already signed in to", async () => {
    const email = `linkme_${ahdId()}@example.com`;
    const mine = localUser(email);
    platformBody = redeemed();
    const r = await exchange({ code: code() }, mine.token);
    expect(r.status).toBe(200);
    expect(r.body.user.id).toBe(mine.id);
    expect(userRow(mine.id).email).toBe(email);
  });

  it("names a player with no display name instead of failing", async () => {
    platformBody = redeemed({ displayName: null });
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    expect(r.body.user.username).toMatch(/^player_[0-9a-f]{6}$/);
  });

  it("unlocks what the redeem answer says the account owns, without a second read", async () => {
    platformBody = redeemed({
      entitlements: [
        { productId: "us-historical", game: "electioneer", source: "purchase" },
        { productId: "uk-historical", game: "electioneer", source: "supporter", until: "2000-01-01T00:00:00.000Z" },
        { productId: "ahd-client", game: "a-house-divided", source: "purchase" },
      ],
    });
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    expect(r.body.unlocked.packIds).toEqual(["us-historical"]);
    expect([...r.body.unlocked.scenarioIds].sort()).toEqual([...PACKS_BY_ID["us-historical"].scenarios].sort());
    expect(entitlementReads()).toHaveLength(0);
  });

  it("falls back to the normal entitlement read when the answer has no list", async () => {
    platformBody = redeemed({ entitlements: undefined });
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    expect(entitlementReads()).toHaveLength(1);
  });

  it("rejects a malformed code without asking the platform", async () => {
    for (const body of [{}, { code: "" }, { code: "short" }, { code: "a".repeat(129) }, { code: "has spaces in it ok?" }, { code: 42 }]) {
      expect((await exchange(body)).status).toBe(400);
    }
    expect(calls).toHaveLength(0);
  });

  it("answers 401 when the platform does not honour the code", async () => {
    platformStatus = 400;
    platformBody = { error: "invalid_request" };
    const r = await exchange({ code: code() });
    expect(r.status).toBe(401);
    expect(r.body.token).toBeUndefined();
  });

  it("answers 503 when the platform fails or answers with an unusable account", async () => {
    for (const [status, body] of [
      [500, {}],
      [404, { error: "Not found" }],
      [200, {}],
      [200, redeemed({ accountId: "not-a-platform-id" })],
      [200, redeemed({ accountId: "abc@example.com" })],
      [200, redeemed({ accountId: 42 })],
    ] as const) {
      platformStatus = status;
      platformBody = body;
      expect((await exchange({ code: code() })).status).toBe(503);
    }
  });

  it("treats 429 as unavailable and stops asking for a while", async () => {
    platformStatus = 429;
    platformHeaders = { "Retry-After": "30" };
    platformBody = { error: "rate_limited" };
    expect((await exchange({ code: code() })).status).toBe(503);
    expect(calls).toHaveLength(1);

    // Even once the platform recovers, the pause holds: no retry storm.
    platformStatus = 200;
    platformHeaders = {};
    platformBody = redeemed();
    for (let i = 0; i < 5; i++) expect((await exchange({ code: code() })).status).toBe(503);
    expect(calls).toHaveLength(1);

    resetLauncherRedeemPause();
    expect((await exchange({ code: code() })).status).toBe(200);
  });

  it("does not need the internal token", async () => {
    const saved = process.env.INTERNAL_TOKEN;
    delete process.env.INTERNAL_TOKEN;
    try {
      platformBody = redeemed();
      const r = await exchange({ code: code() });
      expect(r.status).toBe(200);
      expect(calls.filter((x) => x.path === "/redeem")).toHaveLength(1);
    } finally {
      process.env.INTERNAL_TOKEN = saved;
    }
  });
});

describe("ownedPacksFromEntitlements", () => {
  it("keeps live Margin of Victory packs only", () => {
    const now = Date.parse("2026-11-12T00:00:00Z");
    expect(ownedPacksFromEntitlements([
      { productId: "complete", game: "electioneer", source: "purchase" },
      { productId: "us-historical", game: "electioneer", source: "supporter", until: "2026-12-01T00:00:00Z" },
      { productId: "uk-historical", game: "electioneer", source: "supporter", until: "garbage" },
      { productId: "not-a-pack", game: "electioneer", source: "purchase" },
      { productId: "ahd-client", game: "a-house-divided", source: "purchase" },
      null, "x", { game: "electioneer" },
    ], now)).toEqual(["complete", "us-historical"]);
    expect(ownedPacksFromEntitlements(undefined)).toBeNull();
    expect(ownedPacksFromEntitlements({})).toBeNull();
    expect(ownedPacksFromEntitlements([])).toEqual([]);
  });
});

describe("launcher pack summary", () => {
  const free = SCENARIO_REGISTRY.filter((s) => s.free).length;

  it("counts only the free elections for a player who owns nothing", () => {
    const s = launcherPackSummary([]);
    expect(s.elections).toEqual({ total: SCENARIO_REGISTRY.length, free, playable: free });
    expect(s.ownsEverything).toBe(false);
    expect(s.packs.map((p) => p.id)).toEqual(STORE_PACKS.map((p) => p.id));
    expect(s.packs.every((p) => !p.owned)).toBe(true);
  });

  it("marks every pack owned for the Complete Collection", () => {
    const s = launcherPackSummary(["complete"]);
    expect(s.ownsEverything).toBe(true);
    expect(s.elections.playable).toBe(SCENARIO_REGISTRY.length);
    expect(s.packs.every((p) => p.owned)).toBe(true);
  });

  it("counts one country pack and ignores other games' product ids", () => {
    const us = PACKS_BY_ID["us-historical"];
    const s = launcherPackSummary(["us-historical", "ahd-client", "us-historical"]);
    expect(s.elections.playable).toBe(free + us.scenarios.length);
    expect(s.packs.find((p) => p.id === "us-historical")).toMatchObject({ owned: true, elections: us.scenarios.length, name: us.name });
    expect(s.packs.find((p) => p.id === "complete")?.owned).toBe(false);
    expect(s.packs.some((p) => p.id === "ahd-client")).toBe(false);
  });

  it("lists the retired Global pack only for players who own it", () => {
    expect(launcherPackSummary([]).packs.some((p) => p.id === "global")).toBe(false);
    const s = launcherPackSummary(["global"]);
    expect(s.packs.find((p) => p.id === "global")).toMatchObject({ owned: true, elections: 14 });
  });

  it("parses and bounds the owned query", () => {
    expect(parseOwnedQuery("a,b, c,,")).toEqual(["a", "b", "c"]);
    expect(parseOwnedQuery(["a", "b,c"])).toEqual(["a", "b", "c"]);
    expect(parseOwnedQuery(undefined)).toEqual([]);
    expect(parseOwnedQuery("x".repeat(65))).toEqual([]);
    expect(parseOwnedQuery(Array.from({ length: 100 }, (_, i) => `p${i}`).join(","))).toHaveLength(64);
  });

  it("serves the summary over HTTP with a public cache", async () => {
    const r = await fetch(`${base}/api/lakeside/launcher-packs?owned=complete`);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("public, max-age=300");
    expect((await r.json()).ownsEverything).toBe(true);
  });
});
