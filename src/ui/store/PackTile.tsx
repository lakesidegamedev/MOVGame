import { ChevronRight } from "lucide-react";
import { packFacts, describeReason, packDescription, packName } from "@lib/storeModel";
import type { ScenarioPack } from "@content/packs";
import { useStoreCtx } from "./StoreContext";
import { OfferAction, useOffer } from "./OfferAction";
import { Cover } from "./StoreParts";

export function PackTile({ pack }: { pack: ScenarioPack }) {
  const ctx = useStoreCtx();
  const facts = packFacts(pack);
  const offer = useOffer(pack.id);
  const owned = offer.kind === "owned";
  const soon = offer.kind === "coming-soon";
  const name = packName(pack.id, ctx.catalog);
  return (
    <article className={`pack-tile${owned ? " owned" : ""}${soon ? " soon" : ""}`} aria-labelledby={`tile-${pack.id}`}>
      <button type="button" className="pack-tile-main" onClick={() => ctx.openPack(pack.id)} aria-label={`Open ${name}: ${facts.countLabel}`}>
        <span className="pack-tile-cover">
          <Cover facts={facts} />
          <span className="pack-tile-shade" aria-hidden="true" />
          <span className="pack-tile-flag" aria-hidden="true">{facts.flag}</span>
          {owned && <span className="pack-badge owned">Owned</span>}
          {soon && <span className="pack-badge soon">Coming soon</span>}
          <span className="pack-tile-name" id={`tile-${pack.id}`}>{name}</span>
        </span>
        <span className="pack-tile-facts">
          <span className="pack-tile-count"><b>{facts.countLabel}</b>{facts.yearRange && <> · {facts.yearRange}</>}</span>
          {facts.system && <span className="pack-tile-system">{facts.system}</span>}
        </span>
        <span className="pack-tile-desc">{packDescription(pack.id, ctx.catalog)}</span>
        <span className="pack-tile-more" aria-hidden="true">{owned ? "View elections" : "See elections"} <ChevronRight size={13} /></span>
      </button>
      <div className="pack-tile-foot">
        {owned ? (
          <span className="pack-reason">{offer.kind === "owned" ? describeReason(offer.reason) : ""}</span>
        ) : (
          <OfferAction packId={pack.id} compact />
        )}
      </div>
    </article>
  );
}
