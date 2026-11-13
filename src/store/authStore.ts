import { create } from "zustand";
import { api, ApiError, clearSession, getStoredUser, getToken, storeSession, type ApiUser, type Purchase, type Unlocked } from "@lib/api";
import { isFreeScenario } from "@content/scenarioRegistry";
import { PACKS_BY_ID, STORE_PACKS } from "@content/packs";
import { dailyAssignment, utcDateString } from "@lib/daily";
import { DISTRIBUTION } from "@lib/distribution";
import { useStoreNav } from "./storeNav";
import { shellLauncherCode, takeLauncherCode } from "@lib/launcherHandoff";
import { takeShellLauncherCode } from "@lib/desktopShell";

// Post-redirect notices (Lakeside sign-in). Checkout results are shown by the
// Store itself, which opens when the player lands back from checkout.
export type AuthNotice =
  | { kind: "lakeside-signed-in"; username: string }
  | { kind: "lakeside-failed" }
  | { kind: "lakeside-link-needs-login" }
  // Opened from the Lakeside launcher but its sign in did not go through.
  | { kind: "launcher-failed" };

interface AuthStore {
  user: ApiUser | null;
  unlocked: Unlocked;
  purchases: Purchase[];
  notice: AuthNotice | null;
  // Which auth modal is open, if any. `paywallScenarioId` remembers the locked
  // scenario the user clicked so we can resume after login/activation.
  modal: "login" | "register" | "activate" | "account" | null;
  paywallScenarioId: string | null;
  serverDown: boolean;

  openModal: (m: AuthStore["modal"], paywallScenarioId?: string | null) => void;
  closeModal: () => void;
  dismissNotice: () => void;

  login: (email: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string) => Promise<string | null>;
  activate: (code: string) => Promise<{ error?: string; packName?: string }>;
  /**
   * Ask the platform again what this account owns (no server cache). Resolves
   * true only when the platform actually answered; on false the held
   * entitlements are left as they were.
   */
  refreshEntitlements: () => Promise<boolean>;
  loadPurchases: () => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;

  canPlay: (scenarioId: string) => boolean;
  /**
   * Free or owned: what counts as "playable" in the library. Unlike canPlay it
   * leaves out today's Daily Challenge, a one-day pass that is not ownership.
   */
  ownsScenario: (scenarioId: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: getStoredUser(),
  unlocked: { scenarioIds: [], packIds: [] },
  purchases: [],
  notice: null,
  modal: null,
  paywallScenarioId: null,
  serverDown: false,

  openModal: (m, paywallScenarioId = null) => set({ modal: m, paywallScenarioId }),
  closeModal: () => set({ modal: null, paywallScenarioId: null }),
  dismissNotice: () => set({ notice: null }),

  login: async (email, password) => {
    try {
      const { token, user } = await api.login(email, password);
      storeSession(token, user);
      set({ user });
      await get().refresh();
      return null;
    } catch (e) {
      return e instanceof ApiError ? e.message : "Could not reach the server";
    }
  },

  register: async (username, email, password) => {
    try {
      const { token, user } = await api.register(username, email, password);
      storeSession(token, user);
      set({ user });
      return null;
    } catch (e) {
      return e instanceof ApiError ? e.message : "Could not reach the server";
    }
  },

  activate: async (code) => {
    try {
      const out = await api.activate(code);
      set({ unlocked: out.unlocked });
      return { packName: out.packName };
    } catch (e) {
      return { error: e instanceof ApiError ? e.message : "Could not reach the server" };
    }
  },

  refreshEntitlements: async () => {
    if (!getToken()) return false;
    try {
      const { verified, unlocked } = await api.refreshEntitlements();
      if (!verified) return false;
      set({ unlocked, serverDown: false });
      return true;
    } catch (e) {
      // An expired session is handled the same way as everywhere else.
      if (e instanceof ApiError && e.status === 401) await get().refresh();
      return false;
    }
  },

  loadPurchases: async () => {
    try {
      const { purchases, verified } = await api.myEntitlements();
      // An unverified answer is an outage, not an empty ledger: keep what we have.
      if (verified) set({ purchases: Array.isArray(purchases) ? purchases : [] });
      return verified;
    } catch {
      /* account view keeps showing what it had */
      return false;
    }
  },

  logout: () => {
    clearSession();
    set({ user: null, unlocked: { scenarioIds: [], packIds: [] }, purchases: [] });
  },

  refresh: async () => {
    // Always probe the server so offline guests get the "play offline" UX
    // instead of lock/login prompts that can't succeed.
    if (!getToken()) {
      try {
        await api.daily();
        set({ serverDown: false });
      } catch {
        set({ serverDown: true });
      }
      return;
    }
    try {
      const { user, unlocked } = await api.me();
      // A 200 without a usable user (SPA-fallback HTML parsed as {}, an old
      // cache, a partial response) must not wipe the signed-in state or push
      // undefined into `unlocked`; treat it like an unreachable server.
      if (!user || typeof user !== "object" || typeof user.id !== "string") {
        set({ serverDown: true });
        return;
      }
      set({ user, unlocked, serverDown: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        set({ user: null, unlocked: { scenarioIds: [], packIds: [] }, serverDown: false });
      } else {
        set({ serverDown: true });
      }
    }
  },

  canPlay: (scenarioId) => {
    // The internal preview build plays every election, including packs that
    // are not on sale yet. DISTRIBUTION.preview is false on every other build.
    if (DISTRIBUTION.preview) return true;
    if (isFreeScenario(scenarioId)) return true;
    // The Daily Challenge is free for everyone, every day, whatever the
    // paywall says: it lands on a rotating scenario (often a paid one) and the
    // server scores it ungated (routes/daily.ts). Keep the client in step so
    // the daily never prompts for sign-in or purchase.
    if (dailyAssignment(utcDateString()).scenarioId === scenarioId) return true;
    return get().unlocked.scenarioIds.includes(scenarioId);
  },
  ownsScenario: (scenarioId) => {
    if (DISTRIBUTION.preview) return true;
    if (isFreeScenario(scenarioId)) return true;
    return get().unlocked.scenarioIds.includes(scenarioId);
  },
}));

