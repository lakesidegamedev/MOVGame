// Lakeside launcher handoff.
//
// The desktop launcher holds a Lakeside platform session. To open this game
// already signed in, it asks the platform for a short-lived, single-use code
// bound to this game and opens the game with it in the URL fragment
// (#launcher_code=). The fragment never reaches a server log or a Referer
// header. The SPA posts the code to /api/lakeside/launcher-exchange, and this
// module redeems it with the platform server to server. The game then issues
// its own session as it does for any Lakeside sign-in.
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
const TIMEOUT_MS = 5_000;

/** Shape of a launcher code: opaque base64url, bounded so junk never goes upstream. */
const CODE_RE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Platform user ids: a 24-hex A House Divided id, or a Discord id namespaced
 * as discord:<snowflake>. The game stores either in users.ahd_user_id, the same
 * key the platform uses for its purchase ledger, so entitlement reads line up.
 */
const PLATFORM_USER_ID_RE = /^(?:[a-f0-9]{24}|discord:[0-9]{1,30})$/i;

export function isLauncherCodeShape(code: unknown): code is string {
  return typeof code === "string" && CODE_RE.test(code);
}

function redeemUrl(): string {
  const base = (process.env.LAKESIDE_BASE || "https://lakesidegames.net").replace(/\/+$/, "");
  return process.env.LAKESIDE_LAUNCHER_REDEEM_URL || `${base}/account/api/launcher/redeem-game-code`;
}

export type LauncherRedeemResult =
  | { ok: true; identity: LakesideIdentity }
  /** The code is unknown, used, expired or for another game. */
  | { ok: false; reason: "invalid" }
  /** The platform could not be asked, or answered with something unusable. */
  | { ok: false; reason: "unavailable" }
  /** The identity has no email, which every game account needs. */
  | { ok: false; reason: "email-required" };

/** Redeem a launcher code with the platform. Never throws. */
export async function redeemLauncherCode(code: string): Promise<LauncherRedeemResult> {
  if (!isLauncherCodeShape(code)) return { ok: false, reason: "invalid" };
  const token = process.env.INTERNAL_TOKEN;
  if (!token) return { ok: false, reason: "unavailable" };

  let res: Response;
  try {
    res = await fetch(redeemUrl(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code, game: GAME }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  // 400/404/410: the platform does not honour this code. 401/403 mean it
  // rejected our credential, which is a configuration fault, not the player's.
  if (res.status === 400 || res.status === 404 || res.status === 410) return { ok: false, reason: "invalid" };
  if (!res.ok) return { ok: false, reason: "unavailable" };

  const body = (await res.json().catch(() => null)) as { identity?: Record<string, unknown> } | null;
  const raw = body?.identity;
  const userId = typeof raw?.userId === "string" ? raw.userId : "";
  const username = typeof raw?.username === "string" ? raw.username.trim() : "";
  const email = typeof raw?.email === "string" ? raw.email.trim() : "";
  if (raw?.game !== undefined && raw.game !== GAME) return { ok: false, reason: "invalid" };
  if (!PLATFORM_USER_ID_RE.test(userId) || !username) return { ok: false, reason: "unavailable" };
  if (!email) return { ok: false, reason: "email-required" };
  return { ok: true, identity: { ahdUserId: userId, email, username } };
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
