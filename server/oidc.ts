// Lakeside sign-in via OpenID Connect (stage 4), behind MOV_LAKESIDE_SIGNIN.
//
// Authorization-code flow with PKCE S256, state and nonce, against the central
// issuer. The ID token is verified here (signature via the issuer JWKS, issuer,
// audience, nonce, expiry). Uses jsonwebtoken (already a dependency) plus
// node:crypto JWK import, so no new package is needed.
//
// Local mapping NEVER uses email: issuer subject first, then the ahd_user_id
// claim, else a brand new local user with no AHD link.

import { createHash, createPublicKey, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDb, type UserRow } from "./db.js";

export function lakesideSigninEnabled(): boolean {
  return /^(1|true|on|yes)$/i.test(process.env.MOV_LAKESIDE_SIGNIN ?? "");
}

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function oidcConfig(): OidcConfig | null {
  const issuer = process.env.MOV_OIDC_ISSUER?.replace(/\/+$/, "");
  const clientId = process.env.MOV_OIDC_CLIENT_ID;
  const clientSecret = process.env.MOV_OIDC_CLIENT_SECRET;
  const redirectUri = process.env.MOV_OIDC_REDIRECT_URI;
  if (!issuer || !clientId || !clientSecret || !redirectUri) return null;
  return { issuer, clientId, clientSecret, redirectUri };
}

export class OidcError extends Error {}

const FLOW_TTL_MS = 10 * 60_000;
export const LOGIN_CODE_TTL_MS = 60_000;

// ── Discovery and JWKS (cached briefly, failures never cached) ──────────────

interface Discovery { authorization_endpoint: string; token_endpoint: string; jwks_uri: string; issuer: string }
let discoveryCache: { at: number; issuer: string; doc: Discovery } | null = null;
const jwksCache = new Map<string, { at: number; keys: JsonWebKey[] & { kid?: string }[] }>();
const CACHE_MS = 10 * 60_000;

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new OidcError(`OIDC request failed (${res.status})`);
  return res.json();
}

export async function discover(cfg: OidcConfig): Promise<Discovery> {
  if (discoveryCache && discoveryCache.issuer === cfg.issuer && Date.now() - discoveryCache.at < CACHE_MS) return discoveryCache.doc;
  const doc = (await getJson(`${cfg.issuer}/.well-known/openid-configuration`)) as Discovery;
  if (doc.issuer !== cfg.issuer) throw new OidcError("Discovery issuer mismatch");
  if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri) throw new OidcError("Incomplete discovery document");
  discoveryCache = { at: Date.now(), issuer: cfg.issuer, doc };
  return doc;
}

async function jwks(uri: string, force = false): Promise<any[]> {
  const hit = jwksCache.get(uri);
  if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.keys as any[];
  const body = await getJson(uri);
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  jwksCache.set(uri, { at: Date.now(), keys });
  return keys;
}

// ── Authorization request ────────────────────────────────────────────────────

const b64url = (buf: Buffer) => buf.toString("base64url");

export async function beginAuthorization(returnUrl: string, now = Date.now()): Promise<string> {
  const cfg = oidcConfig();
  if (!cfg) throw new OidcError("OIDC not configured");
  const disc = await discover(cfg);
  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const db = getDb();
  db.prepare("DELETE FROM oidc_flows WHERE expires_at < ?").run(now);
  db.prepare("INSERT INTO oidc_flows (state, nonce, verifier, return_url, expires_at) VALUES (?, ?, ?, ?, ?)")
    .run(state, nonce, verifier, returnUrl, now + FLOW_TTL_MS);
  const url = new URL(disc.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ── Callback ─────────────────────────────────────────────────────────────────

export interface LakesideClaims {
  sub: string;
  ahdUserId: string | null;
  username: string | null;
  email: string | null;
}

/** Verify an ID token against issuer JWKS, issuer, audience, nonce and expiry. */
export async function verifyIdToken(idToken: string, cfg: OidcConfig, nonce: string, jwksUri: string): Promise<LakesideClaims> {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === "string") throw new OidcError("Malformed ID token");
  const { kid, alg } = decoded.header;
  if (!alg || !/^(RS|PS|ES)(256|384|512)$/.test(alg)) throw new OidcError("Unsupported ID token algorithm");
  let keys = await jwks(jwksUri);
  let jwk = keys.find((k) => (kid ? k.kid === kid : true));
  if (!jwk) { keys = await jwks(jwksUri, true); jwk = keys.find((k) => (kid ? k.kid === kid : true)); }
  if (!jwk) throw new OidcError("Signing key not found");
  let claims: jwt.JwtPayload;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" });
    claims = jwt.verify(idToken, key, {
      algorithms: [alg as jwt.Algorithm],
      issuer: cfg.issuer,
      audience: cfg.clientId,
    }) as jwt.JwtPayload;
  } catch (e) {
    throw new OidcError(`ID token rejected: ${(e as Error).message}`);
  }
  if (typeof claims.exp !== "number") throw new OidcError("ID token has no expiry");
  if (claims.nonce !== nonce) throw new OidcError("Nonce mismatch");
  if (typeof claims.sub !== "string" || !claims.sub) throw new OidcError("ID token has no subject");
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    sub: claims.sub,
    ahdUserId: str(claims.ahd_user_id),
    username: str(claims.preferred_username) ?? str(claims.name),
    email: str(claims.email),
  };
}

