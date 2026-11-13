import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { PAYWALL_ENABLED, SCENARIOS_BY_ID, scenarioTags } from "@content/scenarioRegistry";
import { partyFill, partyInk } from "@ui/colors";
import { Avatar } from "@ui/Avatar";

// One election in a setup picker: year, matchup, difficulty and lock state,
// all read from the scenario registry so every country shows the same facts.
export function ElectionTile({
  scenarioId,
  year,
  title,
  selected,
  locked,
  onClick,
}: {
  scenarioId: string;
  year: number;
  title: string;
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  const meta = SCENARIOS_BY_ID[scenarioId];
  const tags = meta ? scenarioTags(meta) : [];
  return (
    <button
      type="button"
      className={`election-tile${selected ? " sel" : ""}${locked ? " locked" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
      title={meta?.description}
    >
      <span className="election-tile-top">
        <span className="election-tile-year num">{year}</span>
        {locked && <Lock size={12} className="election-tile-lock" aria-label="Locked" />}
        {meta && <span className={`tag ${meta.difficulty}`}>{meta.difficulty}</span>}
        {PAYWALL_ENABLED && meta?.free && <span className="tag positive" title="Free to everyone, no account needed">Free</span>}
      </span>
      <span className="election-tile-title">{title}</span>
      {tags.length > 0 && (
        <span className="election-tile-note">{tags.includes("tide") ? "Historical tide" : tags.includes("coin-flip") ? "Coin flip" : "Challenge"}</span>
      )}
    </button>
  );
}

// A selectable party or candidate: color rail, portrait or initials, name in
// a legible party color, and a second line (leader or party).
export function PartyCard({
  name,
  sub,
  leader,
  color,
  selected,
  onClick,
  children,
}: {
  name: string;
  sub: ReactNode;
  leader: string;
  color: string;
  selected: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  const fill = partyFill(color);
  return (
    <button
      type="button"
      className={`party-card${selected ? " sel" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{ "--party": fill } as React.CSSProperties}
    >
      <Avatar name={leader} color={fill} size={40} ring />
      <span className="party-card-text">
        <span className="party-card-name" style={{ color: partyInk(color) }}>{name}</span>
        <span className="party-card-sub">{sub}</span>
      </span>
      {children}
    </button>
  );
}
