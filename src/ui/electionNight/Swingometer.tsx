// Swingometer — a broadcast-style needle gauge for the final margin.
// Positive values lean toward leftLabel; negative toward rightLabel.
// (US: pass Dem−Rep so a Dem lead tips left.) Clamped to ±maxAbs.
import { useEffect, useState } from "react";
import { partyFill, partyInk } from "@ui/colors";

function prefersReduced(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface SwingometerProps {
  value: number; // signed margin (pts or units)
  maxAbs?: number;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
  unitLabel?: string; // "pts" | "EV" | "seats"
  caption?: string;
  /**
   * Words for a player-relative margin, used instead of the sign and unit:
   * "37 behind" rather than "37 vs rival". `level` is shown at zero.
   */
  words?: { ahead: string; behind: string; level: string };
}

/** The margin as printed under the gauge. */
export function swingValueText(value: number, unitLabel: string, words?: SwingometerProps["words"]): string {
  const abs = Math.abs(value);
  const absStr = abs.toFixed(abs >= 10 ? 0 : 1);
  if (words) {
    if (value === 0) return words.level;
    return `${absStr.replace(/\.0$/, "")} ${value > 0 ? words.ahead : words.behind}`;
  }
  // Without words the margin is directional (US: Dem minus Rep): the needle
  // shows the side, and the number is its size.
  return `${value > 0 ? "+" : ""}${absStr} ${unitLabel}`;
}

export function Swingometer({
  value,
  maxAbs,
  leftLabel,
  rightLabel,
  leftColor,
  rightColor,
  unitLabel = "pts",
  caption,
  words,
}: SwingometerProps) {
  const span = Math.max(1, maxAbs ?? Math.max(Math.abs(value) * 1.35, 5));
  const clamped = Math.max(-span, Math.min(span, value));
  // Map +span…−span → −70°…+70° (SVG clockwise = right). Positive → left.
  const targetDeg = -(clamped / span) * 70;
  const [deg, setDeg] = useState(() => (prefersReduced() ? targetDeg : 0));

  useEffect(() => {
    if (prefersReduced()) {
      setDeg(targetDeg);
      return;
    }
    // Kick the needle on the next frame so the CSS transition fires.
    const h = requestAnimationFrame(() => setDeg(targetDeg));
    return () => cancelAnimationFrame(h);
  }, [targetDeg]);

  return (
    <div className="ens-swing" data-testid="swingometer">
      {caption && <div className="ens-swing-cap">{caption}</div>}
      <div className="ens-swing-gauge" aria-hidden>
        <svg viewBox="0 0 200 110" className="ens-swing-svg">
          <defs>
            <linearGradient id="ens-swing-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={partyFill(leftColor)} />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor={partyFill(rightColor)} />
            </linearGradient>
          </defs>
          <path
            d="M20 95 A80 80 0 0 1 180 95"
            fill="none"
            stroke="url(#ens-swing-grad)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <g
            className="ens-swing-needle"
            style={{ transform: `rotate(${deg}deg)`, transformOrigin: "100px 95px" }}
          >
            <line x1="100" y1="95" x2="100" y2="28" stroke="var(--text-strong)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="95" r="5" fill="var(--gold)" />
          </g>
        </svg>
      </div>
      <div className="ens-swing-labels">
        <span style={{ color: partyInk(leftColor) }}>{leftLabel}</span>
        <span className="ens-swing-value">
          {swingValueText(value, unitLabel, words)}
        </span>
        <span style={{ color: partyInk(rightColor) }}>{rightLabel}</span>
      </div>
    </div>
  );
}
