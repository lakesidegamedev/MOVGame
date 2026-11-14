// Shared "Next Campaign" retention card used by US / UK / country results.

import { SIGN_IN_TO_PLAY_FREE, useFreeAccess } from "@lib/freeAccess";

export function NextCampaignCard({
  title,
  subtitle,
  blurb,
  unlocked,
  ctaLabel,
  lockLabel,
  onPlay,
  onUnlock,
}: {
  title: string;
  subtitle?: string;
  blurb: string;
  unlocked: boolean;
  ctaLabel: string;
  lockLabel: string;
  onPlay: () => void;
  onUnlock: () => void;
}) {
  const fa = useFreeAccess();
  const signInFree = !unlocked && fa.on && !fa.signedIn;
  return (
    <div className="card">
      <h3>Next Campaign</h3>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          {subtitle && <div className="muted small">{subtitle}</div>}
          <div className="muted small">{blurb}{!unlocked ? (signInFree ? ` · ${fa.untilLine}` : " · locked") : ""}</div>
        </div>
        {unlocked ? (
          <button className="secondary" onClick={onPlay}>{ctaLabel}</button>
        ) : (
          <button className="secondary" onClick={onUnlock}>{signInFree ? SIGN_IN_TO_PLAY_FREE : lockLabel}</button>
        )}
      </div>
    </div>
  );
}
