// Lakeside ID routes.
//
// Player-facing:
//   GET /api/lakeside/login?return=   bounce the browser through lakeside-auth
//                                     (/auth/ahd), redeem the broker code, then
//                                     redirect to return?lakeside_code= (local
//                                     one-time code the SPA exchanges).
//   POST /api/lakeside/exchange       { code } -> { token, user } (public; the
//                                     code itself is the credential)
//   GET /api/lakeside/handoff?return= SSO for OTHER lakesidegames.net apps:
//                                     same broker bounce, then 302 to
//                                     return?code=<60s local single-use>
//
// Launcher-facing (public; see launcherHandoff.ts):
//   POST /api/lakeside/launcher-exchange { code } -> { token, user, unlocked },
//                                     where code is the platform's single-use
//                                     launcher code, redeemed server to server
//   GET /api/lakeside/launcher-packs?owned=a,b  pack names and election counts
//                                     for the product ids the launcher owns
//
// Portal-facing (Authorization: Bearer INTERNAL_TOKEN):
//   POST /api/internal/redeem-handoff  { code } -> identity, once
//   GET  /api/internal/entitlements?ahdUserId=&email=
//
// Why a one-time code instead of an HTML token-drop page for login: the SPA
// stores its JWT in localStorage, which is per-origin. A page served by
// sim.ahousedividedgame.com can only write sim's localStorage, so it would
// break the /games/electioneer mount. Redirecting back to the
// caller's own origin with a short-lived code lets the SPA store the token in
// the right origin, and the same flow works on both hosts.

import { Router, type Response } from "express";
import { signToken, verifyToken } from "../auth.js";
import { unlockedForUserWithPlatform } from "../activation.js";
import {
  checkInternalToken, configuredBaseUrl, getLakesideAuthClient, identityFromAuth,
  lakesideAuthAhdOrigin, linkOrCreateUser, mintHandoffCode, redeemHandoffCode,
  resolveReturnUrl, AccountLinkConflictError, type LakesideIdentity,
} from "../lakeside.js";
import { launcherPackSummary, parseOwnedQuery, redeemLauncherCode, isLauncherCodeShape } from "../launcherHandoff.js";

const AHD_LOGIN_URL = "https://www.ahousedividedgame.com/login";

function baseUrl(): string {
  return configuredBaseUrl();
}

/** Start URL for a broker bounce that returns to `path` with the same ?return=. */
function brokerStartUrl(path: "/api/lakeside/login" | "/api/lakeside/handoff", targetReturn: string): string | null {
  const client = getLakesideAuthClient();
  if (!client) return null;
  const callback = new URL(`${baseUrl()}${path}`);
  callback.searchParams.set("return", targetReturn);
  const ahdOrigin = lakesideAuthAhdOrigin();
  return ahdOrigin
    ? client.loginUrl("ahd", callback.toString(), ahdOrigin)
    : client.loginUrl("ahd", callback.toString());
}

/** Redeem a lakeside-auth handoff code into a local LakesideIdentity. */
async function redeemBrokerCode(code: string): Promise<LakesideIdentity | null> {
  const client = getLakesideAuthClient();
  if (!client) return null;
  try {
    const result = await client.redeem(code);
    if (!result) return null;
    return identityFromAuth(result.identity);
  } catch {
    return null;
  }
}

/** The local account behind an optional Bearer session, if it is valid. */
function signedInUserId(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7))?.userId ?? null;
}

/**
 * Link or create the local account for a verified Lakeside identity and answer
 * with the game's own session. A valid Bearer on the request is the account
 * the player already holds here, linked in place when it has no Lakeside link.
 */
async function signInAs(identity: LakesideIdentity, authorization: string | undefined, res: Response): Promise<void> {
  let user;
  try {
    user = linkOrCreateUser(identity, signedInUserId(authorization));
  } catch (error) {
    if (error instanceof AccountLinkConflictError) {
      res.status(409).json({ error: error.message, code: "ACCOUNT_LINK_REQUIRES_PROOF" });
      return;
    }
    throw error;
  }
  res.json({
    token: signToken({ userId: user.id, username: user.username }),
    user: { id: user.id, username: user.username, email: user.email, ahdLinked: true },
    unlocked: await unlockedForUserWithPlatform(user.id),
  });
}

