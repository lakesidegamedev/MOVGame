import { useState } from "react";
import { MapLabel, placeMapLabels, useMapLabelSizes, viewBoxWidth } from "@ui/mapLabels";
import { partyFill, textOn } from "@ui/colors";
import { useUkStore } from "@store/ukStore";
import { majorityForUk } from "@engine/ukGame";
import { tallyRegion, allocateRegionSeats } from "@engine/multiparty";
import { REGION_PATHS, UK_VIEWBOX } from "@content/uk/regionPaths";
import { partyColor, partyShort } from "./parties";
import type { StateContest } from "@engine/types";
import { PartyLogo, electionYear } from "@ui/PartyLogo";

// Rough geographic tile layout for the square cartogram fallback (north at top).
const TILES: Record<string, { row: number; col: number }> = {
  SCO: { row: 0, col: 1 },
  NI: { row: 1, col: 0 }, NE: { row: 1, col: 2 },
  NW: { row: 2, col: 1 }, YH: { row: 2, col: 2 },
  WAL: { row: 3, col: 0 }, WM: { row: 3, col: 1 }, EM: { row: 3, col: 2 }, EE: { row: 3, col: 3 },
  SW: { row: 4, col: 1 }, LON: { row: 4, col: 2 }, SE: { row: 4, col: 3 },
};

function regionWinner(region: StateContest): { winner: string; seats: Record<string, number>; lead: number } {
  const { shareByParty } = tallyRegion(region);
  const seats = allocateRegionSeats(region, shareByParty);
  let winner = "";
  let best = -1;
  let total = 0;
  for (const p of Object.keys(seats)) { total += seats[p]; if (seats[p] > best) { best = seats[p]; winner = p; } }
  // How dominant the leader is (0.5 = split, 1 = sweep) → map opacity.
  const lead = total > 0 ? best / total : 0.5;
  return { winner, seats, lead };
}

export function UkMap() {
  const game = useUkStore((s) => s.game)!;
  const selected = useUkStore((s) => s.selectedRegionId);
  const select = useUkStore((s) => s.selectRegion);
  const [mode, setMode] = useState<"geo" | "square">("geo");
  const { ref: labelRef, sizes: labelSizes } = useMapLabelSizes(UK_VIEWBOX);
  const seatsTotal = majorityForUk(game).total;

  const header = (
    <div className="mapcontrols">
      <h3>Seat Map · {seatsTotal} seats</h3>
      <div className="segmented" role="group" aria-label="Map view">
        <button aria-pressed={mode === "geo"} onClick={() => setMode("geo")}>Geo</button>
        <button aria-pressed={mode === "square"} onClick={() => setMode("square")}>Square</button>
      </div>
    </div>
  );

  const legend = (
    <div className="legend">
      <span className="legend-note">Labels show leader seats / region total.</span>
      {["lab", "con", "ld", "ref", "snp", "grn", "pc"].map((p) => (
        <span key={p} className="legend-item">
          <PartyLogo country="UK" party={p} year={electionYear(game.electionId)} color={partyColor(p)} size={14} />
          {partyShort(p)}
        </span>
      ))}
    </div>
  );

  if (mode === "geo") {
    const labels = game.regions.flatMap((region) => {
      const shape = REGION_PATHS[region.id];
      if (!shape) return [];
      const { winner, seats } = regionWinner(region);
      return [{
        id: region.id, x: shape.label[0], y: shape.label[1], name: region.abbr, weight: region.seats ?? 0,
        detail: winner ? `${partyShort(winner)} ${seats[winner]}/${region.seats}` : "",
      }];
    });
    const placed = placeMapLabels(labels, selected, labelSizes, viewBoxWidth(UK_VIEWBOX));
    return (
      <div className="card mapwrap sheen">
        {header}
        <svg ref={labelRef} viewBox={UK_VIEWBOX} className="geo-map" preserveAspectRatio="xMidYMid meet">
          {game.regions.map((region) => {
            const shape = REGION_PATHS[region.id];
            if (!shape) return null;
            const { winner, lead } = regionWinner(region);
            const isSel = selected === region.id;
            return (
              <g key={region.id} style={{ cursor: "pointer" }} onClick={() => select(isSel ? null : region.id)}>
                <title>{`${region.name}: ${region.seats} seats`}</title>
                <path
                  d={shape.d}
                  fill={partyFill(partyColor(winner))}
                  fillOpacity={0.45 + lead * 0.55}
                  stroke={isSel ? "var(--gold)" : "#0c1322"}
                  strokeWidth={isSel ? 3 : 1}
                />
              </g>
            );
          })}
          {labels.map((l) => <MapLabel key={l.id} {...l} x={placed[l.id]!.x} mode={placed[l.id]!.mode} sizes={labelSizes} />)}
        </svg>
        {legend}
      </div>
    );
  }

  return (
    <div className="card mapwrap sheen">
      {header}
      <div className="tilegrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(5, 1fr)", aspectRatio: "4 / 5", "--grid-aspect": 4 / 5 } as React.CSSProperties}>
        {game.regions.map((region) => {
          const pos = TILES[region.id] ?? { row: 5, col: 0 };
          const { winner, seats } = regionWinner(region);
          const isSel = selected === region.id;
          return (
            <div key={region.id} style={{ gridColumn: pos.col + 1, gridRow: pos.row + 1 }}>
              <div
                className={`tile${isSel ? " selected" : ""}`}
                style={{ background: partyFill(partyColor(winner)), color: textOn(partyFill(partyColor(winner))), width: "100%" }}
                onClick={() => select(isSel ? null : region.id)}
                role="button" tabIndex={0} aria-pressed={isSel} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(isSel ? null : region.id); } }}
                title={`${region.name}: ${region.seats} seats`}
              >
                <span>{region.abbr}</span>
                <span className="ev">{winner ? `${partyShort(winner)} ${seats[winner]}/${region.seats}` : region.seats}</span>
              </div>
            </div>
          );
        })}
      </div>
      {legend}
    </div>
  );
}