// Opened from the Lakeside launcher: the web game with #launcher_code=, or the
// desktop app with the code in its environment (handed over by the shell).
// Strip a fragment code from the address bar at once, then trade the code for
// a game session. On any failure the player keeps playing as they were
// (signed out, or their existing session).
async function consumeLauncherCode(): Promise<void> {
  if (typeof window === "undefined") return;
  const hash = window.location?.hash;
  let taken = takeLauncherCode(typeof hash === "string" ? hash : "");
  if (taken.present) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search + taken.hash);
  } else {
    taken = shellLauncherCode(await takeShellLauncherCode(), taken.hash);
  }
  if (!taken.present) return;
  if (!taken.code) {
    useAuthStore.setState({ notice: { kind: "launcher-failed" } });
    return;
  }
  try {
    const { token, user, unlocked } = await api.lakesideLauncherExchange(taken.code);
    storeSession(token, user);
    useAuthStore.setState({ user, unlocked, notice: { kind: "lakeside-signed-in", username: user.username } });
  } catch {
    // One attempt only: the code is single use, so retrying cannot help.
    useAuthStore.setState({ notice: { kind: "launcher-failed" } });
  }
}

// Handle redirect landings once on module load, before the entitlement
// refresh: ?lakeside_code= (Lakeside sign-in bounce), ?purchase= (checkout
// success/cancel) and ?store= (a link into the Store). Consumed params are
// stripped from the URL so reloads and share links stay clean. Anything that
// belongs to the Store is handed to it through storeNav.
async function consumeRedirectParams(): Promise<void> {
  if (typeof window === "undefined") return;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }
  const lakesideCode = params.get("lakeside_code");
  const purchase = params.get("purchase");
  const packId = params.get("pack");
  const buy = params.get("buy");
  const storeParam = params.get("store");
  if (!lakesideCode && !purchase && !buy && storeParam === null) return;

  for (const p of ["lakeside_code", "purchase", "pack", "session_id", "buy", "store"]) params.delete(p);
  const clean = window.location.pathname + (params.toString() ? `?${params}` : "") + window.location.hash;
  window.history.replaceState(null, "", clean);

  const knownPack = (id: string | null): string | null => (id && PACKS_BY_ID[id] ? id : null);

  if (lakesideCode) {
    try {
      const { token, user, unlocked } = await api.lakesideExchange(lakesideCode);
      storeSession(token, user);
      useAuthStore.setState({ user, unlocked, notice: { kind: "lakeside-signed-in", username: user.username } });
      // A Buy click that needed sign-in first resumes here, in the Store.
      const resumePack = buy && STORE_PACKS.some((p) => p.id === buy) ? buy : null;
      if (resumePack && user.ahdLinked) {
        useStoreNav.setState({ open: true, focus: { packId: resumePack }, resume: { kind: "buy", packId: resumePack } });
        return;
      }
    } catch (e) {
      const needsLogin = e instanceof ApiError && e.status === 409;
      useAuthStore.setState({ notice: { kind: needsLogin ? "lakeside-link-needs-login" : "lakeside-failed" } });
    }
  }
  if (purchase === "success" || purchase === "cancelled") {
    const pack = knownPack(packId);
    useStoreNav.setState({
      open: true,
      focus: pack ? { packId: pack } : {},
      resume: { kind: "return", result: purchase, packId: pack },
    });
  } else if (storeParam !== null) {
    const pack = knownPack(storeParam);
    useStoreNav.setState({ open: true, focus: pack ? { packId: pack } : {} });
  }
}

// Restore entitlements once on module load (fire-and-forget). The launcher
// code and redirect params run first so a fresh Lakeside session or purchase is
// reflected.
// A failure in either step must never skip the entitlement refresh.
void consumeLauncherCode()
  .catch(() => undefined)
  .then(consumeRedirectParams)
  .catch(() => undefined)
  .then(() => useAuthStore.getState().refresh());
