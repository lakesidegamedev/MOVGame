import { ChevronRight } from "lucide-react";
import { packFacts, describeReason } from "@lib/storeModel";
import type { ScenarioPack } from "@content/packs";
import { useStoreCtx } from "./StoreContext";
import { OfferAction, useOffer } from "./OfferAction";
import { Cover, plural } from "./StoreParts";

export function PackTile({ pack }: { pack: ScenarioPack }) {
  const ctx = useStoreCtx();
  const facts = packFacts(pack);
  const offer = useOffer(pack.id);
  const owned = offer.kind === "owned";
  const soon = offer.kind === "coming-soon";
  return (
    <article className={`pack-tile${owned ? " owned" : ""}${soon ? " soon" : ""}`} aria-labelledby={`tile-${pack.id}`}>
      <button type="button" className="pack-tile-main" onClick={() => ctx.openPack(pack.id)} aria-label={`Open ${pack.name}: ${plural(facts.elections.length, "election")}`}>
        <span className="pack-tile-cover">
          <Cover facts={facts} />
          <span className="pack-tile-shade" aria-hidden="true" />
          <span className="pack-tile-flag" aria-hidden="true">{facts.flag}</span>
          {owned && <span className="pack-badge owned">Owned</span>}
          {soon && <span className="pack-badge soon">Coming soon</span>}
          <span className="pack-tile-name" id={`tile-${pack.id}`}>{pack.name}</span>
        </span>
        <span className="pack-tile-facts">
          <span className="pack-tile-count"><b>{plural(facts.elections.length, "election")}</b>{facts.yearRange && <> · {facts.yearRange}</>}</span>
          {facts.system && <span className="pack-tile-system">{facts.system}</span>}
        </span>
        <span className="pack-tile-desc">{pack.description}</span>
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
