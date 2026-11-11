import { CheckCircle2, ExternalLink, Info, LoaderCircle, Play, RefreshCw, TriangleAlert, X } from "lucide-react";
import { PACKS_BY_ID } from "@content/packs";
import { useAuthStore } from "@store/authStore";
import { useStoreFlow, type FlowPhase } from "@store/storeFlow";
import { electionsToOffer, summarizeComplete, COMPLETE_ID, LOADING_CATALOG } from "@lib/storeModel";
import { useStoreCtx } from "./StoreContext";

function packName(packId: string | null): string {
  return (packId && PACKS_BY_ID[packId]?.name) || "your purchase";
}

function Spin() {
  return <LoaderCircle size={16} className="store-spin" aria-hidden="true" />;
}

/** What the player just unlocked, in numbers computed from the data. */
function unlockedLine(packId: string | null): string {
  const pack = packId ? PACKS_BY_ID[packId] : undefined;
  if (!pack) return "Your purchase is on your account.";
  if (pack.id === COMPLETE_ID) {
    const sum = summarizeComplete([], LOADING_CATALOG);
    return sum
      ? `All ${sum.elections} elections in ${sum.countries} countries are yours, and every country we add later.`
      : "Every country and election is yours.";
  }
  return `All ${pack.scenarios.length} election${pack.scenarios.length === 1 ? "" : "s"} in the pack are yours.`;
}

/**
 * The one place purchase progress is told to the player: signing in,
 * checkout open, confirming, taking longer than usual, cancelled, done. It is
 * a polite live region so the changes are announced without stealing focus.
 */
