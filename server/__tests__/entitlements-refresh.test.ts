// POST /api/auth/entitlements/refresh: re-ask the platform what this account
// owns, skipping the short cache, without ever granting anything itself.
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import http, { type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "mov-refresh-test-")), "test.db");
process.env.JWT_SECRET = "fixture-refresh-jwt";
process.env.INTERNAL_TOKEN = "fixture-refresh-internal";
const { getDb } = await import("../db.ts");
const { signToken } = await import("../auth.ts");
const { authRouter } = await import("../routes/auth.ts");
const { clearEntitlementsCache } = await import("../entitlements.ts");
const { grantUnlock } = await import("../activation.ts");

let api: Server, platform: Server, base: string;
let platformPurchases: unknown[] = [];
let platformStatus = 200;
let platformHits = 0;

function user(linked: boolean) {
  const id = randomUUID(), username = "u_" + id.slice(0, 8);
  getDb().prepare("INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id) VALUES (?, ?, ?, 'x', ?, ?)")
    .run(id, username, username + "@example.com", Date.now(), linked ? "lakeside-" + id : null);
  return { id, token: signToken({ userId: id, username }) };
}
const paid = (productId: string, over: Record<string, unknown> = {}) => ({ game: "electioneer", productId, status: "paid", provider: "stripe", amountCents: 99, ...over });
async function refresh(token?: string) {
  const r = await fetch(base + "/api/auth/entitlements/refresh", { method: "POST", headers: token ? { Authorization: "Bearer " + token } : {} });
  return { status: r.status, cache: r.headers.get("cache-control"), body: await r.json() as { verified: boolean; unlocked: { packIds: string[]; scenarioIds: string[] } } };
}

beforeAll(async () => {
  platform = http.createServer((_req, res) => {
    platformHits++;
    res.writeHead(platformStatus, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ purchases: platformPurchases }));
  });
  await new Promise<void>((r) => platform.listen(0, "127.0.0.1", () => r()));
  process.env.LAKESIDE_ENTITLEMENTS_URL = "http://127.0.0.1:" + (platform.address() as { port: number }).port;
  const app = express(); app.use(express.json()); app.use("/api/auth", authRouter);
  await new Promise<void>((r) => { api = app.listen(0, "127.0.0.1", () => r()); });
  base = "http://127.0.0.1:" + (api.address() as { port: number }).port;
});
afterAll(async () => {
  await Promise.all([new Promise<void>((r) => api.close(() => r())), new Promise<void>((r) => platform.close(() => r()))]);
});
beforeEach(() => { clearEntitlementsCache(); platformPurchases = []; platformStatus = 200; platformHits = 0; });
afterEach(() => vi.restoreAllMocks());

describe("entitlement refresh", () => {
  it("needs a signed-in player", async () => {
    expect((await refresh()).status).toBe(401);
  });

  it("reports what the platform says the account owns, expanded to elections, uncached", async () => {
    const a = user(true);
    platformPurchases = [paid("canada")];
    const res = await refresh(a.token);
    expect(res.status).toBe(200);
    expect(res.cache).toBe("private, no-store");
    expect(res.body.verified).toBe(true);
    expect(res.body.unlocked.packIds).toEqual(["canada"]);
    expect(res.body.unlocked.scenarioIds).toContain("ca-2025");
  });

  it("picks up a purchase made after the cached read, without waiting out the cache", async () => {
    const a = user(true);
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    expect((await refresh(a.token)).body.unlocked.packIds).toEqual([]);
    platformPurchases = [paid("germany")];
    clock.mockReturnValue(now + 3_000); // past the 2s throttle, well inside the 30s cache
    expect((await refresh(a.token)).body.unlocked.packIds).toEqual(["germany"]);
  });

  it("throttles a stuck client: a second call within seconds does not hit the platform again", async () => {
    const a = user(true);
    await refresh(a.token);
    const after = platformHits;
    platformPurchases = [paid("france")];
    const second = await refresh(a.token);
    expect(platformHits).toBe(after);
    expect(second.body.unlocked.packIds).toEqual([]); // served from the cache; the next real refresh sees it
  });

  it("says unverified, and keeps local code unlocks, when the platform is down", async () => {
    const a = user(true);
    grantUnlock(a.id, null, "uk-elections", "CAMP-TEST");
    platformStatus = 503;
    const res = await refresh(a.token);
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
    expect(res.body.unlocked.packIds).toEqual(["uk-elections"]);
  });

  it("never reports a pack from another game, a refund, or an unknown id as owned", async () => {
    const a = user(true);
    platformPurchases = [paid("canada", { game: "someothergame" }), paid("germany", { status: "refunded" }), paid("not-a-pack")];
    const res = await refresh(a.token);
    expect(res.body.unlocked.packIds).toEqual([]);
  });

  it("is a clean empty answer, with no platform call, for an account not linked to Lakeside", async () => {
    const a = user(false);
    platformPurchases = [paid("complete")];
    const res = await refresh(a.token);
    expect(res.body).toMatchObject({ verified: true, unlocked: { packIds: [] } });
    expect(platformHits).toBe(0);
  });
});
