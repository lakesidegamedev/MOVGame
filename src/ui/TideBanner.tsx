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
