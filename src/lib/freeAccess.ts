// Lakeside "free access": while the platform switch is on, every pack is free
// for any signed-in Lakeside account. The switch is public, so signed-out
// visitors can be told too. One session-cached answer; any failure means off,
// so a broken endpoint can never lock or break the game.

import { useEffect, useState } from "react";
import { useAuthStore } from "@store/authStore";
import { LAKESIDE_BASE, lakesideLoginUrl } from "./api";
import { DISTRIBUTION } from "./distribution";
import { openExternal } from "./externalLink";
import { freeAccessOn } from "./storeModel";
import { openStoreForScenario } from "@store/storeNav";
import { BRAND } from "../brand";

export interface FreeAccessState {
  on: boolean;
  /** ISO end time, when the platform gave one. */
  endsAt: string | null;
}

export const FREE_ACCESS_OFF: FreeAccessState = { on: false, endsAt: null };

/** Same origin as the platform in production; override at build time for local dev. */
export const FREE_ACCESS_BASE = (import.meta.env.VITE_FREE_ACCESS_BASE as string | undefined)?.replace(/\/+$/, "")
  || LAKESIDE_BASE;

/** Interpret the endpoint's JSON. Anything unexpected, or an end time in the past, is off. */
export function parseFreeAccess(body: unknown, now: number = Date.now()): FreeAccessState {
  if (!body || typeof body !== "object") return FREE_ACCESS_OFF;
  const raw = body as { on?: unknown; endsAt?: unknown };
  if (raw.on !== true) return FREE_ACCESS_OFF;
  const endsAt = typeof raw.endsAt === "string" && Number.isFinite(Date.parse(raw.endsAt)) ? raw.endsAt : null;
  if (endsAt && Date.parse(endsAt) <= now) return FREE_ACCESS_OFF;
  return { on: true, endsAt };
}

let shared: FreeAccessState | null = null;
let inflight: Promise<FreeAccessState> | null = null;
const listeners = new Set<(s: FreeAccessState) => void>();

export function loadFreeAccess(): Promise<FreeAccessState> {
  if (shared) return Promise.resolve(shared);
  if (inflight) return inflight;
  inflight = (async () => {
    let state = FREE_ACCESS_OFF;
    try {
      const res = await fetch(`${FREE_ACCESS_BASE}/account/api/free-access`, { headers: { accept: "application/json" } });
      if (res.ok) state = parseFreeAccess(await res.json());
    } catch {
      state = FREE_ACCESS_OFF;
    }
    shared = state;
    for (const l of listeners) l(state);
    return state;
  })().finally(() => { inflight = null; });
  return inflight;
}

/** Test-only. */
export function resetFreeAccessCache(): void {
  shared = null;
  inflight = null;
}

/** "Sunday, November 22 at 5:00 PM Eastern". */
export function formatFreeUntil(endsAt: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  }).formatToParts(new Date(endsAt));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")}, ${get("month")} ${get("day")} at ${get("hour")}:${get("minute")} ${get("dayPeriod")} Eastern`;
}

export interface FreeAccess {
  /** Free access is on, from the public switch or the signed-in player's entitlements. */
  on: boolean;
  signedIn: boolean;
  endsAt: string | null;
  /** "Free until Sunday, November 22 at 5:00 PM Eastern", or "Free for now" with no end time. */
  untilLine: string;
}

export function useFreeAccess(): FreeAccess {
  const user = useAuthStore((s) => s.user);
  const purchases = useAuthStore((s) => s.purchases);
  const [pub, setPub] = useState<FreeAccessState>(shared ?? FREE_ACCESS_OFF);
  useEffect(() => {
    listeners.add(setPub);
    void loadFreeAccess().then(setPub);
    return () => { listeners.delete(setPub); };
  }, []);
  const signedIn = !!user;
  const on = pub.on || (signedIn && freeAccessOn(purchases));
  const endsAt = pub.endsAt;
  return { on, signedIn, endsAt, untilLine: endsAt ? `Free until ${formatFreeUntil(endsAt)}` : "Free for now" };
}

/** Start the existing Lakeside sign-in (in the packaged desktop app, send the player to the site). */
export function startFreeSignIn(): void {
  if (DISTRIBUTION.checkout === "system-browser") { void openExternal(BRAND.url); return; }
  window.location.assign(lakesideLoginUrl());
}

export const SIGN_IN_TO_PLAY_FREE = "Sign in to play free";

/**
 * A locked election was chosen. While free access is on and nobody is signed
 * in, the answer is to sign in, not to shop; otherwise open the Store.
 */
export function openLockedScenario(scenarioId: string): void {
  if (shared?.on && !useAuthStore.getState().user) { startFreeSignIn(); return; }
  openStoreForScenario(scenarioId);
}

/** Label for a Begin button on a locked election, or null when it is not locked or free access is off. */
export function freeSignInLabel(fa: FreeAccess, locked: boolean): string | null {
  return locked && fa.on && !fa.signedIn ? SIGN_IN_TO_PLAY_FREE : null;
}
