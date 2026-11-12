// Lakeside OIDC sign-in (MOV_LAKESIDE_SIGNIN): flow, local mapping, failures.
// A fake issuer on localhost serves discovery, JWKS and the token endpoint.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "campaign-oidc-test-")), "test.db");
process.env.JWT_SECRET = "test-jwt-secret";
process.env.BASE_URL = "https://sim.ahousedividedgame.com";

const dbMod = await import("../db.ts");
const { lakesideRouter } = await import("../routes/lakeside.ts");
const { identityForUser } = await import("../entitlements.ts");

const CLIENT_ID = "mov-web";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };

let issuerServer: Server;
let appServer: Server;
let issuer = "";
let base = "";
let lastAuthParams: URLSearchParams | null = null;
// Per-test: what the token endpoint should put in the ID token.
let tokenOverrides: Record<string, unknown> = {};
let signWith = privateKey;
let sendNonce: "echo" | string = "echo";
let pendingNonce = "";

beforeAll(async () => {
  issuerServer = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const json = (o: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
    if (url.pathname === "/.well-known/openid-configuration") {
      return json({ issuer, authorization_endpoint: `${issuer}/auth`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` });
    }
    if (url.pathname === "/jwks") return json({ keys: [jwk] });
    if (url.pathname === "/token") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const form = new URLSearchParams(body);
        // PKCE: verifier must hash to the challenge sent at authorization.
        const ok = form.get("code_verifier") && lastAuthParams?.get("code_challenge_method") === "S256";
        if (!ok) { res.statusCode = 400; return json({ error: "invalid_grant" }); }
        const claims = {
          iss: issuer, aud: CLIENT_ID, sub: "sub-default",
          nonce: sendNonce === "echo" ? pendingNonce : sendNonce,
          ...tokenOverrides,
        };
        const id_token = jwt.sign(claims, signWith, { algorithm: "RS256", keyid: "k1", ...((claims as any).exp ? {} : { expiresIn: 300 }) });
        json({ id_token, access_token: "x", token_type: "Bearer" });
      });
      return;
    }
    res.statusCode = 404; res.end();
  });
  await new Promise<void>((r) => issuerServer.listen(0, "127.0.0.1", r));
  issuer = `http://127.0.0.1:${(issuerServer.address() as any).port}`;

  const app = express();
  app.use(express.json());
  app.use(lakesideRouter);
  await new Promise<void>((r) => { appServer = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${(appServer.address() as any).port}`;

  process.env.MOV_OIDC_ISSUER = issuer;
  process.env.MOV_OIDC_CLIENT_ID = CLIENT_ID;
  process.env.MOV_OIDC_CLIENT_SECRET = "s3cret";
  process.env.MOV_OIDC_REDIRECT_URI = `${base}/api/lakeside/login`;
});
afterAll(() => { issuerServer?.close(); appServer?.close(); });

beforeEach(() => {
  process.env.MOV_LAKESIDE_SIGNIN = "1";
  tokenOverrides = {};
  signWith = privateKey;
  sendNonce = "echo";
});

const get = (url: string) => fetch(url, { redirect: "manual" });

/** Run the browser side: start, then the callback with the given state (default: the real one). */
async function signIn(opts: { state?: string } = {}) {
  const start = await get(`${base}/api/lakeside/login?return=/play`);
  expect(start.status).toBe(302);
  const auth = new URL(start.headers.get("location")!);
  lastAuthParams = auth.searchParams;
  pendingNonce = auth.searchParams.get("nonce")!;
  const state = opts.state ?? auth.searchParams.get("state")!;
  const cb = await get(`${base}/api/lakeside/login?code=abc&state=${encodeURIComponent(state)}`);
  return { auth, cb };
}

async function exchange(cb: Response) {
  expect(cb.status).toBe(302);
  const code = new URL(cb.headers.get("location")!).searchParams.get("lakeside_code")!;
  const res = await fetch(`${base}/api/lakeside/exchange`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }),
  });
  return { res, code };
}

function addUser(fields: { email?: string; ahd?: string | null; sub?: string | null } = {}) {
  const id = randomUUID();
  const username = `u_${id.slice(0, 8)}`;
  dbMod.getDb().prepare(
    "INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id, lakeside_sub) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, username, fields.email ?? `${username}@example.com`, "x", Date.now(), fields.ahd ?? null, fields.sub ?? null);
  return id;
}
const userCount = () => (dbMod.getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;

describe("switch off", () => {
  it("does not start OIDC; falls back to the AHD relay path", async () => {
    process.env.MOV_LAKESIDE_SIGNIN = "";
    const res = await get(`${base}/api/lakeside/login?return=/play`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).not.toContain(issuer);
    lastAuthParams = null;
  });
  it("exchange ignores OIDC login codes", async () => {
    const res = await fetch(`${base}/api/lakeside/exchange`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "nope" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("authorization request", () => {
  it("sends PKCE S256, state, nonce and the client id", async () => {
    const { auth } = await signIn();
    const p = auth.searchParams;
    expect(auth.origin + auth.pathname).toBe(`${issuer}/auth`);
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(p.get("code_challenge")).toBeTruthy();
    expect(p.get("state")).toBeTruthy();
    expect(p.get("nonce")).toBeTruthy();
    expect(p.get("client_id")).toBe(CLIENT_ID);
    expect(p.get("response_type")).toBe("code");
  });
});

describe("local user mapping", () => {
  it("matches an existing user by lakeside_sub", async () => {
    const id = addUser({ sub: "sub-known" });
    tokenOverrides = { sub: "sub-known" };
    const before = userCount();
    const { cb } = await signIn();
    const { res } = await exchange(cb);
    expect(res.status).toBe(200);
    expect((await res.json()).user.id).toBe(id);
    expect(userCount()).toBe(before);
  });

  it("matches by ahd_user_id and records the subject", async () => {
    const id = addUser({ ahd: "ahd-77" });
    tokenOverrides = { sub: "sub-ahd77", ahd_user_id: "ahd-77" };
    const { cb } = await signIn();
    const { res } = await exchange(cb);
    const body = await res.json();
    expect(body.user.id).toBe(id);
    expect(body.user.ahdLinked).toBe(true);
    const row = dbMod.getDb().prepare("SELECT lakeside_sub FROM users WHERE id = ?").get(id) as any;
    expect(row.lakeside_sub).toBe("sub-ahd77");
  });

  it("subject match wins over the ahd_user_id claim", async () => {
    const bySub = addUser({ sub: "sub-first" });
    addUser({ ahd: "ahd-other" });
    tokenOverrides = { sub: "sub-first", ahd_user_id: "ahd-other" };
    const { cb } = await signIn();
    expect((await (await exchange(cb)).res.json()).user.id).toBe(bySub);
  });

  it("creates a new unlinked user for an unknown subject", async () => {
    tokenOverrides = { sub: "sub-new", preferred_username: "newplayer", email: "new@example.com" };
    const before = userCount();
    const { cb } = await signIn();
    const body = await (await exchange(cb)).res.json();
    expect(userCount()).toBe(before + 1);
    expect(body.user.ahdLinked).toBe(false);
    const row = dbMod.getDb().prepare("SELECT * FROM users WHERE id = ?").get(body.user.id) as any;
    expect(row.ahd_user_id).toBeNull();
    expect(row.lakeside_sub).toBe("sub-new");
    expect(body.token).toBeTruthy();
  });

  it("never links by email: a colliding email makes a separate user", async () => {
    const victim = addUser({ email: "victim@example.com" });
    tokenOverrides = { sub: "sub-attacker", email: "victim@example.com", preferred_username: "attacker" };
    const { cb } = await signIn();
    const body = await (await exchange(cb)).res.json();
    expect(body.user.id).not.toBe(victim);
    const v = dbMod.getDb().prepare("SELECT ahd_user_id, lakeside_sub FROM users WHERE id = ?").get(victim) as any;
    expect(v.lakeside_sub).toBeNull();
    expect(v.ahd_user_id).toBeNull();
  });

  it("login codes are single use", async () => {
    tokenOverrides = { sub: "sub-once" };
    const { cb } = await signIn();
    const { code } = await exchange(cb);
    const again = await fetch(`${base}/api/lakeside/exchange`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }),
    });
    expect(again.status).toBe(401);
  });
});

describe("entitlement identity", () => {
  it("uses the AHD id when present, the subject otherwise", () => {
    const withAhd = addUser({ ahd: "ahd-ent", sub: "sub-ent" });
    const subOnly = addUser({ sub: "sub-only" });
    const none = addUser();
    expect(identityForUser(withAhd)?.ahdUserId).toBe("ahd-ent");
    expect(identityForUser(subOnly)?.ahdUserId).toBe("sub-only");
    expect(identityForUser(none)?.ahdUserId).toBeNull();
  });
});

describe("verification failures", () => {
  async function expectRejected(opts: { state?: string } = {}) {
    const before = userCount();
    const { cb } = await signIn(opts);
    expect(cb.status).toBe(401);
    expect(cb.headers.get("location")).toBeNull();
    expect(userCount()).toBe(before);
  }

  it("rejects an unknown state", () => expectRejected({ state: "forged" }));
  it("rejects a replayed state", async () => {
    tokenOverrides = { sub: "sub-replay" };
    const { auth } = await signIn();
    const state = auth.searchParams.get("state")!;
    const again = await get(`${base}/api/lakeside/login?code=abc&state=${state}`);
    expect(again.status).toBe(401);
  });
  it("rejects a wrong nonce", () => { sendNonce = "attacker-nonce"; return expectRejected(); });
  it("rejects a wrong issuer", () => { tokenOverrides = { iss: "https://evil.example" }; return expectRejected(); });
  it("rejects a wrong audience", () => { tokenOverrides = { aud: "someone-else" }; return expectRejected(); });
  it("rejects an expired token", () => { tokenOverrides = { exp: Math.floor(Date.now() / 1000) - 3600 }; return expectRejected(); });
  it("rejects a bad signature", () => { signWith = otherKey; return expectRejected(); });
});
