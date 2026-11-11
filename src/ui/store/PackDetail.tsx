import { useEffect, useRef } from "react";
import { Lock, Play } from "lucide-react";
import { PACKS_BY_ID } from "@content/packs";
import { scenarioTags } from "@content/scenarioRegistry";
import { DISTRIBUTION } from "@lib/distribution";
import { COMPLETE_ID, describeReason, formatPrice, packFacts, priceCents, summarizeComplete } from "@lib/storeModel";
import { useStoreCtx } from "./StoreContext";
import { OfferAction, useBuyHint, useOffer } from "./OfferAction";
import { Cover, DifficultyChip, electionName, electionYearLabel, plural } from "./StoreParts";

export function PackDetail({ packId }: { packId: string }) {
  const ctx = useStoreCtx();
  const pack = PACKS_BY_ID[packId];
  const offer = useOffer(packId);
  const completeOffer = useOffer(COMPLETE_ID);
  const hint = useBuyHint();
  const focusRef = useRef<HTMLLIElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [packId]);
  useEffect(() => { focusRef.current?.scrollIntoView?.({ block: "center", behavior: "auto" }); }, [packId, ctx.focusScenarioId]);

  if (!pack) return null;
  const facts = packFacts(pack);
  const owned = offer.kind === "owned";
  const sum = summarizeComplete(ctx.ownedPackIds, ctx.catalog);
  const showCompleteAlt = pack.id !== COMPLETE_ID && !owned;

  return (
    <div className="store-detail">
      <header className="store-detail-head">
        <Cover facts={facts} className="store-detail-cover" />
        <span className="store-detail-shade" aria-hidden="true" />
        <div className="store-detail-title">
          <span className="store-detail-flag" aria-hidden="true">{facts.flag}</span>
          <div>
            <h2 tabIndex={-1} ref={headingRef}>{pack.name}</h2>
            <p className="store-detail-meta">
              <b>{facts.countLabel}</b>
              {facts.yearRange && <> · {facts.yearRange}</>}
              {facts.system && <> · {facts.system}</>}
            </p>
          </div>
        </div>
      </header>

      <div className="store-detail-grid">
        <div className="store-detail-main">
          <p className="store-detail-desc">{pack.description}</p>
          <h3 className="store-h3">Elections in this pack</h3>
          <ol className="store-elections">
            {facts.elections.map((m) => {
              const open = owned || ctx.canPlay(m.scenarioId);
              const tags = scenarioTags(m);
              const isFocus = m.scenarioId === ctx.focusScenarioId;
              return (
                <li key={m.scenarioId} ref={isFocus ? focusRef : undefined} className={`store-election${isFocus ? " is-focus" : ""}`}>
                  <span className="store-election-year">{electionYearLabel(m)}</span>
                  <span className="store-election-main">
                    <span className="store-election-name">{m.flag} {electionName(m)}</span>
                    <span className="store-election-desc">{m.description}</span>
                    <span className="store-election-tags">
                      {m.free && <span className="store-chip tag-free">Free</span>}
                      <DifficultyChip difficulty={m.difficulty} />
                      {tags.includes("tide") && <span className="store-chip tag-tide">Historical tide</span>}
                      {tags.includes("coin-flip") && <span className="store-chip tag-coin">Coin-flip</span>}
                      {tags.includes("challenge") && <span className="store-chip tag-challenge">Challenge</span>}
                      {isFocus && !open && <span className="store-chip tag-focus">The election you tried to open</span>}
                    </span>
                  </span>
                  <span className="store-election-act">
                    {open ? (
                      <button type="button" className="primary small" onClick={() => ctx.play(m.scenarioId)} aria-label={`Play ${m.label}`}>
                        <Play size={12} aria-hidden="true" /> Play
                      </button>
                    ) : (
                      <span className="store-election-lock"><Lock size={13} aria-hidden="true" /> Locked</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="store-buybox" aria-label={owned ? "Ownership" : "Buy options"}>
          {owned ? (
            <div className="store-buybox-owned">
              <OfferAction packId={packId} />
              <p>{offer.kind === "owned" ? describeReason(offer.reason) : ""}.</p>
              <p className="store-buybox-sub">Every election in this pack is open to play.</p>
            </div>
          ) : (
            <>
              <div className="store-option">
                <div className="store-option-head">
                  <span className="store-option-name">{pack.name}</span>
                  <span className="store-option-meta">{facts.countLabel}</span>
                </div>
                <OfferAction packId={packId} label={`Buy ${pack.name}`} />
              </div>
              {showCompleteAlt && sum && (
                <div className="store-option alt">
                  <div className="store-option-head">
                    <span className="store-option-name">Complete Collection</span>
                    <span className="store-option-meta">{sum.elections} elections, {sum.countries} countries</span>
                  </div>
                  <p className="store-option-sub">
                    {completeOffer.kind === "owned"
                      ? ""
                      : sum.havePacks.length > 0
                        ? `Adds the ${plural(sum.addsPacks.length, "pack")} you don't have (${plural(sum.addsElections, "election")}) and every pack added later.`
                        : `Every country, plus every pack added later.${sum.saveCents > 0 && sum.addsPacks.length > 1 ? ` Cheaper than buying all ${sum.addsPacks.length} packs separately (${formatPrice(sum.separateCents)}).` : ""}`}
                  </p>
                  <OfferAction packId={COMPLETE_ID} label="Buy everything" accessibleName="Buy the Complete Collection" primary={false} />
                </div>
              )}
              {hint && (offer.kind === "buy" || completeOffer.kind === "buy") && <p className="store-hint">{hint}</p>}
              {DISTRIBUTION.checkout !== null && priceCents(packId, ctx.catalog) > 0 && (
                <p className="store-hint">One-time purchase, no subscription. It belongs to your Lakeside Games account.</p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
