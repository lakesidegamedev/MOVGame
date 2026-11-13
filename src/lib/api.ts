// Thin fetch wrapper for the campaign backend. In dev, Vite proxies /api to the
// server process; on sim.ahousedividedgame.com the SPA and API share an origin.
// On every other mount (any path on lakesidegames.net, Cloudflare Pages
// previews) there is NO /api/* on the page origin: requests would hit the SPA
// fallback and return index.html with HTTP 200, which the client would read as
// empty successful payloads. All calls are therefore addressed to the campaign
// server host explicitly. They stay best-effort: the game itself never depends
// on the network.

import { DISTRIBUTION, PREVIEW_SCORE_NOTE } from "./distribution";

const TOKEN_KEY = "campaign_token";
const USER_KEY = "campaign_user";
const GUEST_KEY = "campaign_guest_id";

// Host that actually serves the campaign API. Relative (same-origin) on sim and
// in dev; the sim origin everywhere else.
export function apiBase(): string {
  if (typeof window === "undefined") return "";
  const { hostname, protocol } = window.location;
  // The packaged desktop shell serves its bundle from tauri://localhost (macOS,
  // Linux) or http://tauri.localhost (Windows). "localhost" there is the app
  // itself, not a dev server, and has no /api.
  const packaged = protocol === "tauri:" || hostname === "tauri.localhost";
  const sameOriginApi = !packaged && (
    hostname === "sim.ahousedividedgame.com" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1");
  return sameOriginApi ? "" : "https://sim.ahousedividedgame.com";
}

// The preview build runs unreleased balance: its scores and achievements never
// reach the public boards, whatever the interface does.
function previewGuard(): Promise<never> | null {
  return DISTRIBUTION.preview ? Promise.reject(new Error(PREVIEW_SCORE_NOTE)) : null;
}

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  /** True when this account is linked to an A House Divided account. */
  ahdLinked?: boolean;
}

export interface Purchase {
  packId: string | null;
  packName: string | null;
  scenarioId: string | null;
  provider: "stripe" | "code" | "apple" | "google" | "supporter";
  amountCents: number | null;
  currency: string | null;
  status: "paid" | "refunded";
  createdAt: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  /** Null when the platform gave no price for it in this answer. */
  priceCents: number | null;
  scenarios: string[];
  listed?: boolean;
}

export interface CatalogResponse {
  /** "platform" is the only answer that carries prices. "bundled" is what older servers sent during an outage. */
  source?: "platform" | "unavailable" | "bundled";
  products: CatalogProduct[];
}

export interface Unlocked {
  scenarioIds: string[];
  packIds: string[];
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch { return null; }
}

