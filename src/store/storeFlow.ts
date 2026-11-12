import { create } from "zustand";
import { packCovered, STORE_PACKS } from "@content/packs";
import { DISTRIBUTION } from "@lib/distribution";
import { lakesideCheckoutUrl, lakesideLoginUrl } from "@lib/api";
import { openExternal } from "@lib/externalLink";
import { BRAND } from "../brand";
import { useAuthStore } from "./authStore";
import { useStoreNav } from "./storeNav";
import { offerFor, type CatalogState } from "@lib/storeModel";

// The purchase path, start to finish:
//   Buy -> sign in with Lakeside if needed -> Lakeside checkout -> back in the
//   game -> entitlement refresh -> a confirmation that names what was unlocked.
// On the web the game window itself goes to the Lakeside pages and comes back
// with the result in the URL. In the desktop app checkout opens in the system
// browser, the game window stays put, and the purchase is picked up by polling
// plus a re-check whenever the window regains focus.
//
// Nothing here grants anything. A pack becomes owned only when the server, which
// asks the Lakeside platform, says so.

export type FlowPhase =
  | { kind: "idle" }
  /** The browser is about to leave for Lakeside sign-in or checkout. */
  | { kind: "redirecting"; packId: string; to: "sign-in" | "checkout" }
  /** Not signed in: after a Buy click (desktop) or when landing back from checkout. */
  | { kind: "needs-login"; packId: string | null; reason: "buy" | "return" }
  /** Desktop: link this account to a Lakeside account in the browser, once. */
  | { kind: "link-external"; packId: string; url: string; opened: boolean }
  /** Desktop: checkout is open in the system browser. */
  | { kind: "checkout-open"; packId: string; url: string }
  /** Back from checkout; waiting for the platform to record the purchase. */
  | { kind: "confirming"; packId: string | null }
  /** The wait ran out. Calm state with a manual refresh; nothing is wrong yet. */
  | { kind: "slow"; packId: string | null; unverified: boolean; fromCheckout: boolean; url?: string }
  | { kind: "success"; packId: string | null; focusScenarioId?: string; ownedBefore: string[] }
  | { kind: "cancelled"; packId: string | null }
  | { kind: "error"; packId: string | null; message: string; url?: string };

export type CheckResult = "owned" | "pending" | "unverified";

// ── Polling ──────────────────────────────────────────────────────────────

export interface WatchOptions {
  /** Give up after this long. */
  deadlineMs: number;
  /** Gap before each check; the last value repeats. */
  delays: number[];
}

/** Right after a checkout return: the payment is done, only the ledger is behind. */
export const RETURN_WATCH: WatchOptions = { deadlineMs: 90_000, delays: [1_500, 2_500, 4_000, 5_000, 8_000] };
/** Desktop, checkout open in another window: the player may take minutes to pay. */
export const DESKTOP_WATCH: WatchOptions = { deadlineMs: 10 * 60_000, delays: [4_000, 4_000, 6_000, 8_000, 12_000] };

export interface WatchDeps {
  check: () => Promise<CheckResult>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  /** Return true to abandon the watch (superseded or dismissed). */
  stopped: () => boolean;
}

export type WatchOutcome =
  | { outcome: "owned" }
  | { outcome: "timeout"; unverified: boolean }
  | { outcome: "stopped" };

/** Check until the pack shows up, the deadline passes, or the watch is stopped. */
export async function watchForOwnership(deps: WatchDeps, opts: WatchOptions): Promise<WatchOutcome> {
  const start = deps.now();
  let unverified = false;
  for (let i = 0; ; i++) {
    const gap = opts.delays[Math.min(i, opts.delays.length - 1)];
    if (deps.now() - start + gap > opts.deadlineMs) return { outcome: "timeout", unverified };
    await deps.sleep(gap);
    if (deps.stopped()) return { outcome: "stopped" };
    const result = await deps.check();
    if (deps.stopped()) return { outcome: "stopped" };
    if (result === "owned") return { outcome: "owned" };
    unverified = result === "unverified";
  }
}

// ── Intent that survives the trip to Lakeside ────────────────────────────

