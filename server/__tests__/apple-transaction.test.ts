// An App Store purchase on its way from the iPhone app to the Lakeside account.
//
// The app sends StoreKit's signed transaction (a JWS: ES256, with the signing
// certificate chain in the x5c header) to POST /api/store/verify. This server
// does not decode it: it forwards it untouched to the Lakeside account
// service, which checks the chain against Apple's root certificates, asks
// Apple's App Store Server API for the transaction, and records the pack.
//
// The fixture is a real-format Sandbox transaction for the Canada pack, signed
// by a throwaway test chain (the keys were deleted after signing). The stub
// account service below verifies it the way the real one does: pinned root,
// chain, signature, then the same purchase rules. That proves the format and
// the whole hand-off here. It cannot prove Apple's own signature: only a
// purchase signed by Apple can, which is why a StoreKit testing transaction
// (signed by Xcode) is refused by the real service, as the last tests show.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http, { type Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, verify as verifySignature, X509Certificate } from "node:crypto";

process.env.CAMPAIGN_DB_PATH = join(mkdtempSync(join(tmpdir(), "mov-apple-jws-test-")), "test.db");
process.env.JWT_SECRET = "fixture-apple-jwt";
process.env.MOV_STORE_BRIDGE_TOKEN = "fixture-apple-bridge";
const { getDb } = await import("../db.ts");
const { signToken } = await import("../auth.ts");
const { storeRouter } = await import("../routes/store.ts");
const { STORE_PACKS } = await import("../../src/content/packs.ts");

const fixtures = fileURLToPath(new URL("./fixtures", import.meta.url));
const fixture = JSON.parse(readFileSync(join(fixtures, "apple-signed-transaction.json"), "utf8")) as { testRoot: string; signedTransaction: string };
const TEST_ROOT = Buffer.from(fixture.testRoot, "base64");
const APPLE_ROOT_G3 = readFileSync(join(fixtures, "AppleRootCA-G3.cer"));
const BUNDLE = "com.lakesidegames.electioneer";

// App Store product id for a pack, as configured in App Store Connect and in
// the account service's product table.
const appleSku = (packId: string) => `${BUNDLE}.${packId.replace(/-/g, "_")}`;

type Payload = Record<string, unknown>;
class Rejected extends Error {}

// What the account service's SignedDataVerifier and receipt rules check.
function verifyAppleTransaction(jws: string, trustedRoot: Buffer): Payload {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Rejected("not a JWS");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()) as { alg?: string; x5c?: string[] };
  if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length !== 3) throw new Rejected("bad header");
  const [leaf, intermediate, root] = header.x5c.map((c) => new X509Certificate(Buffer.from(c, "base64")));
  if (!root.raw.equals(trustedRoot)) throw new Rejected("untrusted root");
  if (!intermediate.checkIssued(root) || !intermediate.verify(root.publicKey)) throw new Rejected("bad intermediate");
  if (!leaf.checkIssued(intermediate) || !leaf.verify(intermediate.publicKey)) throw new Rejected("bad leaf");
  const ok = verifySignature("sha256", Buffer.from(`${parts[0]}.${parts[1]}`),
    { key: leaf.publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(parts[2], "base64url"));
  if (!ok) throw new Rejected("bad signature");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Payload;
  const signedAt = payload.signedDate as number;
  if (!(signedAt >= Date.parse(leaf.validFrom) && signedAt <= Date.parse(leaf.validTo))) throw new Rejected("signed outside the certificate's validity");
  return payload;
}
function packForReceipt(p: Payload): string {
  if (p.bundleId !== BUNDLE || p.type !== "Non-Consumable" || p.inAppOwnershipType !== "PURCHASED" ||
      (p.quantity != null && p.quantity !== 1) || !["Production", "Sandbox"].includes(p.environment as string) ||
      !/^\d{1,40}$/.test(String(p.originalTransactionId ?? "")) || !/^\d{1,40}$/.test(String(p.transactionId ?? "")) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(p.appAccountToken ?? ""))) {
    throw new Rejected("not an account-bound MOV pack purchase");
  }
  const pack = STORE_PACKS.find((s) => appleSku(s.id) === p.productId);
  if (!pack) throw new Rejected("not a MOV pack");
  return pack.id;
}

let api: Server, platform: Server, base: string;
let trustedRoot = TEST_ROOT;
let appleReachable = true;
let received: Record<string, unknown> = {}, credential = "";

function linkedUser() {
  const id = randomUUID(), username = "u_" + id.slice(0, 8);
  getDb().prepare("INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id) VALUES (?, ?, ?, 'x', ?, ?)")
    .run(id, username, username + "@example.com", Date.now(), "lakeside-" + id);
  return { id, owner: "lakeside-" + id, token: signToken({ userId: id, username }) };
}
async function verifyCall(token: string, signedTransaction: string) {
  const r = await fetch(base + "/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ store: "apple", signedTransaction }),
  });
  return { status: r.status, body: await r.json() as Record<string, unknown> };
}
// Same signature, edited payload: what a tampered or replayed receipt looks like.
function withPayload(jws: string, edit: (p: Payload) => Payload): string {
  const [h, p, s] = jws.split(".");
  const payload = edit(JSON.parse(Buffer.from(p, "base64url").toString()) as Payload);
  return `${h}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${s}`;
}

