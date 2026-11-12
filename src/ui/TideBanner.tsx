import { tideBlurb, scenarioTags, SCENARIOS_BY_ID, type ScenarioMeta } from "@content/scenarioRegistry";

/** Setup warning for landslide / coin-flip scenarios. */
export function TideBanner({ scenarioId, meta }: { scenarioId?: string; meta?: ScenarioMeta }) {
  const m = meta ?? (scenarioId ? SCENARIOS_BY_ID[scenarioId] : undefined);
  if (!m) return null;
  const blurb = tideBlurb(m);
  if (!blurb) return null;
  const tags = scenarioTags(m);
  const isTide = tags.includes("tide");
  return (
    <div className={`callout ${isTide ? "negative" : "warning"}`}>
      <div className="callout-title">{isTide ? "Historical tide" : "Coin-flip election"}</div>
      <div className="callout-body">{blurb.replace(/^(Historical tide:|Coin-flip election\.)\s*/, "")}</div>
    </div>
  );
}

/** Shown when the player picks a minor / non-front-runner party. */
export function ChallengePartyBanner({ partyLabel }: { partyLabel: string }) {
  return (
    <div className="callout warning">
      <div className="callout-title">Challenge path</div>
      <div className="callout-body">
        Leading {partyLabel} is a challenge scenario. Majority wins are rare. Play for kingmaker leverage, seat gains, or the post-mortem brag.
      </div>
    </div>
  );
}

/**
 * Shown when the player picks a regional party (CountryBundle.regional): where
 * it stands, why it cannot win a majority, and what counts as success.
 */
export function RegionalPartyBanner({ partyLabel, regionNames, seats, total, unitPlural, historical }: {
  partyLabel: string;
  regionNames: string[];
  seats: number;
  total: number;
  unitPlural: string;
  historical: number;
}) {
  const where = regionNames.length <= 1
    ? regionNames.join("")
    : `${regionNames.slice(0, -1).join(", ")} and ${regionNames[regionNames.length - 1]}`;
  return (
    <div className="callout warning">
      <div className="callout-title">Regional party</div>
      <div className="callout-body">
        {partyLabel} stands only in {where}: {seats} of {total} {unitPlural}, so it cannot win a majority or the most {unitPlural}.
        Success is beating its real result of {historical} {historical === 1 ? unitPlural.replace(/s$/, "") : unitPlural} and
        ending with the votes a government needs. The results screen scores you against that real result.
      </div>
    </div>
  );
}
