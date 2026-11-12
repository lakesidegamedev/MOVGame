// Lakeside launcher handoff.
//
// The desktop launcher holds a Lakeside platform session. To open this game
// already signed in, it asks the platform for a short-lived, single-use code
// bound to this game's client id and opens the game with it in the URL
// fragment (#launcher_code=). The fragment never reaches a server log or a
// Referer header. The SPA posts the code to /api/lakeside/launcher-exchange,
// and this module redeems it with the platform server to server. The game then
// issues its own session as it does for any Lakeside sign-in.
//
// Redeem contract (shared with every launcher game):
//   POST <platform>/account/launcher/handoff/redeem { code, clientId }
//   200 { accountId, displayName, entitlements }   400 invalid_request   429
// The call is public: the single-use code is the only credential, so no game
// secret is sent. The answer carries no email.
//
// The launcher's platform token never reaches the game, and the code is
// useless after one use or once it expires (the platform's job: 60 seconds).
//
// Separately, launcherPackSummary turns the platform product ids the launcher
// already holds into Margin of Victory pack names and election counts, so the
// launcher tile can show what the player owns without hard-coding content.

import { PACKS, PACKS_BY_ID, STORE_PACKS, packCovered } from "../src/content/packs.js";
import { SCENARIO_REGISTRY } from "../src/content/scenarioRegistry.js";
import type { LakesideIdentity } from "./lakeside.js";

const GAME = "electioneer";
/** This game's launcher client id on the platform. */
export const LAUNCHER_CLIENT_ID = "margin-of-victory";
const TIMEOUT_MS = 5_000;

/** Shape of a launcher code: opaque base64url, bounded so junk never goes upstream. */
const CODE_RE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Platform account ids the redeem call can return: a 24-hex A House Divided
 * id, or a Discord id namespaced as discord:<snowflake>. Exactly the two shapes
 * the platform session accepts, nothing broader. The game stores the id in
 * users.ahd_user_id, the same key the platform uses for its purchase ledger, so
 * entitlement reads line up.
 */
const PLATFORM_ACCOUNT_ID_RE = /^(?:[a-f0-9]{24}|discord:[0-9]{1,30})$/i;

/** After a 429, stop asking the platform for this long (or its Retry-After, capped). */
const RATE_LIMIT_PAUSE_MS = 10_000;
const RATE_LIMIT_PAUSE_MAX_MS = 60_000;
let pausedUntil = 0;

export function isLauncherCodeShape(code: unknown): code is string {
  return typeof code === "string" && CODE_RE.test(code);
}

function redeemUrl(): string {
  const base = (process.env.LAKESIDE_BASE || "https://lakesidegames.net").replace(/\/+$/, "");
  return process.env.LAKESIDE_LAUNCHER_REDEEM_URL || `${base}/account/launcher/handoff/redeem`;
}

function pauseFor(retryAfter: string | null, now: number): void {
  const seconds = Number(retryAfter);
  const ms = Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds * 1000, RATE_LIMIT_PAUSE_MAX_MS)
    : RATE_LIMIT_PAUSE_MS;
  pausedUntil = Math.max(pausedUntil, now + ms);
}

/** Test-only: forget a rate-limit pause. */
export function resetLauncherRedeemPause(): void {
  pausedUntil = 0;
}

/**
 * Margin of Victory pack ids from the redeem answer's entitlements, or null
 * when the answer did not carry a usable list (the caller then reads ownership
 * the normal way). Items are { productId, game, source, until? }.
 */
export function ownedPacksFromEntitlements(raw: unknown, now = Date.now()): string[] | null {
  if (!Array.isArray(raw)) return null;
  const ids: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { productId, game, until } = item as Record<string, unknown>;
    if (game !== GAME || typeof productId !== "string") continue;
    if (until != null) {
      const end = typeof until === "string" ? Date.parse(until) : NaN;
      if (!(end > now)) continue;
    }
    ids.push(productId);
  }
  return knownPackIds(ids);
}