const INTENT_KEY = "mov.store.intent";
const INTENT_MAX_AGE_MS = 6 * 60 * 60_000;

interface Intent {
  packId: string;
  scenarioId?: string;
  ownedBefore: string[];
  at: number;
}

function saveIntent(intent: Intent): void {
  try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent)); } catch { /* private mode */ }
}

function takeIntent(packId: string | null): Intent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(INTENT_KEY);
    const intent = JSON.parse(raw) as Intent;
    if (!intent || typeof intent.packId !== "string" || Date.now() - intent.at > INTENT_MAX_AGE_MS) return null;
    return packId && intent.packId !== packId ? null : intent;
  } catch {
    return null;
  }
}

// ── Store ────────────────────────────────────────────────────────────────

interface StoreFlow {
  phase: FlowPhase;
  /** A manual or focus-triggered check is running. */
  checking: boolean;
  start: (packId: string, opts: { catalog: CatalogState; scenarioId?: string }) => void;
  /** Open the game site in the system browser so the player can link a Lakeside account. */
  openLinkPage: () => void;
  /** Back from checkout (or after a Buy resumed): confirm the purchase. */
  handleReturn: (result: "success" | "cancelled", packId: string | null) => void;
  /** Re-check now (button, window focus). */
  checkNow: () => Promise<void>;
  dismiss: () => void;
}

let runId = 0;
let current: { packId: string | null; scenarioId?: string; ownedBefore: string[] } = { packId: null, ownedBefore: [] };

async function checkOwnership(packId: string | null): Promise<CheckResult> {
  const auth = useAuthStore.getState();
  if (!auth.user) return "unverified";
  const verified = await auth.refreshEntitlements();
  if (!verified) return "unverified";
  void auth.loadPurchases();
  if (!packId) return "owned"; // checkout gave no pack to look for; one clean refresh is the best we can do
  return packCovered(packId, useAuthStore.getState().unlocked.packIds) ? "owned" : "pending";
}

const realDeps = (id: number): Omit<WatchDeps, "check"> => ({
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => Date.now(),
  stopped: () => id !== runId,
});

