import { useMemo } from "react";
import { deriveReport, type ReplayLog } from "@lib/replay";
import { Sparkline } from "./Sparkline";
import { replayMoney } from "./replayMoney";

// Post-game "why you won / lost" breakdown, built entirely from the replay
// log. Engine-agnostic: it renders for US, UK, and country games alike and
// simply omits any block whose data does not apply.

const pts = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

/** Where the player finished against the top rival, in words, never a signed number. */
export function verdictText(marginPts: number, rivalName: string, won: boolean | null, unitLabel: string): string {
  const size = Math.abs(marginPts).toFixed(1);
  const standing = Math.abs(marginPts) < 0.05
    ? `level with ${rivalName}`
    : `${size} ${size === "1.0" ? "point" : "points"} ${marginPts > 0 ? "ahead of" : "behind"} ${rivalName}`;
  if (won === null) return `You finished ${standing}.`;
  if (won) {
    return marginPts > 0
      ? `You finished ${standing} and took the lead in ${unitLabel}.`
      : `You finished ${standing} on the vote but took the lead in ${unitLabel}.`;
  }
  return marginPts > 0
    ? `You finished ${standing} on the vote but fell short in ${unitLabel}.`
    : `You finished ${standing} and fell short in ${unitLabel}.`;
}

export function WhyReport({ log, won }: { log: ReplayLog | null; won: boolean | null }) {
  const r = useMemo(() => deriveReport(log), [log]);
  if (!r.hasData) return null;

  const rivalName = r.topRivalName ?? "the field";
  const flipsToPlayer = r.flips.filter((f) => f.toPlayer).length;
  const flipsAway = r.flips.length - flipsToPlayer;

  // One plain-English read of the arc.
  const verdict = verdictText(r.finalMarginPts, rivalName, won, r.unitLabel);

  const debates = r.events.filter((e) => e.text.startsWith("Debate:"));
  const otherEvents = r.events.filter((e) => !e.text.startsWith("Debate:"));

  return (
    <div className="card">
      <h3>Why You {won === null ? "Finished Here" : won ? "Won" : "Lost"}</h3>
      <p className="muted small">{verdict}</p>

      {/* Headline numbers */}
      <div className="report-grid">
        <div className="report-cell">
          <div className="rv">{pts(r.finalMarginPts)}</div>
          <div className="rl">Final margin (pts)</div>
        </div>
        <div className="report-cell">
          <div className="rv">{pts(r.swingPts)}</div>
          <div className="rl">Swing since start</div>
        </div>
        <div className="report-cell">
          <div className="rv">{r.peakUnits} / {r.floorUnits}</div>
          <div className="rl">Peak / floor {r.unitLabel}</div>
        </div>
        {r.cashSpent !== null && (
          <div className="report-cell">
            <div className="rv">{replayMoney(log, r.cashSpent)}</div>
            <div className="rl">Net cash used, including fundraising</div>
          </div>
        )}
        <div className="report-cell">
          <div className="rv">{r.flips.length}</div>
          <div className="rl">Lead changes</div>
        </div>
      </div>

      {/* Polling trend */}
      {r.marginTrend.length >= 2 && (
        <div className="report-section">
          <div className="report-title">Your national margin, start to finish</div>
          <Sparkline
            values={r.marginTrend.map((p) => p.value)}
            color="var(--gold)"
            mid={0}
            width={420}
            height={54}
          />
          {r.flips.length > 0 && (
            <p className="muted small" style={{ marginTop: 4 }}>
              The {r.unitLabel} lead changed hands {r.flips.length} time{r.flips.length === 1 ? "" : "s"}
              {flipsToPlayer > 0 || flipsAway > 0
                ? ` (${flipsToPlayer} in your favor, ${flipsAway} against).`
                : "."}
            </p>
          )}
        </div>
      )}

      {/* Decisive contests */}
      {r.decisiveContests.length > 0 && (
        <div className="report-section">
          <div className="report-title">Decisive contests (closest finishes)</div>
          {r.decisiveContests.map((c) => (
            <div className="report-row" key={c.id}>
              <span>{c.name}</span>
              <span className={c.won ? "up" : "down"}>
                {c.won ? "Won" : "Lost"} by {Math.abs(c.marginPts).toFixed(1)} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Spending / action summary */}
      {r.actionTally.length > 0 && (
        <div className="report-section">
          <div className="report-title">What you spent the campaign doing</div>
          {r.actionTally.slice(0, 8).map((a) => (
            <div className="report-row" key={a.label}>
              <span>{a.label}</span>
              <span className="muted">{a.count}x</span>
            </div>
          ))}
        </div>
      )}

      {/* Debate outcomes */}
      {debates.length > 0 && (
        <div className="report-section">
          <div className="report-title">Debate nights</div>
          {debates.map((d, i) => (
            <div className="report-row dated" key={i}>
              <span className="num">Week {d.turn}</span>
              <span>{d.text.replace(/^Debate:\s*/, "")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Event impact */}
      {otherEvents.length > 0 && (
        <div>
          <div className="report-title">Events that hit the campaign</div>
          {otherEvents.slice(0, 10).map((e, i) => (
            <div className="report-row dated" key={i}>
              <span className="num">Week {e.turn}</span>
              <span className="muted">{e.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