export function storeSession(token: string, user: ApiUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch { return "LOCAL"; }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Unwraps a JSON response, guaranteeing an object (never null/array) so the
// destructures downstream cannot blow up on a malformed payload.
async function readJsonObject(res: Response): Promise<Record<string, unknown>> {
  const body: unknown = await res.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await readJsonObject(res);
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

// Server payloads must carry the full Unlocked shape; anything less (an old
// proxy cache, an SPA-fallback HTML masquerading as a 200, a partial response)
// resolves to undefined fields that would poison the auth store. Normalize
// defensively: missing fields become empty lists, never undefined.
function normalizeUnlocked(value: unknown): Unlocked {
  const obj = value && typeof value === "object" && !Array.isArray(value)
    ? (value as { scenarioIds?: unknown; packIds?: unknown })
    : {};
  return {
    scenarioIds: Array.isArray(obj.scenarioIds) ? obj.scenarioIds.map(String) : [],
    packIds: Array.isArray(obj.packIds) ? obj.packIds.map(String) : [],
  };
}

export const api = {
  register: (username: string, email: string, password: string) =>
    call<{ token: string; user: ApiUser }>("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),

  login: (email: string, password: string) =>
    call<{ token: string; user: ApiUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => call<{ user: ApiUser; unlocked: Unlocked }>("/api/auth/me").then((r) => ({ ...r, unlocked: normalizeUnlocked(r.unlocked) })),

  activate: (code: string) =>
    call<{ scenarioId?: string; packId?: string; packName?: string; unlocked: Unlocked }>(
      "/api/auth/activate", { method: "POST", body: JSON.stringify({ code }) })
    .then((r) => ({ ...r, unlocked: normalizeUnlocked(r.unlocked) })),

  activations: () => call<{ unlocked: Unlocked }>("/api/auth/activations")
    .then((r) => ({ ...r, unlocked: normalizeUnlocked(r.unlocked) })),

  // Product catalog with platform prices (the platform is the only price
  // source). `source` says whether the platform answered ("platform") or could
  // not be reached ("unavailable", no prices); `listed` is true only for
  // products the platform actually sells.
  catalog: () => call<CatalogResponse>("/api/catalog"),

  // ── Purchases + Lakeside ID ──
  // Commerce is owned by the Lakeside platform now. The Buy button links out to
  // the platform checkout (see lakesideCheckoutUrl); the account view lists the
  // current user's purchases via this same-origin proxy so INTERNAL_TOKEN stays
  // server-side.
  myEntitlements: () => call<{ purchases: Purchase[]; verified?: boolean }>("/api/my-entitlements")
    .then((r) => ({ purchases: Array.isArray(r.purchases) ? r.purchases : [], verified: r.verified !== false })),

  // Ask the platform again what this account owns, bypassing the server's short
  // entitlement cache. `verified: false` means the platform could not be
  // reached, so `unlocked` must not be read as "owns nothing".
  refreshEntitlements: () =>
    call<{ verified?: boolean; unlocked: Unlocked }>("/api/auth/entitlements/refresh", { method: "POST" })
      .then((r) => ({ verified: r.verified === true, unlocked: normalizeUnlocked(r.unlocked) })),

  lakesideExchange: (code: string) =>
    call<{ token: string; user: ApiUser; unlocked: Unlocked }>(
      "/api/lakeside/exchange", { method: "POST", body: JSON.stringify({ code }) })
    .then((r) => ({ ...r, unlocked: normalizeUnlocked(r.unlocked) })),

  // The launcher's single-use code (from #launcher_code=), redeemed server side.
  lakesideLauncherExchange: (code: string) =>
    call<{ token: string; user: ApiUser; unlocked: Unlocked }>(
      "/api/lakeside/launcher-exchange", { method: "POST", body: JSON.stringify({ code }) })
    .then((r) => ({ ...r, unlocked: normalizeUnlocked(r.unlocked) })),

  leaderboard: (scenarioId: string, difficulty?: string, limit = 20) =>
    call<{ entries: LeaderboardEntry[] }>(
      `/api/leaderboard?scenario=${encodeURIComponent(scenarioId)}${difficulty ? `&difficulty=${difficulty}` : ""}&limit=${limit}`),

  postScore: (submission: unknown) =>
    previewGuard() ?? call<{ posted: boolean; personalBest: number; rank: number }>(
      "/api/leaderboard", { method: "POST", body: JSON.stringify(submission) }),

  myRankings: () => call<{ rankings: MyRanking[] }>("/api/leaderboard/me"),

  syncAchievements: (scenarioId: string, achievementIds: string[]) =>
    previewGuard() ?? call<{ added: number }>("/api/achievements", { method: "POST", body: JSON.stringify({ scenarioId, achievementIds }) }),

  // ── Daily Challenge ──
  daily: () => call<DailyInfo>("/api/daily"),

  postDaily: (submission: unknown) =>
    previewGuard() ?? call<{ posted: boolean; personalBest: number; rank: number; date: string }>(
      "/api/daily", { method: "POST", body: JSON.stringify(submission) }),

  dailyBoard: (date: string) =>
    call<DailyBoard>(`/api/daily/board?date=${encodeURIComponent(date)}`),

  dailyChampions: () => call<DailyChampions>("/api/daily/champions"),

  // ── Cloud saves (signed-in cross-device sync) ──
  // These mirror the local Dexie saves for a logged-in player. All callers must
  // treat failures as "stay local only"; the RemoteSyncProvider wraps them so
  // gameplay never depends on the network. listSaves normalizes a malformed
  // payload to an empty list so the caller's .map can never throw.
  listSaves: () => call<{ saves: RemoteSaveMeta[] }>("/api/saves").then((r) => ({ saves: Array.isArray(r.saves) ? r.saves : [] })),
  getSave: (id: string) => call<RemoteSaveRecord>(`/api/saves/${encodeURIComponent(id)}`),
  putSave: (id: string, record: RemoteSavePut) =>
    call<{ ok: boolean; id: string; updatedAt: number }>(
      `/api/saves/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(record) }),
  deleteSave: (id: string) =>
    call<{ ok: boolean }>(`/api/saves/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getReplay: (id: string) =>
    call<{ id: string; updatedAt: number; log: unknown }>(`/api/saves/${encodeURIComponent(id)}/replay`),
  putReplay: (id: string, body: { log: unknown; updatedAt: number }) =>
    call<{ ok: boolean }>(`/api/saves/${encodeURIComponent(id)}/replay`, { method: "PUT", body: JSON.stringify(body) }),
};

export interface RemoteSaveMeta {
  id: string;
  name: string;
  turn: number;
  playerCandidate: unknown;
  updatedAt: number;
  hasReplay: boolean;
}

export interface RemoteSaveRecord {
  id: string;
  name: string;
  turn: number;
  playerCandidate: unknown;
  state: unknown;
  replay: unknown;
  updatedAt: number;
}

export interface RemoteSavePut {
  name: string;
  turn: number;
  playerCandidate: unknown;
  state: unknown;
  updatedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  evMargin: number | null;
  popularVoteMargin: number | null;
  turnsPlayed: number | null;
  difficulty: string;
  finishedAt: number;
}

export interface DailyBoardEntry {
  rank: number;
  username: string;
  score: number;
  evMargin: number | null;
  popularVoteMargin: number | null;
  difficulty: string;
  finishedAt: number;
}

// GET /api/daily — the assignment (date/scenarioId/seed/role) plus display
// metadata and today's top 10.
export interface DailyInfo {
  date: string;
  scenarioId: string;
  seed: string;
  role: string;
  label: string;
  flag: string;
  board: DailyBoardEntry[];
}

export interface DailyBoard {
  date: string;
  scenarioId: string;
  entries: DailyBoardEntry[];
  me: { rank: number; score: number } | null;
}

// GET /api/daily/champions — all-time Daily Challenge standings (most days won).
export interface DailyChampionEntry {
  rank: number;
  username: string;
  wins: number;      // days finished #1
  podiums: number;   // days finished top 3
  played: number;    // days entered
  totalScore: number;
}

export interface DailyChampions {
  totalDays: number;
  entries: DailyChampionEntry[];
}

// ── Lakeside sign-in URL ─────────────────────────────────────────────────────
// The A House Divided cookie only reaches sim.ahousedividedgame.com, so the
// button always drives that host's /api/lakeside/login. It bounces back to the
// CURRENT page (any allowed origin) with a one-time ?lakeside_code=, which the
// SPA exchanges for its normal token. Works identically whether the app is
// served from sim.ahousedividedgame.com or any path on lakesidegames.net
// (/games/margin-of-victory/, or the old /games/electioneer/ address): the
// return target is the page's own origin and path, whatever they are.
export function lakesideLoginUrl(returnParams: Record<string, string> = {}): string {
  const loc = window.location;
  // Same-origin relative endpoint on sim (and in dev, where Vite proxies /api);
  // cross to sim explicitly from the lakesidegames.net mount.
  const endpoint = `${apiBase()}/api/lakeside/login`;
  const search = new URLSearchParams(loc.search);
  for (const [k, v] of Object.entries(returnParams)) search.set(k, v);
  const query = search.toString() ? `?${search}` : "";
  const ret = loc.hostname === "sim.ahousedividedgame.com"
    ? loc.pathname + query
    : loc.origin + loc.pathname + query;
  return `${endpoint}?return=${encodeURIComponent(ret)}`;
}

// ── Lakeside platform checkout ───────────────────────────────────────────────
// Commerce lives on the platform. The Buy button navigates here once the game
// account is linked to a Lakeside identity (purchases are keyed on it); the
// platform requires its own session (bouncing to sign-in if needed), takes
// payment, and returns to the game with ?purchase=success&pack=<id>. Override at build time with
// VITE_LAKESIDE_BASE if the platform host ever changes.
export const LAKESIDE_BASE = (import.meta.env.VITE_LAKESIDE_BASE as string | undefined)?.replace(/\/+$/, "")
  || "https://lakesidegames.net";

export function lakesideCheckoutUrl(packId: string): string {
  return `${LAKESIDE_BASE}/account/checkout?game=electioneer&product=${encodeURIComponent(packId)}`;
}

export interface MyRanking {
  scenarioId: string;
  rank: number;
  score: number;
  difficulty: string;
  finishedAt: number;
}