export const useStoreFlow = create<StoreFlow>((set, get) => {
  const succeed = (packId: string | null) => {
    runId++;
    set({
      phase: { kind: "success", packId, focusScenarioId: current.scenarioId, ownedBefore: current.ownedBefore },
      checking: false,
    });
  };

  const watch = (packId: string | null, opts: WatchOptions, fromCheckout: boolean, url?: string) => {
    const id = ++runId;
    void watchForOwnership({ ...realDeps(id), check: () => checkOwnership(packId) }, opts).then((res) => {
      if (id !== runId) return;
      if (res.outcome === "owned") succeed(packId);
      else if (res.outcome === "timeout") {
        // A session that expired while the player was away is a login problem, not a slow webhook.
        if (!useAuthStore.getState().user) set({ phase: { kind: "needs-login", packId, reason: "return" }, checking: false });
        else set({ phase: { kind: "slow", packId, unverified: res.unverified, fromCheckout, url }, checking: false });
      }
    });
  };

  return {
    phase: { kind: "idle" },
    checking: false,

    start: (packId, { catalog, scenarioId }) => {
      const auth = useAuthStore.getState();
      const sale = STORE_PACKS.some((p) => p.id === packId);
      const fail = (message: string) => set({ phase: { kind: "error", packId, message } });
      if (!sale) return fail("That pack is not on sale.");
      if (DISTRIBUTION.preview) return fail("Not available in the preview.");
      if (DISTRIBUTION.checkout === null) return fail(`Packs are sold through ${DISTRIBUTION.nativeStoreName ?? "your platform's store"} in this version.`);
      const offer = offerFor(packId, {
        ownedPackIds: auth.unlocked.packIds, purchases: auth.purchases, catalog, policy: DISTRIBUTION,
      });
      if (offer.kind === "owned") return; // already yours; the UI never offers Buy here
      if (offer.kind === "coming-soon") return fail("That pack is not on sale yet. It will appear here as soon as it is.");
      if (offer.kind !== "buy") return fail("The Lakeside store can't be reached right now. Try again in a moment.");

      current = { packId, scenarioId, ownedBefore: [...auth.unlocked.packIds] };
      saveIntent({ packId, scenarioId, ownedBefore: current.ownedBefore, at: Date.now() });
      runId++;

      if (DISTRIBUTION.checkout === "window") {
        // Web: the game window goes to Lakeside and comes back with the result in the URL.
        if (!auth.user?.ahdLinked) {
          set({ phase: { kind: "redirecting", packId, to: "sign-in" } });
          window.location.assign(lakesideLoginUrl({ buy: packId }));
        } else {
          set({ phase: { kind: "redirecting", packId, to: "checkout" } });
          window.location.assign(lakesideCheckoutUrl(packId));
        }
        return;
      }

      // Desktop: never navigate the game window away.
      if (!auth.user) {
        set({ phase: { kind: "needs-login", packId, reason: "buy" } });
        auth.openModal("login");
        return;
      }
      if (!auth.user.ahdLinked) {
        const url = `${BRAND.url}?store=${encodeURIComponent(packId)}`;
        set({ phase: { kind: "link-external", packId, url, opened: false } });
        return;
      }
      const url = lakesideCheckoutUrl(packId);
      // Opened straight from the click, before any await, so the browser allows it.
      void openExternal(url).then((ok) => {
        if (ok || get().phase.kind !== "checkout-open") return;
        runId++;
        set({ phase: { kind: "error", packId, message: "Could not open your browser. Open this link yourself to continue.", url }, checking: false });
      });
      set({ phase: { kind: "checkout-open", packId, url } });
      watch(packId, DESKTOP_WATCH, true, url);
    },

    openLinkPage: () => {
      const phase = get().phase;
      if (phase.kind !== "link-external") return;
      const { url, packId } = phase;
      void openExternal(url).then((ok) => {
        if (get().phase.kind !== "link-external") return;
        if (ok) set({ phase: { kind: "link-external", packId, url, opened: true } });
        else set({ phase: { kind: "error", packId, message: "Could not open your browser. Open this link yourself to continue.", url } });
      });
    },

    handleReturn: (result, packId) => {
      const intent = takeIntent(packId);
      current = {
        packId,
        scenarioId: intent?.scenarioId,
        ownedBefore: intent?.ownedBefore ?? [],
      };
      if (result === "cancelled") {
        set({ phase: { kind: "cancelled", packId } });
        return;
      }
      if (!useAuthStore.getState().user) {
        set({ phase: { kind: "needs-login", packId, reason: "return" } });
        return;
      }
      set({ phase: { kind: "confirming", packId } });
      watch(packId, RETURN_WATCH, false);
    },

    checkNow: async () => {
      const phase = get().phase;
      if (phase.kind === "link-external") {
        set({ checking: true });
        await useAuthStore.getState().refresh();
        set({ checking: false });
        return;
      }
      if (phase.kind !== "checkout-open" && phase.kind !== "confirming" && phase.kind !== "slow") return;
      const id = runId; // a check does not restart or cancel the wait that may be running alongside it
      set({ checking: true });
      const result = await checkOwnership(phase.packId);
      if (id !== runId) { set({ checking: false }); return; }
      if (result === "owned") return succeed(phase.packId);
      const now = get().phase;
      if (now.kind === "slow") set({ phase: { ...now, unverified: result === "unverified" }, checking: false });
      else set({ checking: false });
    },

    dismiss: () => {
      runId++;
      set({ phase: { kind: "idle" }, checking: false });
    },
  };
});

/** Pick up what a redirect landing left for the Store (sign-in resumed, or back from checkout). */
export function consumeResume(catalog: CatalogState): void {
  const pending = useStoreNav.getState().resume;
  // Resuming a Buy needs the catalog to know the pack is still on sale; a checkout return does not.
  if (!pending || (pending.kind === "buy" && catalog.status === "loading")) return;
  const job = useStoreNav.getState().takeResume();
  if (!job) return;
  const flow = useStoreFlow.getState();
  if (job.kind === "return") flow.handleReturn(job.result, job.packId);
  else flow.start(job.packId, { catalog, scenarioId: takeIntent(job.packId)?.scenarioId });
}
