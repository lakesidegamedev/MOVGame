import type { ReactNode } from "react";
import { ArrowRight, Undo2, Vote } from "lucide-react";
import { BRAND } from "../brand";

export interface DeskMetric {
  label: string;
  value: ReactNode;
  /** Text color for the value (already legible on dark surfaces). */
  color?: string;
  /** Highlights the metric when it needs attention (for example no actions left). */
  warn?: boolean;
  title?: string;
}

// The campaign desk header shared by all three engines: identity and race
// context on the left, the live scoreboard in the middle, the player's
// resources, then Undo and End week. A second band carries the news wire and
// the desk tools. On phones the first band stays pinned while the rest
// scrolls away.
export function DeskHeader({
  kicker,
  context,
  scoreboard,
  metrics,
  tools,
  ticker,
  banner,
  undoLabel,
  onUndo,
  undoDisabled,
  endWeekLabel,
  onEndWeek,
  endWeekDisabled,
}: {
  kicker: ReactNode;
  context: ReactNode;
  scoreboard?: ReactNode;
  metrics: DeskMetric[];
  tools: ReactNode;
  ticker?: ReactNode;
  banner?: ReactNode;
  undoLabel: string;
  onUndo: () => void;
  undoDisabled: boolean;
  endWeekLabel: string;
  onEndWeek: () => void;
  endWeekDisabled: boolean;
}) {
  return (
    <header className="desk-header">
      <div className="desk-bar topbar">
        <div className="desk-id brand-lockup">
          <span className="mark" aria-hidden="true"><Vote size={20} /></span>
          <div className="desk-id-text">
            <div className="desk-kicker"><span className="desk-brand">{BRAND.name}</span>{kicker}</div>
            <div className="desk-context turnchip">{context}</div>
          </div>
        </div>
        {scoreboard && <div className="desk-score">{scoreboard}</div>}
        <dl className="desk-metrics">
          {metrics.map((m) => (
            <div className={`desk-metric${m.warn ? " warn" : ""}`} key={m.label} title={m.title}>
              <dt>{m.label}</dt>
              <dd className="num" style={m.color ? { color: m.color } : undefined}>{m.value}</dd>
            </div>
          ))}
        </dl>
        <div className="desk-turn">
          <button className="ghost desk-undo" onClick={onUndo} disabled={undoDisabled} aria-label={undoLabel} title={undoLabel}>
            <Undo2 size={15} aria-hidden="true" /><span className="desk-undo-label">{undoLabel}</span>
          </button>
          <button className="primary desk-endweek" data-coach="endweek" onClick={onEndWeek} disabled={endWeekDisabled}>
            {endWeekLabel}{!endWeekDisabled && <ArrowRight size={15} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="desk-subbar">
        {ticker ?? <span className="desk-ticker-empty" />}
        <nav className="desk-tools toolbar" aria-label="Campaign tools">{tools}</nav>
      </div>
      {banner}
    </header>
  );
}
