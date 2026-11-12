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
const { launcherPackSummary, parseOwnedQuery } = await import("../launcherHandoff.ts");
const { PACKS_BY_ID, STORE_PACKS } = await import("../../src/content/packs.ts");
const { SCENARIO_REGISTRY } = await import("../../src/content/scenarioRegistry.ts");

let api: Server, platform: Server, base = "";
let platformStatus = 200;
let platformBody: unknown = {};
let calls: Array<{ path: string; auth: string; body: Record<string, unknown> }> = [];

const code = () => randomUUID().replace(/-/g, "") + "_xY";
const ahdId = () => randomUUID().replace(/-/g, "").slice(0, 24);

function identity(over: Record<string, unknown> = {}) {
  const id = ahdId();
  return { userId: id, email: `p_${id.slice(0, 8)}@example.com`, username: `player_${id.slice(0, 6)}`, provider: "ahd", ...over };
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
  return { id, token: signToken({ userId: id, username }) };
}

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
    res.writeHead(platformStatus, { "Content-Type": "application/json" });
    res.end(JSON.stringify(platformBody));
  });
  await new Promise<void>((r) => platform.listen(0, "127.0.0.1", () => r()));
  const port = (platform.address() as { port: number }).port;
  process.env.LAKESIDE_LAUNCHER_REDEEM_URL = `http://127.0.0.1:${port}/redeem`;
  process.env.LAKESIDE_ENTITLEMENTS_URL = `http://127.0.0.1:${port}/entitlements`;

  const app = express();
  app.use(express.json());
  app.use(lakesideRouter);
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
});

describe("POST /api/lakeside/launcher-exchange", () => {
  it("redeems the code server side and signs the player in", async () => {
    const who = identity();
    platformBody = { identity: who };
    const c = code();
    const r = await exchange({ code: c });

    expect(r.status).toBe(200);
    expect(r.cache).toBe("no-store");
    const redeem = calls.find((x) => x.path === "/redeem")!;
    expect(redeem.body).toEqual({ code: c, game: "electioneer" });
    expect(redeem.auth).toBe("Bearer fixture-internal");

    expect(r.body.user.ahdLinked).toBe(true);
    expect(r.body.user.email).toBe(who.email);
    expect(verifyToken(r.body.token)?.userId).toBe(r.body.user.id);
    expect(r.body.unlocked).toEqual({ scenarioIds: [], packIds: [] });
    const row = getDb().prepare("SELECT ahd_user_id FROM users WHERE id = ?").get(r.body.user.id) as { ahd_user_id: string };
    expect(row.ahd_user_id).toBe(who.userId);

    // The same platform identity lands on the same game account next time.
    const again = await exchange({ code: code() });
    expect(again.body.user.id).toBe(r.body.user.id);
  });

  it("keys a Discord launcher identity by the platform's discord: id", async () => {
    const who = identity({ userId: "discord:123456789012345678", provider: "discord" });
    platformBody = { identity: who };
    const r = await exchange({ code: code() });
    expect(r.status).toBe(200);
    const row = getDb().prepare("SELECT ahd_user_id FROM users WHERE id = ?").get(r.body.user.id) as { ahd_user_id: string };
    expect(row.ahd_user_id).toBe("discord:123456789012345678");
  });

  it("links the account the player is already signed in to", async () => {
    const mine = localUser(`linkme_${ahdId()}@example.com`);
    platformBody = { identity: identity() };
    const r = await exchange({ code: code() }, mine.token);
    expect(r.status).toBe(200);
    expect(r.body.user.id).toBe(mine.id);
  });

  it("refuses to take over an existing account that shares the email", async () => {
    const email = `taken_${ahdId()}@example.com`;
    localUser(email);
    platformBody = { identity: identity({ email }) };
    const r = await exchange({ code: code() });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe("ACCOUNT_LINK_REQUIRES_PROOF");
    expect(r.body.token).toBeUndefined();
  });

  it("rejects a malformed code without asking the platform", async () => {
    for (const body of [{}, { code: "" }, { code: "short" }, { code: "a".repeat(129) }, { code: "has spaces in it ok?" }, { code: 42 }]) {
      expect((await exchange(body)).status).toBe(400);
    }
    expect(calls).toHaveLength(0);
  });

  it("answers 401 when the platform does not honour the code", async () => {
    for (const status of [400, 404, 410]) {
      platformStatus = status;
      platformBody = { error: "invalid_code" };
      const r = await exchange({ code: code() });
      expect(r.status).toBe(401);
      expect(r.body.token).toBeUndefined();
    }
  });

  it("answers 503 when the platform fails or answers with an unusable identity", async () => {
    for (const [status, body] of [
      [500, {}],
      [401, { error: "unauthorized" }],
      [200, {}],
      [200, { identity: identity({ userId: "not-a-platform-id" }) }],
      [200, { identity: identity({ username: "" }) }],
    ] as const) {
      platformStatus = status;
      platformBody = body;
      expect((await exchange({ code: code() })).status).toBe(503);
    }
  });

  it("refuses a code minted for another game", async () => {
    platformBody = { identity: identity({ game: "ahd" }) };
    expect((await exchange({ code: code() })).status).toBe(401);
  });

  it("asks for an email when the identity has none", async () => {
    platformBody = { identity: identity({ email: "" }) };
    const r = await exchange({ code: code() });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("EMAIL_REQUIRED");
  });

  it("is unavailable, not open, when the internal token is missing", async () => {
    const saved = process.env.INTERNAL_TOKEN;
    delete process.env.INTERNAL_TOKEN;
    try {
      platformBody = { identity: identity() };
      expect((await exchange({ code: code() })).status).toBe(503);
      expect(calls).toHaveLength(0);
    } finally {
      process.env.INTERNAL_TOKEN = saved;
    }
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