export function PurchaseBanner() {
  const { phase, checking, checkNow, dismiss, openLinkPage } = useStoreFlow();
  const ctx = useStoreCtx();
  const start = useStoreFlow((s) => s.start);
  const openModal = useAuthStore((s) => s.openModal);
  const ahdLinked = !!ctx.user?.ahdLinked;

  if (phase.kind === "idle") return <div className="store-live" role="status" aria-live="polite" />;

  const closeBtn = (
    <button type="button" className="store-banner-close" onClick={dismiss} aria-label="Dismiss message"><X size={16} /></button>
  );

  const body = ((): { tone: "info" | "good" | "warn" | "bad"; node: React.ReactNode } => {
    switch (phase.kind) {
      case "redirecting":
        return {
          tone: "info",
          node: (
            <div className="store-banner-main">
              <Spin />
              <div>
                <strong>{phase.to === "sign-in" ? "Taking you to sign in with Lakeside Games…" : "Taking you to checkout…"}</strong>
                <p>{phase.to === "sign-in" ? "You'll come straight back here and carry on to checkout." : "You'll come back to the game when you're done."}</p>
              </div>
            </div>
          ),
        };
      case "needs-login":
        return {
          tone: "info",
          node: (
            <div className="store-banner-main">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>{phase.reason === "return" ? "Log in to see your purchase" : "Log in to buy"}</strong>
                <p>
                  {phase.reason === "return"
                    ? "Log in with the account you bought with and the pack will show up."
                    : `Log in to your game account, then press Buy on ${packName(phase.packId)} again.`}
                </p>
                <div className="store-banner-actions">
                  <button type="button" className="primary small" onClick={() => openModal("login")}>Log in</button>
                  {phase.reason === "return" && ctx.user && (
                    <button type="button" className="ghost small" onClick={() => useStoreFlow.getState().handleReturn("success", phase.packId)}>Check again</button>
                  )}
                </div>
              </div>
            </div>
          ),
        };
      case "link-external": {
        const packId = phase.packId;
        return {
          tone: "info",
          node: ahdLinked ? (
            <div className="store-banner-main">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>Lakeside Games account linked</strong>
                <p>You can check out for {packName(packId)} now.</p>
                <div className="store-banner-actions">
                  <button type="button" className="primary small" onClick={() => start(packId, { catalog: ctx.catalog, scenarioId: ctx.focusScenarioId })}>Continue to checkout</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="store-banner-main">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>Link your Lakeside Games account to buy</strong>
                <p>
                  Purchases belong to your Lakeside Games account. Open the game site in your browser, log in with this
                  account's email and password, and choose Sign in with Lakeside Games. Then come back here.
                </p>
                <div className="store-banner-actions">
                  <button type="button" className="primary small" onClick={openLinkPage}>
                    <ExternalLink size={13} aria-hidden="true" /> {phase.opened ? "Open again" : "Open in browser"}
                  </button>
                  <button type="button" className="ghost small" disabled={checking} onClick={() => void checkNow()}>
                    <RefreshCw size={13} aria-hidden="true" /> I've linked it, check
                  </button>
                </div>
                <p className="store-banner-url">Or copy this link: <span>{phase.url}</span></p>
              </div>
            </div>
          ),
        };
      }
      case "checkout-open":
        return {
          tone: "info",
          node: (
            <div className="store-banner-main">
              <Spin />
              <div>
                <strong>Checkout is open in your browser</strong>
                <p>Finish paying there, then come back. {packName(phase.packId)} unlocks here as soon as the payment goes through.</p>
                <div className="store-banner-actions">
                  <button type="button" className="ghost small" disabled={checking} onClick={() => void checkNow()}>
                    <RefreshCw size={13} aria-hidden="true" /> I've paid, check now
                  </button>
                  <button type="button" className="ghost small" onClick={() => start(phase.packId, { catalog: ctx.catalog, scenarioId: ctx.focusScenarioId })}>
                    <ExternalLink size={13} aria-hidden="true" /> Open checkout again
                  </button>
                </div>
                <p className="store-banner-url">Browser didn't open? Copy this link: <span>{phase.url}</span></p>
              </div>
            </div>
          ),
        };
      case "confirming":
        return {
          tone: "info",
          node: (
            <div className="store-banner-main">
              <Spin />
              <div>
                <strong>Confirming your payment…</strong>
                <p>Unlocking {packName(phase.packId)}. This usually takes a few seconds.</p>
              </div>
            </div>
          ),
        };
      case "slow":
        return {
          tone: "warn",
          node: (
            <div className="store-banner-main">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>{phase.fromCheckout ? "Still waiting for your payment" : "Still processing"}</strong>
                <p>
                  {phase.unverified
                    ? "We couldn't reach the Lakeside store to check. Your purchase is safe; try again in a moment."
                    : phase.fromCheckout
                      ? `${packName(phase.packId)} hasn't shown up yet. If you've paid, it can take a minute. Refresh to check, or open checkout again.`
                      : `Your payment went through, but ${packName(phase.packId)} hasn't reached your account yet. This can take a minute. Nothing else is needed: refresh to check again.`}
                </p>
                <div className="store-banner-actions">
                  <button type="button" className="primary small" disabled={checking} onClick={() => void checkNow()}>
                    <RefreshCw size={13} className={checking ? "store-spin" : undefined} aria-hidden="true" /> {checking ? "Checking…" : "Refresh"}
                  </button>
                  {phase.fromCheckout && phase.packId && (
                    <button type="button" className="ghost small" onClick={() => start(phase.packId!, { catalog: ctx.catalog, scenarioId: ctx.focusScenarioId })}>Open checkout again</button>
                  )}
                </div>
              </div>
            </div>
          ),
        };
      case "success": {
        const offers = phase.packId ? electionsToOffer(phase.packId, phase.focusScenarioId, phase.ownedBefore) : [];
        return {
          tone: "good",
          node: (
            <div className="store-banner-main">
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <strong>{packName(phase.packId)} unlocked</strong>
                <p>{unlockedLine(phase.packId)}</p>
                {offers.length > 0 && (
                  <div className="store-banner-actions play">
                    {offers.map((m, i) => (
                      <button key={m.scenarioId} type="button" className={i === 0 ? "primary small" : "ghost small"} onClick={() => ctx.play(m.scenarioId)}>
                        <Play size={12} aria-hidden="true" /> Play {m.flag} {m.label.split("·")[0].trim()}
                      </button>
                    ))}
                    <button type="button" className="ghost small" onClick={dismiss}>Keep browsing</button>
                  </div>
                )}
              </div>
            </div>
          ),
        };
      }
      case "cancelled":
        return {
          tone: "info",
          node: (
            <div className="store-banner-main">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>Checkout cancelled</strong>
                <p>Nothing was charged.</p>
                {phase.packId && ctx.catalog.status !== "loading" && (
                  <div className="store-banner-actions">
                    <button type="button" className="ghost small" disabled={ctx.busy} onClick={() => ctx.buy(phase.packId!)}>Try again</button>
                  </div>
                )}
              </div>
            </div>
          ),
        };
      case "error":
        return {
          tone: "bad",
          node: (
            <div className="store-banner-main" role="alert">
              <TriangleAlert size={18} aria-hidden="true" />
              <div>
                <strong>{phase.message}</strong>
                {phase.url && <p className="store-banner-url"><span>{phase.url}</span></p>}
              </div>
            </div>
          ),
        };
    }
  })();

  return (
    <div className="store-live" role="status" aria-live="polite">
      <div className={`store-banner ${body.tone}`} data-phase={(phase as FlowPhase).kind}>
        {body.node}
        {phase.kind !== "redirecting" && closeBtn}
      </div>
    </div>
  );
}
