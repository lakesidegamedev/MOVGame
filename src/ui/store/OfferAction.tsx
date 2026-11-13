import { useId } from "react";
import { Check, Clock, Lock, RefreshCw } from "lucide-react";
import { DISTRIBUTION } from "@lib/distribution";
import { describeReason, formatPrice, offerFor, packName, unavailableMessage, type Offer } from "@lib/storeModel";
import { useStoreCtx } from "./StoreContext";

export function useOffer(packId: string): Offer {
  const { ownedPackIds, purchases, catalog } = useStoreCtx();
  return offerFor(packId, { ownedPackIds, purchases, catalog, policy: DISTRIBUTION });
}

/** One line telling the player what happens when they press Buy. */
export function useBuyHint(): string | null {
  const { user } = useStoreCtx();
  if (DISTRIBUTION.checkout === null) return null;
  if (DISTRIBUTION.checkout === "system-browser") {
    if (!user) return "Log in to your game account first. Checkout opens in your browser.";
    if (!user.ahdLinked) return "Buying needs a Lakeside Games account linked to this game account. We'll show you how.";
    return "Checkout opens in your browser, and this window keeps your place.";
  }
  if (!user?.ahdLinked) return "You'll sign in with Lakeside Games, then check out. You come straight back here.";
  return "Secure checkout through your Lakeside Games account. You come straight back here.";
}

/** Price block and the one action that fits the pack's state. Owned packs show no price and no Buy. */
export function OfferAction({ packId, label, accessibleName, primary = true, compact = false, showPrice = true }: {
  packId: string;
  /** Button text; defaults to "Buy". */
  label?: string;
  /** What a screen reader hears before the price, when the visible text alone is not enough ("Buy everything"). */
  accessibleName?: string;
  primary?: boolean;
  compact?: boolean;
  showPrice?: boolean;
}) {
  const ctx = useStoreCtx();
  const offer = useOffer(packId);
  const noteId = useId();
  const name = packName(packId, ctx.catalog);

  // Free access: never a price or a Buy, even for a pack the switch somehow left out.
  if (ctx.freeAccess && offer.kind !== "owned") return null;
  if (offer.kind === "owned") {
    return (
      <span className="store-owned" title={describeReason(offer.reason)}>
        <Check size={14} aria-hidden="true" /> Owned
      </span>
    );
  }
  if (offer.kind === "native-store") {
    return <span className="store-soon"><Lock size={13} aria-hidden="true" /> Sold through {offer.storeName}</span>;
  }
  if (offer.kind === "preview") {
    return (
      <span className={`store-action${compact ? " compact" : ""}`}>
        <button type="button" className={`${primary ? "primary" : "ghost"}${compact ? " small" : ""}`} disabled aria-describedby={noteId}>
          {label ?? "Buy"}
        </button>
        <span id={noteId} className="store-action-note">Not available in the preview</span>
      </span>
    );
  }
  if (offer.kind === "coming-soon") {
    return <span className="store-soon"><Clock size={13} aria-hidden="true" /> Coming soon</span>;
  }
  const buyName = accessibleName ?? (label && label.includes(name) ? label : `${label ?? "Buy"} ${name}`);
  if (offer.kind === "unavailable") {
    // No live price: no number anywhere, Buy off, and a way to ask again.
    return (
      <span className={`store-action${compact ? " compact" : ""}`}>
        <button
          type="button"
          className={`${primary ? "primary" : "ghost"}${compact ? " small" : ""}`}
          disabled
          aria-describedby={noteId}
          aria-label={buyName}
        >
          {label ?? "Buy"}
        </button>
        <span id={noteId} className="store-action-note" role="status">
          {unavailableMessage(offer.reason)}
          {offer.reason === "unreachable" && (
            <button type="button" className="ghost small store-retry" onClick={ctx.retryCatalog}>
              <RefreshCw size={12} aria-hidden="true" /> Try again
            </button>
          )}
        </span>
      </span>
    );
  }
  const price = formatPrice(offer.priceCents);
  return (
    <span className={`store-action${compact ? " compact" : ""}`}>
      {showPrice && <span className="store-price" aria-label={`Price ${price}`}>{price}</span>}
      <button
        type="button"
        className={`${primary ? "primary" : "ghost"}${compact ? " small" : ""}`}
        disabled={ctx.busy}
        aria-label={`${buyName} for ${price}`}
        onClick={() => ctx.buy(packId)}
      >
        {label ?? "Buy"}
      </button>
    </span>
  );
}