export const lakesideRouter = Router();

lakesideRouter.get("/api/lakeside/login", async (req, res) => {
  const target = resolveReturnUrl(typeof req.query.return === "string" ? req.query.return : undefined, baseUrl());
  if (!target) return res.status(400).json({ error: "Return URL not allowed" });

  // Callback from lakeside-auth: ?code= is the broker handoff.
  const brokerCode = typeof req.query.code === "string" ? req.query.code : undefined;
  if (brokerCode) {
    const identity = await redeemBrokerCode(brokerCode);
    if (!identity) return res.redirect(AHD_LOGIN_URL);
    const url = new URL(target);
    url.searchParams.set("lakeside_code", mintHandoffCode(identity));
    return res.redirect(url.toString());
  }

  const start = brokerStartUrl("/api/lakeside/login", target);
  if (!start) return res.redirect(AHD_LOGIN_URL);
  res.redirect(start);
});

lakesideRouter.post("/api/lakeside/exchange", async (req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code) return res.status(400).json({ error: "Code required" });
  const identity = redeemHandoffCode(code);
  if (!identity) return res.status(401).json({ error: "Sign in link expired, try again" });
  await signInAs(identity, req.headers.authorization, res);
});

lakesideRouter.post("/api/lakeside/launcher-exchange", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const { code } = req.body ?? {};
  if (!isLauncherCodeShape(code)) return res.status(400).json({ error: "Code required" });
  const result = await redeemLauncherCode(code);
  if (!result.ok) {
    if (result.reason === "invalid") {
      return res.status(401).json({ error: "The launcher sign in expired. Open the game from the launcher again." });
    }
    if (result.reason === "email-required") {
      return res.status(422).json({ error: "Your Lakeside account has no email address, which a game account needs.", code: "EMAIL_REQUIRED" });
    }
    return res.status(503).json({ error: "Lakeside sign in is unavailable right now. Try again shortly." });
  }
  await signInAs(result.identity, req.headers.authorization, res);
});

lakesideRouter.get("/api/lakeside/launcher-packs", (req, res) => {
  // Same answer for everyone who sends the same ids: no account data involved.
  res.set("Cache-Control", "public, max-age=300");
  res.json(launcherPackSummary(parseOwnedQuery(req.query.owned)));
});

lakesideRouter.get("/api/lakeside/handoff", async (req, res) => {
  const raw = typeof req.query.return === "string" ? req.query.return : undefined;
  if (!raw) return res.status(400).json({ error: "return required" });
  const target = resolveReturnUrl(raw, baseUrl());
  if (!target) return res.status(400).json({ error: "Return URL not allowed" });

  const brokerCode = typeof req.query.code === "string" ? req.query.code : undefined;
  if (brokerCode) {
    const identity = await redeemBrokerCode(brokerCode);
    if (!identity) return res.redirect(AHD_LOGIN_URL);
    const url = new URL(target);
    url.searchParams.set("code", mintHandoffCode(identity));
    return res.redirect(url.toString());
  }

  const start = brokerStartUrl("/api/lakeside/handoff", target);
  if (!start) return res.redirect(AHD_LOGIN_URL);
  res.redirect(start);
});

lakesideRouter.post("/api/internal/redeem-handoff", (req, res) => {
  if (!checkInternalToken(req.headers.authorization)) return res.status(401).json({ error: "Unauthorized" });
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code) return res.status(400).json({ error: "Code required" });
  const identity = redeemHandoffCode(code);
  if (!identity) return res.status(404).json({ error: "Code invalid, used, or expired" });
  res.json(identity);
});

// RETIRED: commerce moved to the Lakeside platform, which now owns the purchase
// ledger and serves entitlements directly. The account portal reads the
// platform, not this game. Kept as a 410 so any stale caller gets a clear
// signal instead of a silent 404.
lakesideRouter.all("/api/internal/entitlements", (_req, res) => {
  res.status(410).json({ error: "Gone: entitlements are served by the Lakeside platform" });
});