/** Finish the flow: consume state, exchange the code, verify the token. Returns claims and the stored return URL. */
export async function completeAuthorization(code: string, state: string, now = Date.now()): Promise<{ claims: LakesideClaims; returnUrl: string }> {
  const cfg = oidcConfig();
  if (!cfg) throw new OidcError("OIDC not configured");
  const db = getDb();
  // Single use: claim and delete in one step so a replayed state fails.
  const flow = db.prepare("SELECT * FROM oidc_flows WHERE state = ?").get(state) as
    | { nonce: string; verifier: string; return_url: string; expires_at: number } | undefined;
  const removed = db.prepare("DELETE FROM oidc_flows WHERE state = ?").run(state);
  if (!flow || removed.changes === 0 || flow.expires_at < now) throw new OidcError("Unknown or expired state");
  const disc = await discover(cfg);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code_verifier: flow.verifier,
  });
  const tokens = await getJson(disc.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (typeof tokens?.id_token !== "string") throw new OidcError("No ID token returned");
  const claims = await verifyIdToken(tokens.id_token, cfg, flow.nonce, disc.jwks_uri);
  return { claims, returnUrl: flow.return_url };
}

// ── Local user mapping (never by email) ──────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function availableUsername(wanted: string | null): string {
  const db = getDb();
  let base = (wanted ?? "").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);
  if (!USERNAME_RE.test(base)) base = `player_${randomBytes(3).toString("hex")}`;
  let candidate = base;
  for (let i = 2; db.prepare("SELECT 1 FROM users WHERE username = ?").get(candidate); i++) {
    const suffix = String(i);
    candidate = base.slice(0, 20 - suffix.length) + suffix;
  }
  return candidate;
}

export function resolveLakesideUser(c: LakesideClaims): UserRow {
  const db = getDb();
  const get = (sql: string, v: string) => db.prepare(sql).get(v) as UserRow | undefined;

  const bySub = get("SELECT * FROM users WHERE lakeside_sub = ?", c.sub);
  if (bySub) return bySub;

  if (c.ahdUserId) {
    const byAhd = get("SELECT * FROM users WHERE ahd_user_id = ?", c.ahdUserId);
    if (byAhd) {
      // Remember the subject so the next sign-in matches directly.
      db.prepare("UPDATE users SET lakeside_sub = ? WHERE id = ? AND lakeside_sub IS NULL").run(c.sub, byAhd.id);
      return get("SELECT * FROM users WHERE id = ?", byAhd.id)!;
    }
  }

  // New local user. The email column is NOT NULL UNIQUE; if the claimed email
  // is already taken by anyone else we do not touch that account, we use an
  // unroutable placeholder instead.
  const id = randomUUID();
  let email = c.email?.toLowerCase() ?? null;
  if (!email || db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) email = `${c.sub}@lakeside.invalid`;
  db.prepare(
    "INSERT INTO users (id, username, email, password_hash, created_at, ahd_user_id, lakeside_sub) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, availableUsername(c.username), email, bcrypt.hashSync(randomBytes(32).toString("hex"), 10), Date.now(), c.ahdUserId, c.sub);
  return get("SELECT * FROM users WHERE id = ?", id)!;
}

// ── Single-use local login codes ─────────────────────────────────────────────

export function mintLoginCode(userId: string, now = Date.now()): string {
  const code = randomBytes(24).toString("base64url");
  getDb().prepare("INSERT INTO lakeside_login_codes (code, user_id, expires_at, used) VALUES (?, ?, ?, 0)")
    .run(code, userId, now + LOGIN_CODE_TTL_MS);
  return code;
}

export function redeemLoginCode(code: string, now = Date.now()): UserRow | null {
  const db = getDb();
  const claim = db.prepare("UPDATE lakeside_login_codes SET used = 1 WHERE code = ? AND used = 0 AND expires_at > ?").run(code, now);
  if (claim.changes === 0) return null;
  const row = db.prepare("SELECT user_id FROM lakeside_login_codes WHERE code = ?").get(code) as { user_id: string };
  db.prepare("DELETE FROM lakeside_login_codes WHERE expires_at < ?").run(now - LOGIN_CODE_TTL_MS);
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id) as UserRow | undefined) ?? null;
}
