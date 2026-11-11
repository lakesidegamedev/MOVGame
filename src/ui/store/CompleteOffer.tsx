import { PACKS_BY_ID } from "@content/packs";
import { DISTRIBUTION } from "@lib/distribution";
import { completeCovers, describeReason, formatPrice, priceCents, summarizeComplete, COMPLETE_ID } from "@lib/storeModel";
import { useStoreCtx } from "./StoreContext";
import { OfferAction, useBuyHint, useOffer } from "./OfferAction";
import { plural } from "./StoreParts";

function listNames(names: string[], max = 4): string {
  if (names.length <= max + 1) return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
}

/** The lead offer: what the Complete Collection contains, and what it adds for this player. */
export function CompleteOffer({ compact = false }: { compact?: boolean }) {
  const ctx = useStoreCtx();
  const offer = useOffer(COMPLETE_ID);
  const hint = useBuyHint();
  const sum = summarizeComplete(ctx.ownedPackIds, ctx.catalog);
  if (!sum) return null;
  const owned = offer.kind === "owned";
  const covers = completeCovers();
  const completePrice = priceCents(COMPLETE_ID, ctx.catalog);
  const buyable = offer.kind === "buy" || offer.kind === "unavailable";

  return (
    <section className={`store-hero${compact ? " compact" : ""}${owned ? " owned" : ""}`} aria-labelledby="store-complete-title">
      <div className="store-hero-art" aria-hidden="true">
        {covers.map((c) => (
          <span key={c.country} className="store-hero-tile" style={c.cover ? { backgroundImage: `url(${c.cover})` } : undefined}>
            {!c.cover && c.flag}
          </span>
        ))}
      </div>
      <div className="store-hero-body">
        <div className="store-hero-copy">
          <p className="store-eyebrow">{owned ? "Yours" : "Everything in one purchase"}</p>
          <h2 id="store-complete-title">{PACKS_BY_ID[COMPLETE_ID].name}</h2>
          <p className="store-hero-lede">
            {owned
              ? offer.kind === "owned" ? describeReason(offer.reason) + "." : ""
              : "Every country and every election, and every one we add in later updates."}
          </p>
          <ul className="store-stats" aria-label="What the Complete Collection contains">
            <li><b>{sum.elections}</b><span>elections</span></li>
            <li><b>{sum.countries}</b><span>countries</span></li>
            <li><b>1</b><span>price, no subscription</span></li>
          </ul>
          <div className="store-flags" aria-hidden="true">{covers.map((c) => <span key={c.country}>{c.flag}</span>)}</div>
          {!owned && sum.havePacks.length > 0 && sum.addsPacks.length > 0 && (
            <p className="store-adds">
              You already have {listNames(sum.havePacks.map((p) => p.name))}. This adds {listNames(sum.addsPacks.map((p) => p.name))}:{" "}
              <b>{plural(sum.addsElections, "more election")}</b>.
            </p>
          )}
          {!owned && sum.havePacks.length === 0 && (
            <p className="store-adds">Includes all {sum.addsPacks.length} country packs, from {listNames(sum.addsPacks.map((p) => p.name), 3)}.</p>
          )}
        </div>
        <div className="store-hero-buy">
          {owned ? (
            <p className="store-owned-note">
              <OfferAction packId={COMPLETE_ID} />
              {offer.kind === "owned" && offer.reason.kind === "included"
                ? "Nothing more to buy right now. Packs added later are sold separately."
                : "Nothing more to buy. New countries are included automatically."}
            </p>
          ) : DISTRIBUTION.checkout === null ? (
            <OfferAction packId={COMPLETE_ID} />
          ) : (
            <>
              {offer.kind !== "coming-soon" && (
                <div className="store-bigprice">
                  <span className="store-price big">{formatPrice(completePrice)}</span>
                  <span className="store-price-note">one-time</span>
                </div>
              )}
              <OfferAction packId={COMPLETE_ID} label="Buy the Complete Collection" showPrice={false} />
              {buyable && sum.addsPacks.length > 1 && sum.saveCents > 0 && (
                <p className="store-save">
                  The {sum.addsPacks.length} packs you don't have cost {formatPrice(sum.separateCents)} one by one.{" "}
                  <b>Save {formatPrice(sum.saveCents)}.</b>
                </p>
              )}
              {buyable && sum.addsPacks.length > 0 && sum.saveCents <= 0 && (
                <p className="store-save">
                  The {plural(sum.addsPacks.length, "pack")} you don't have cost {formatPrice(sum.separateCents)} together, so buy them one by one
                  if that is all you want. The Complete Collection also covers every pack added later.
                </p>
              )}
              {hint && buyable && <p className="store-hint">{hint}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
