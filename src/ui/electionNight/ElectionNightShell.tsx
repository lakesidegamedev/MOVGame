// Election Night Reveal 2.0 — shared polished results overlay.
// Replaces the spreadsheet-style panels after the staged ElectionNight theater
// finishes. Presentation only: callers keep their own score-posting / auth /
// next-scenario wiring and pass the results in via props + children/footer.
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { partyFill, partyInk } from "@ui/colors";
import { Avatar } from "@ui/Avatar";
import { RollingCounter } from "./RollingCounter";
import { Swingometer, type SwingometerProps } from "./Swingometer";
import "./shell.css";
import { freeAlternative } from "@content/nextScenario";
import { usePlayNav } from "@store/playNav";

export interface ShellNextScenario {
  title: string;
  blurb: string;
  unlocked: boolean;
  ctaLabel: string;
  lockLabel: string;
  onPlay: () => void;
  onUnlock: () => void;
  /** Optional mini map / cartogram preview shown beside the copy. */
  mapPreview?: ReactNode;
  /** Shown when the next election is locked: a free one the player can start now. */
  freeAlternative?: { label: string; onPlay: () => void } | null;
}

/**
 * The free election to offer beside a locked next election (null when the
 * next one is playable), ready for the card. Starts it through the app root.
 */
export function freeChoice(unlocked: boolean, country: string, playedScenarioId: string): ShellNextScenario["freeAlternative"] {
  if (unlocked) return null;
  const meta = freeAlternative(country, playedScenarioId);
  if (!meta) return null;
  // The registry label already starts with the year ("2020 · Biden v. Trump").
  return { label: `${meta.flag} ${meta.label}`, onPlay: () => usePlayNav.getState().play(meta.scenarioId) };
}

export interface ElectionNightShellProps {
  /** Uppercase strip above the headline — "PROJECTED WINNER", "HUNG PARLIAMENT". */
  eyebrow: string;
  /** Animated winner / hung headline. */
  headline: string;
  headlineColor?: string;
  /** The projected winner's leader or candidate, shown as a portrait above the headline. */
  winner?: { name: string; color: string };
  /** One-line verdict under the headline. */
  subhead?: string;
  subheadTone?: "win" | "loss" | "neutral";

  /** Primary rolling counter (EV / seats). */
  counterValue: number;
  counterLabel: string;
  counterColor?: string;
  /** Optional secondary figure (e.g. popular-vote %). */
  secondaryCounter?: { value: number; label: string; decimals?: number; suffix?: string };

  swing: SwingometerProps;

  nextScenario?: ShellNextScenario | null;

  /** Mode-specific body: US call grid / map, UK seat bar, daily score, etc. */
  children?: ReactNode;
  /** Score posting, post-mortem, replay CTAs — kept intact by callers. */
  footer?: ReactNode;
}

export function ElectionNightShell({
  eyebrow,
  headline,
  headlineColor,
  winner,
  subhead,
  subheadTone = "neutral",
  counterValue,
  counterLabel,
  counterColor,
  secondaryCounter,
  swing,
  nextScenario,
  children,
  footer,
}: ElectionNightShellProps) {
  return (
    <div className="ens-root" data-testid="election-night-shell">
      <div className="ens-hero">
        {winner && (
          <div className="ens-winner" data-testid="ens-winner">
            <Avatar name={winner.name} color={partyFill(winner.color)} size={64} ring />
          </div>
        )}
        <div className="ens-eyebrow">{eyebrow}</div>
        <h1
          className="ens-headline"
          style={headlineColor ? { color: partyInk(headlineColor) } : undefined}
          data-testid="ens-headline"
        >
          {headline}
        </h1>
        {subhead && (
          <p className={`ens-subhead ens-${subheadTone}`} data-testid="ens-subhead">
            {subhead}
          </p>
        )}

        <div className="ens-counters">
          <div className="ens-counter-block">
            <RollingCounter
              value={counterValue}
              className="ens-counter"
              style={counterColor ? { color: partyInk(counterColor) } : undefined}
            />
            <div className="ens-counter-label">{counterLabel}</div>
          </div>
          {secondaryCounter && (
            <div className="ens-counter-block ens-secondary">
              <RollingCounter
                value={secondaryCounter.value}
                decimals={secondaryCounter.decimals ?? 1}
                className="ens-counter ens-counter-sm"
              />
              <div className="ens-counter-label">
                {secondaryCounter.label}
                {secondaryCounter.suffix ?? ""}
              </div>
            </div>
          )}
        </div>

        <Swingometer {...swing} />
      </div>

      {children && <div className="ens-body">{children}</div>}

      {(nextScenario || footer) && (
        <div className="ens-side">
          {nextScenario && <NextScenarioCard {...nextScenario} />}
          {footer && <div className="ens-footer">{footer}</div>}
        </div>
      )}
    </div>
  );
}

function NextScenarioCard({
  title,
  blurb,
  unlocked,
  ctaLabel,
  lockLabel,
  onPlay,
  onUnlock,
  mapPreview,
  freeAlternative,
}: ShellNextScenario) {
  return (
    <div className={`ens-next${unlocked ? "" : " locked"}`} data-testid="ens-next-scenario">
      <div className="ens-next-copy">
        <div className="ens-next-tag">{unlocked ? "NEXT SCENARIO" : "LOCKED SCENARIO"}</div>
        <div className="ens-next-title">{title}</div>
        <div className="ens-next-blurb">
          {blurb}
          {!unlocked ? " · locked" : ""}
        </div>
        {unlocked ? (
          <button className="primary" onClick={onPlay}>{ctaLabel}</button>
        ) : freeAlternative ? (
          <div className="ens-next-actions">
            <button className="primary" onClick={freeAlternative.onPlay} data-testid="ens-next-free">
              Play free: {freeAlternative.label} →
            </button>
            <button onClick={onUnlock}><Lock size={13} aria-hidden="true" />{lockLabel.replace(/^🔒\s*/, "")}</button>
          </div>
        ) : (
          <button onClick={onUnlock}><Lock size={13} aria-hidden="true" />{lockLabel.replace(/^🔒\s*/, "")}</button>
        )}
      </div>
      {mapPreview && <div className="ens-next-preview" aria-hidden>{mapPreview}</div>}
    </div>
  );
}