export type LauncherRedeemResult =
  /**
   * identity.email is always "": the redeem answer has none. ownedPackIds is
   * what the platform says the account owns right now, or null when unknown.
   */
  | { ok: true; identity: LakesideIdentity; ownedPackIds: string[] | null }
  /** The code is unknown, used, expired or for another client. */
  | { ok: false; reason: "invalid" }
  /** The platform could not be asked, is rate limiting us, or answered with something unusable. */
  | { ok: false; reason: "unavailable" };

/** Redeem a launcher code with the platform, once. Never retries, never throws. */
export async function redeemLauncherCode(code: string, now = Date.now()): Promise<LauncherRedeemResult> {
  if (!isLauncherCodeShape(code)) return { ok: false, reason: "invalid" };
  // Rate limited a moment ago: answer at once instead of adding to the pile.
  if (now < pausedUntil) return { ok: false, reason: "unavailable" };

  let res: Response;
  try {
    res = await fetch(redeemUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, clientId: LAUNCHER_CLIENT_ID }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (res.status === 429) {
    pauseFor(res.headers.get("retry-after"), now);
    return { ok: false, reason: "unavailable" };
  }
  // The platform answers 400 for every code it will not honour, without saying why.
  if (res.status === 400) return { ok: false, reason: "invalid" };
  if (!res.ok) return { ok: false, reason: "unavailable" };

  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const accountId = typeof body?.accountId === "string" ? body.accountId : "";
  if (!PLATFORM_ACCOUNT_ID_RE.test(accountId)) return { ok: false, reason: "unavailable" };
  // The display name only seeds the game username; a missing one gets a generated name.
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  return {
    ok: true,
    identity: { ahdUserId: accountId, email: "", username: displayName },
    ownedPackIds: ownedPacksFromEntitlements(body?.entitlements, now),
  };
}

// ── Pack summary for the launcher tile ───────────────────────────────────────

export interface LauncherPackLine {
  id: string;
  name: string;
  /** Paid elections in the pack. */
  elections: number;
  /** Owned directly, or every election in it is covered by other owned packs. */
  owned: boolean;
}

export interface LauncherPackSummary {
  game: typeof GAME;
  elections: {
    /** Every election in the game. */
    total: number;
    /** Free to everyone, one per country. */
    free: number;
    /** Free plus every election the owned packs unlock. */
    playable: number;
  };
  /** True when the owned packs unlock every paid election. */
  ownsEverything: boolean;
  /** Packs on sale in display order, then any retired pack the player owns. */
  packs: LauncherPackLine[];
}

/** Keep only product ids this game sells or still honours; drop the rest. */
export function knownPackIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => Object.prototype.hasOwnProperty.call(PACKS_BY_ID, id)))];
}

export function launcherPackSummary(ownedProductIds: readonly string[]): LauncherPackSummary {
  const owned = knownPackIds(ownedProductIds);
  const unlocked = new Set(owned.flatMap((id) => PACKS_BY_ID[id].scenarios));
  const free = SCENARIO_REGISTRY.filter((s) => s.free).length;
  const paid = SCENARIO_REGISTRY.filter((s) => !s.free);
  const paidUnlocked = paid.filter((s) => unlocked.has(s.scenarioId)).length;

  const line = (id: string): LauncherPackLine => ({
    id,
    name: PACKS_BY_ID[id].name,
    elections: PACKS_BY_ID[id].scenarios.length,
    // packCovered is vacuously true for an empty pack; never claim one is owned.
    owned: owned.includes(id) || (PACKS_BY_ID[id].scenarios.length > 0 && packCovered(id, owned)),
  });
  const retiredOwned = PACKS.filter((p) => p.legacy && owned.includes(p.id)).map((p) => p.id);

  return {
    game: GAME,
    elections: { total: SCENARIO_REGISTRY.length, free, playable: free + paidUnlocked },
    ownsEverything: paid.length > 0 && paidUnlocked === paid.length,
    packs: [...STORE_PACKS.map((p) => p.id), ...retiredOwned].map(line),
  };
}

/** Parse ?owned=a,b,c (also repeated ?owned=), bounded. */
export function parseOwnedQuery(value: unknown): string[] {
  const parts = (Array.isArray(value) ? value : [value])
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= 64);
  return parts.slice(0, 64);
}