beforeAll(async () => {
  // Stub of the account service's /verify, with the real checks.
  platform = http.createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk);
    received = JSON.parse(Buffer.concat(chunks).toString() || "{}"); credential = req.headers.authorization || "";
    const reply = (status: number, body: unknown) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (!appleReachable) return reply(503, { error: "App Store verification is temporarily unavailable." });
    try {
      const payload = verifyAppleTransaction(String(received.signedTransaction), trustedRoot);
      const packId = packForReceipt(payload);
      reply(200, { verified: true, status: "paid", packId, environment: payload.environment, productId: payload.productId });
    } catch (e) {
      reply(400, { error: e instanceof Rejected ? "The App Store signature or app identity could not be verified." : "Invalid receipt." });
    }
  });
  await new Promise<void>((r) => platform.listen(0, "127.0.0.1", () => r()));
  process.env.LAKESIDE_STORE_URL = "http://127.0.0.1:" + (platform.address() as { port: number }).port;
  process.env.LAKESIDE_ENTITLEMENTS_URL = process.env.LAKESIDE_STORE_URL;
  process.env.INTERNAL_TOKEN = "fixture-entitlements";
  const app = express(); app.use(express.json({ limit: "100kb" })); app.use("/api/store", storeRouter);
  await new Promise<void>((r) => { api = app.listen(0, "127.0.0.1", () => r()); });
  base = "http://127.0.0.1:" + (api.address() as { port: number }).port + "/api/store";
});
afterAll(async () => {
  await Promise.all([new Promise<void>((r) => api.close(() => r())), new Promise<void>((r) => platform.close(() => r()))]);
});

describe("App Store signed transaction fixture", () => {
  it("has the format StoreKit sends: ES256 with a three-certificate chain", () => {
    const header = JSON.parse(Buffer.from(fixture.signedTransaction.split(".")[0], "base64url").toString());
    expect(header.alg).toBe("ES256");
    expect(header.x5c).toHaveLength(3);
    // Real Apple transactions are about 4 to 6 KB; the server accepts up to 40,000 characters.
    expect(fixture.signedTransaction.length).toBeGreaterThan(2000);
    expect(fixture.signedTransaction.length).toBeLessThan(40_000);
  });

  it("verifies against its own root and passes the account service's purchase rules for the Canada pack", () => {
    const payload = verifyAppleTransaction(fixture.signedTransaction, TEST_ROOT);
    expect(payload.environment).toBe("Sandbox");
    expect(packForReceipt(payload)).toBe("canada");
  });

  it("maps all 15 App Store products to distinct packs", () => {
    const skus = STORE_PACKS.map((p) => appleSku(p.id));
    expect(skus).toHaveLength(15);
    expect(new Set(skus).size).toBe(15);
    expect(skus).toContain(`${BUNDLE}.complete`);
    expect(skus).toContain(`${BUNDLE}.us_historical`);
    expect(skus).toContain(`${BUNDLE}.new_zealand`);
  });
});

describe("POST /api/store/verify with an App Store transaction", () => {
  it("forwards the signed transaction untouched and returns the verified Sandbox purchase", async () => {
    trustedRoot = TEST_ROOT; appleReachable = true;
    const a = linkedUser();
    const out = await verifyCall(a.token, fixture.signedTransaction);
    expect(received).toEqual({ ahdUserId: a.owner, store: "apple", signedTransaction: fixture.signedTransaction });
    expect(credential).toBe("Bearer fixture-apple-bridge");
    expect(out.status).toBe(200);
    // The iPhone app reads verified, status and environment (StoreKitAdapter.deliver).
    expect(out.body).toMatchObject({ verified: true, status: "paid", packId: "canada", environment: "Sandbox" });
  });

  it("refuses a transaction whose payload was edited after signing", async () => {
    trustedRoot = TEST_ROOT; appleReachable = true;
    const a = linkedUser();
    const tampered = withPayload(fixture.signedTransaction, (p) => ({ ...p, productId: `${BUNDLE}.complete` }));
    const out = await verifyCall(a.token, tampered);
    // A 4xx keeps the StoreKit transaction unfinished on the phone, so nothing is lost.
    expect(out.status).toBe(400);
    expect(out.body.error).toMatch(/could not be verified/);
  });

  it("refuses a purchase that is not bound to a Lakeside account", async () => {
    trustedRoot = TEST_ROOT; appleReachable = true;
    const a = linkedUser();
    // Re-signing is impossible (keys deleted), so check the rule on the decoded payload.
    const payload = verifyAppleTransaction(fixture.signedTransaction, TEST_ROOT);
    expect(() => packForReceipt({ ...payload, appAccountToken: undefined })).toThrow(Rejected);
    expect(() => packForReceipt({ ...payload, bundleId: "com.example.other" })).toThrow(Rejected);
    expect(() => packForReceipt({ ...payload, environment: "Xcode" })).toThrow(Rejected);
    expect((await verifyCall(a.token, withPayload(fixture.signedTransaction, (p) => ({ ...p, appAccountToken: undefined })))).status).toBe(400);
  });

  it("is refused against Apple's real root, like every StoreKit testing transaction", async () => {
    // The real service pins Apple Root CA G2 and G3. Anything not signed by
    // Apple (this fixture, or a transaction from Xcode's StoreKit testing in a
    // simulator) fails there, before any App Store lookup.
    expect(() => verifyAppleTransaction(fixture.signedTransaction, APPLE_ROOT_G3)).toThrow(/untrusted root/);
    trustedRoot = APPLE_ROOT_G3; appleReachable = true;
    const a = linkedUser();
    const out = await verifyCall(a.token, fixture.signedTransaction);
    expect(out.status).toBe(400);
  });

  it("passes an App Store outage back as retryable", async () => {
    trustedRoot = TEST_ROOT; appleReachable = false;
    const a = linkedUser();
    const out = await verifyCall(a.token, fixture.signedTransaction);
    expect(out.status).toBe(503);
    expect(out.body.error).toMatch(/temporarily unavailable/);
    appleReachable = true;
  });
});
