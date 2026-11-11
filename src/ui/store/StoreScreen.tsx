import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, CircleUser, KeyRound, RefreshCw, ShoppingBag, WifiOff } from "lucide-react";
import { PACKS_BY_ID, packForScenario } from "@content/packs";
import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { consumeResume, useStoreFlow } from "@store/storeFlow";
import { useCatalog } from "@lib/useCatalog";
import { DISTRIBUTION } from "@lib/distribution";
import { BRAND } from "../../brand";
import { countryPacks, freeElections, offerFor } from "@lib/storeModel";
import { StoreContext, type StoreCtx } from "./StoreContext";
import { useDialogFocus } from "./useDialogFocus";
import { PurchaseBanner } from "./PurchaseBanner";
import { CompleteOffer } from "./CompleteOffer";
import { PackTile } from "./PackTile";
import { PackDetail } from "./PackDetail";
import { DifficultyChip, electionName, electionYearLabel, plural } from "./StoreParts";
import "./store.css";

type Filter = "all" | "open" | "owned";

/**
 * The Store: the Complete Collection as the lead offer, one tile per country
 * pack, and a page per pack with its elections. It sits over whatever screen the
 * player was on, so a locked election in the middle of setup keeps its place.
 */
export default function StoreScreen({ onClose, onPlay }: { onClose: () => void; onPlay: (scenarioId: string) => void }) {
  const focus = useStoreNav((s) => s.focus);
  const user = useAuthStore((s) => s.user);
  const unlocked = useAuthStore((s) => s.unlocked);
  const purchases = useAuthStore((s) => s.purchases);
  const serverDown = useAuthStore((s) => s.serverDown);
  const authModal = useAuthStore((s) => s.modal);
  const openModal = useAuthStore((s) => s.openModal);
  const canPlay = useAuthStore((s) => s.canPlay);
  const refreshEntitlements = useAuthStore((s) => s.refreshEntitlements);
  const loadPurchases = useAuthStore((s) => s.loadPurchases);
  const { catalog, reload } = useCatalog();
  const phase = useStoreFlow((s) => s.phase);
  const start = useStoreFlow((s) => s.start);
  const checkNow = useStoreFlow((s) => s.checkNow);

  // Receipts say how each pack was obtained; fetch them whenever the Store opens for a signed-in player.
  const userId = user?.id;
  useEffect(() => { if (userId) void loadPurchases(); }, [userId, loadPurchases]);

  const initialPack = focus.packId ?? (focus.scenarioId ? packForScenario(focus.scenarioId)?.id : undefined);
  const [packId, setPackId] = useState<string | undefined>(initialPack && PACKS_BY_ID[initialPack] ? initialPack : undefined);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Escape and the Back button: from a pack page go to the shelf, from the shelf leave.
  const back = useCallback(() => {
    if (packId) {
      setPackId(undefined);
      mainRef.current?.parentElement?.scrollTo?.({ top: 0 });
    } else onClose();
  }, [packId, onClose]);
  const dialogRef = useDialogFocus<HTMLDivElement>(back);

  // Jobs a redirect landing left for us: carry on to checkout, or confirm a return.
  useEffect(() => { consumeResume(catalog); }, [catalog, focus]);

  // The player signed in after being asked to: pick the thread back up.
  useEffect(() => {
    if (phase.kind !== "needs-login" || !user) return;
    if (phase.reason === "return") useStoreFlow.getState().handleReturn("success", phase.packId);
    else useStoreFlow.getState().dismiss();
  }, [phase, user]);

  // Coming back to the window (desktop checkout, a browser link step) checks again at once.
  const waiting = phase.kind === "checkout-open" || phase.kind === "link-external" || phase.kind === "slow";
  useEffect(() => {
    if (!waiting) return;
    let last = 0;
    const onBack = () => {
      if (document.visibilityState === "hidden" || Date.now() - last < 2_000) return;
      last = Date.now();
      void checkNow();
    };
    window.addEventListener("focus", onBack);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      window.removeEventListener("focus", onBack);
      document.removeEventListener("visibilitychange", onBack);
    };
  }, [waiting, checkNow]);

  // A sign-in or account dialog opened over the store: hand it focus, take it back afterwards.
  const heldFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (authModal) {
      heldFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else if (heldFocus.current) {
      const el = heldFocus.current;
      heldFocus.current = null;
      if (document.contains(el)) el.focus({ preventScroll: true });
    }
  }, [authModal]);

  const ownedPackIds = unlocked.packIds;
  const busy = phase.kind === "redirecting" || phase.kind === "checkout-open" || phase.kind === "confirming";

  const ctx: StoreCtx = useMemo(() => ({
    catalog, ownedPackIds, purchases, user, busy, canPlay,
    focusScenarioId: focus.scenarioId,
    buy: (id) => start(id, { catalog, scenarioId: focus.scenarioId }),
    openPack: (id) => { setPackId(id); mainRef.current?.parentElement?.scrollTo?.({ top: 0 }); },
    play: onPlay,
  }), [catalog, ownedPackIds, purchases, user, busy, canPlay, focus.scenarioId, start, onPlay]);

  const packs = countryPacks();
  const ownedCount = packs.filter((p) => offerFor(p.id, { ownedPackIds, purchases, catalog, policy: DISTRIBUTION }).kind === "owned").length;
  const shown = packs.filter((p) => {
    const owned = offerFor(p.id, { ownedPackIds, purchases, catalog, policy: DISTRIBUTION }).kind === "owned";
    return filter === "all" || (filter === "owned" ? owned : !owned);
  });

  const refresh = async () => {
    setRefreshing(true);
    setNote(null);
    const [ok] = await Promise.all([refreshEntitlements(), loadPurchases()]);
    reload();
    setRefreshing(false);
    setNote(ok ? "Purchases refreshed." : "Couldn't reach the Lakeside store to refresh. Your packs are unchanged.");
  };

  return (
    <StoreContext.Provider value={ctx}>
      <div
        className="store-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-title"
        ref={dialogRef}
        tabIndex={-1}
        // The game's own shortcuts (Enter or Space ends the turn, 1 to 9 pick actions) must not fire from here.
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "?" || /^[1-9]$/.test(e.key)) e.stopPropagation(); }}
        {...(authModal ? ({ inert: "" } as Record<string, string>) : {})}
      >
        <header className="store-bar">
          <div className="store-bar-inner">
            <button type="button" className="store-back" onClick={back}>
              <ChevronLeft size={16} aria-hidden="true" /> <span>{packId ? "All packs" : "Back"}</span>
            </button>
            <h1 id="store-title"><ShoppingBag size={17} aria-hidden="true" /> Store</h1>
            <span className="store-bar-actions">
              {user && (
                <button type="button" className="ghost small" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh purchases" title="Refresh purchases">
                  <RefreshCw size={14} className={refreshing ? "store-spin" : undefined} aria-hidden="true" /><span className="store-hide-sm">Refresh</span>
                </button>
              )}
              <button type="button" className="ghost small" onClick={() => openModal("activate")} aria-label="Redeem a code" title="Redeem a code">
                <KeyRound size={14} aria-hidden="true" /><span className="store-hide-sm">Redeem code</span>
              </button>
              {user ? (
                <button type="button" className="ghost small" onClick={() => openModal("account")} aria-label={`Account: ${user.username}`}>
                  <CircleUser size={14} aria-hidden="true" /><span className="store-hide-sm">{user.username}</span>
                </button>
              ) : (
                <button type="button" className="primary small" onClick={() => openModal("login")}>Log in</button>
              )}
            </span>
          </div>
        </header>

        <main className="store-main" ref={mainRef} id="store-main">
          <div className="store-live-wrap">
            <PurchaseBanner />
            {note && <p className="store-note" role="status">{note}</p>}
            {catalog.status === "unreachable" && DISTRIBUTION.checkout !== null && (
              <div className="store-banner warn" role="status">
                <div className="store-banner-main">
                  <WifiOff size={18} aria-hidden="true" />
                  <div>
                    <strong>Prices shown are the last ones we know</strong>
                    <p>The Lakeside store can't be reached, so buying is paused. You can still browse everything.</p>
                    <div className="store-banner-actions"><button type="button" className="ghost small" onClick={reload}><RefreshCw size={13} aria-hidden="true" /> Try again</button></div>
                  </div>
                </div>
              </div>
            )}
            {serverDown && !user && <p className="store-note" role="status">The campaign server isn't reachable, so your purchases can't be checked right now.</p>}
          </div>

          {packId ? (
            <PackDetail packId={packId} key={packId} />
          ) : (
            <>
              <CompleteOffer />

              <section className="store-free" aria-labelledby="store-free-title">
                <div className="store-free-head">
                  <h2 id="store-free-title">The base game</h2>
                  <span className="store-owned"><span className="store-tick" aria-hidden="true">✓</span> Free for everyone</span>
                </div>
                <ul className="store-free-list">
                  {freeElections().map((m) => (
                    <li key={m.scenarioId}>
                      <span className="store-free-name">{m.flag} <b>{electionYearLabel(m)}</b> {electionName(m)}</span>
                      <DifficultyChip difficulty={m.difficulty} />
                      <button type="button" className="ghost small" onClick={() => onPlay(m.scenarioId)} aria-label={`Play ${m.label}`}>Play</button>
                    </li>
                  ))}
                  <li><span className="store-free-name"><b>Daily Challenge</b> A new seeded race every day</span></li>
                </ul>
              </section>

              <section className="store-packs" aria-labelledby="store-packs-title">
                <div className="store-packs-head">
                  <div>
                    <h2 id="store-packs-title">Country packs</h2>
                    <p className="store-packs-sub">
                      {plural(packs.length, "pack")}{user ? ` · ${ownedCount} owned` : ""}. Each is a one-time purchase.
                    </p>
                  </div>
                  <div className="store-filters" role="group" aria-label="Filter packs">
                    {(["all", "open", "owned"] as const).map((f) => (
                      <button key={f} type="button" className={filter === f ? "sel" : ""} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                        {f === "all" ? `All ${packs.length}` : f === "open" ? `Not owned ${packs.length - ownedCount}` : `Owned ${ownedCount}`}
                      </button>
                    ))}
                  </div>
                </div>
                {shown.length ? (
                  <div className="store-grid">{shown.map((p) => <PackTile key={p.id} pack={p} />)}</div>
                ) : (
                  <p className="store-empty" role="status">{filter === "owned" ? "You don't own any country packs yet." : "You own every country pack."}</p>
                )}
              </section>

              <section className="store-fine" aria-label="How purchases work">
                <ul>
                  <li>One-time purchases, no subscription. Prices are in US dollars.</li>
                  <li>
                    {DISTRIBUTION.checkout === null
                      ? `Packs are sold and restored through ${DISTRIBUTION.nativeStoreName ?? "your platform's store"} in this version.`
                      : "Purchases belong to your Lakeside Games account, so they unlock wherever you sign in. A refund removes the pack everywhere."}
                  </li>
                  <li>Questions or a missing purchase? <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a></li>
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </StoreContext.Provider>
  );
}
