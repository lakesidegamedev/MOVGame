import { useState } from "react";
import { useElementWidth } from "@ui/useElementWidth";
import { segmentLabel } from "@ui/format";
import { MapLabel, placeMapLabels, useMapLabelSizes, viewBoxWidth } from "@ui/mapLabels";
import { partyFill, partyInk, textOn } from "@ui/colors";
import { useCountryStore } from "@store/countryStore";
import { tallyRegion, allocateRegionSeats } from "@engine/multiparty";
import type { StateContest } from "@engine/types";
import { majorityFor, type CountryBundle, type CountryResult } from "@engine/countryGame";
import { partyColor, partyShort, partyName, sortBySeats, byDisplayOrder } from "./helpers";
import { MpPollBlock } from "@ui/MpPollBlock";
import { MapPin } from "lucide-react";

function regionWinner(region: StateContest): { winner: string; seats: Record<string, number>; lead: number } {
  const { shareByParty } = tallyRegion(region);
  const seats = allocateRegionSeats(region, shareByParty);
  let winner = "";
  let best = -1;
  let total = 0;
  for (const p of Object.keys(seats)) { total += seats[p]; if (seats[p] > best) { best = seats[p]; winner = p; } }
  const lead = total > 0 ? best / total : 0.5; // dominance → fill opacity
  return { winner, seats, lead };
}

// ── Seat bar (majority marker at the country's threshold) ──────────────────
export function CountrySeatBar({ country, result }: { country: CountryBundle; result: CountryResult }) {
  const game = useCountryStore((s) => s.game);
  const order = sortBySeats(country, result.seats);
  const { total, threshold } = game ? majorityFor(game, country) : country.system.majority;
  const w = (n: number) => `${(n / total) * 100}%`;
  const largest = order[0];
  const { ref: trackRef, width: trackWidth } = useElementWidth<HTMLDivElement>(300);

  return (
    <div className="evbar" title={`${country.unitNamePlural} won: ${threshold} for the win`}>
      <div className="endlabel" style={{ color: largest ? partyInk(partyColor(country, largest)) : undefined }}>
        {largest ? result.seats[largest] : 0}
      </div>
      <div className="track" ref={trackRef}>
        {order.map((p) => {
          const fill = partyFill(partyColor(country, p));
          return (
            <div key={p} className="seg" style={{ width: w(result.seats[p]), background: fill, color: textOn(fill) }} title={`${partyShort(country, p)} ${result.seats[p]}`}>
              {segmentLabel(result.seats[p] / total, partyShort(country, p), trackWidth)}
            </div>
          );
        })}
        <div className="threshold" style={{ left: `${(threshold / total) * 100}%` }} />
      </div>
      <div className="endlabel goal">{threshold}<small>to win</small></div>
    </div>
  );
}

// ── Country map: real geography when the bundle ships SVG shapes, tile
// cartogram otherwise (and always available as the Square view). ──
export function CountryMap() {
  const country = useCountryStore((s) => s.country)!;
  const game = useCountryStore((s) => s.game)!;
  const selected = useCountryStore((s) => s.selectedRegionId);
  const select = useCountryStore((s) => s.selectRegion);
  const hasGeo = !!country.map;
  const [mode, setMode] = useState<"geo" | "square">(hasGeo ? "geo" : "square");
  const { ref: labelRef, sizes: labelSizes } = useMapLabelSizes(country.map?.viewBox ?? "0 0 560 560");

  const metaById = Object.fromEntries(country.regions.map((r) => [r.id, r]));
  const rows = Math.max(...country.regions.map((r) => r.tile.row)) + 1;
  const cols = Math.max(...country.regions.map((r) => r.tile.col)) + 1;

  const header = (
    <div className="mapcontrols">
      <h3>
        {country.flag} {country.label} · {majorityFor(game, country).total} {country.unitNamePlural}
      </h3>
      {hasGeo && (
        <div className="segmented" role="group" aria-label="Map view">
          <button aria-pressed={mode === "geo"} onClick={() => setMode("geo")}>Geo</button>
          <button aria-pressed={mode === "square"} onClick={() => setMode("square")}>Square</button>
        </div>
      )}
    </div>
  );

  const legend = (
    <div className="legend">
      <span className="legend-note">Labels show leader {country.unitNamePlural} / region total.</span>
      {game.parties.filter((p) => country.playable.includes(p)).map((p) => (
        <span key={p} className="legend-item">
          <span className="swatch" style={{ "--party": partyFill(partyColor(country, p)) } as React.CSSProperties} />
          {partyShort(country, p)}
        </span>
      ))}
    </div>
  );

  if (mode === "geo" && country.map) {
    const { viewBox, shapes } = country.map;
    const labels = game.regions.flatMap((region) => {
      const shape = shapes[region.id];
      if (!shape) return [];
      const { winner, seats } = regionWinner(region);
      return [{
        id: region.id, x: shape.label[0], y: shape.label[1], name: region.abbr, weight: region.seats ?? 0,
        detail: winner ? `${partyShort(country, winner)} ${seats[winner]}/${region.seats}` : "",
      }];
    });
    const placed = placeMapLabels(labels, selected, labelSizes, viewBoxWidth(viewBox));
    return (
      <div className="card mapwrap sheen">
        {header}
        <svg ref={labelRef} viewBox={viewBox} className="geo-map" preserveAspectRatio="xMidYMid meet">
          {game.regions.map((region) => {
            const shape = shapes[region.id];
            if (!shape) return null;
            const { winner, lead } = regionWinner(region);
            const isSel = selected === region.id;
            return (
              <g key={region.id} style={{ cursor: "pointer" }} onClick={() => select(isSel ? null : region.id)}>
                <title>{`${region.name}: ${region.seats} ${country.unitNamePlural}`}</title>
                <path
                  d={shape.d}
                  fill={partyFill(partyColor(country, winner))}
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
      <div className="tilegrid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, aspectRatio: `${cols} / ${rows}`, "--grid-aspect": cols / rows } as React.CSSProperties}>
        {game.regions.map((region) => {
          const meta = metaById[region.id];
          const { winner, seats } = regionWinner(region);
          const isSel = selected === region.id;
          return (
            <div key={region.id} style={{ gridColumn: (meta?.tile.col ?? 0) + 1, gridRow: (meta?.tile.row ?? 0) + 1 }}>
              <div
                className={`tile${isSel ? " selected" : ""}`}
                style={{ background: partyFill(partyColor(country, winner)), color: textOn(partyFill(partyColor(country, winner))), width: "100%" }}
                onClick={() => select(isSel ? null : region.id)}
                role="button" tabIndex={0} aria-pressed={isSel} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(isSel ? null : region.id); } }}
                title={`${region.name}: ${region.seats} ${country.unitNamePlural}`}
              >
                <span>{region.abbr}</span>
                <span className="ev">{winner ? `${partyShort(country, winner)} ${seats[winner]}/${region.seats}` : region.seats}</span>
              </div>
            </div>
          );
        })}
      </div>
      {legend}
    </div>
  );
}

// ── National standings (projected outcome + salience) ──────────────────────
const GOV_LABEL: Record<string, string> = {
  majority: "Majority",
  minority: "Minority government",
  coalition: "Coalition",
  confidence_supply: "Confidence & supply",
  hung: "No majority",
};

export function CountryStandings() {
  const country = useCountryStore((s) => s.country)!;
  const game = useCountryStore((s) => s.game)!;
  const replay = useCountryStore((s) => s.replay);
  const live = useCountryStore((s) => s.liveProjection)();
  if (!live) return null;
  const order = sortBySeats(country, live.seats);
  const total = majorityFor(game, country).total;
  const issues = Object.keys(game.salience).filter((id) => game.salience[id] >= 0.1).sort((a, b) => game.salience[b] - game.salience[a]);
  const issueName = (id: string) => country.issues.find((i) => i.id === id)?.name ?? id;
  const openingShare = replay?.snapshots[0]?.standings.find((standing) => standing.id === game.playerParty)?.poll;
  const voteShift = openingShare === undefined ? null : ((live.voteShare[game.playerParty] ?? 0) - openingShare) * 100;

  return (
    <div className="card scroll">
      <h3>National Standings</h3>
      <div className="kv"><span className="k">Projected outcome</span><span style={{ color: partyInk(partyColor(country, live.largestParty)) }}>{country.runoff && live.government.kind === "majority" ? "Wins presidency" : GOV_LABEL[live.government.kind]}</span></div>
      <div className="kv"><span className="k">Leading</span><span style={{ color: partyInk(partyColor(country, live.largestParty)) }}>{partyName(country, live.largestParty)}</span></div>
      <div className="kv"><span className="k">Your momentum</span><span>{game.resources[game.playerParty].momentum.toFixed(0)}</span></div>
      {country.runoff && voteShift !== null && (
        <div className="kv" title="Change in your national runoff vote share since the opening map.">
          <span className="k">Runoff vote movement</span><span>{voteShift >= 0 ? "+" : ""}{voteShift.toFixed(2)} pts</span>
        </div>
      )}

      <MpPollBlock
        seed={game.seed}
        turn={game.turn}
        regions={game.regions}
        parties={order}
        playerParty={game.playerParty}
        partyLabel={(p) => partyShort(country, p)}
        partyColor={(p) => partyColor(country, p)}
      />

      <h3 className="section-gap">{country.unitNamePlural[0].toUpperCase() + country.unitNamePlural.slice(1)}</h3>
      {order.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === game.playerParty ? partyInk(partyColor(country, p)) : undefined, fontWeight: p === game.playerParty ? 700 : 500 }}>
            <span className="swatch" style={{ "--party": partyFill(partyColor(country, p)) } as React.CSSProperties} />
            {partyShort(country, p)}
          </span>
          <span className="meta" title="Units won and national vote share. Votes for parties below a district threshold may yield few or no seats.">{live.seats[p]} {country.unitNamePlural} · {((live.voteShare[p] ?? 0) * 100).toFixed(country.runoff ? 2 : 1)}% votes</span>
          <div className="suppbar"><div style={{ width: `${Math.min(100, (live.seats[p] / total) * 100 * 2)}%`, background: partyColor(country, p) }} /></div>
        </div>
      ))}

      <h3 className="section-gap">Issue Salience</h3>
      {issues.map((id) => (
        <div className="bloc issue-row" key={id} aria-label={`${issueName(id)} salience ${(game.salience[id] * 100).toFixed(0)}%`}>
          <span className="name">{issueName(id)}</span>
          <span className="meta">{(game.salience[id] * 100).toFixed(0)}%</span>
          <div className="suppbar"><div style={{ width: `${game.salience[id] * 100}%`, background: "var(--gold)" }} /></div>
        </div>
      ))}
    </div>
  );
}

// ── Region detail panel ─────────────────────────────────────────────────────
export function CountryRegionPanel() {
  const country = useCountryStore((s) => s.country)!;
  const game = useCountryStore((s) => s.game)!;
  const selectedId = useCountryStore((s) => s.selectedRegionId);
  const queueAction = useCountryStore((s) => s.queueAction);
  const player = game.playerParty;
  const region = game.regions.find((r) => r.id === selectedId);

  if (!region) {
    return (
      <div className="card">
        <h3>Region Detail</h3>
        <p className="empty-hint">Select a region on the map to inspect its vote shares, projection, and campaign there.</p>
      </div>
    );
  }

  const { shareByParty } = tallyRegion(region);
  const seats = allocateRegionSeats(region, shareByParty);
  const parties = Object.keys(shareByParty).sort((a, b) => byDisplayOrder(country, a, b));
  const playerStands = region.baselineShare?.[player] !== undefined;
  const topOpp = parties
    .filter((p) => p !== player && (shareByParty[p] ?? 0) > 0.03)
    .sort((a, b) => (shareByParty[b] ?? 0) - (shareByParty[a] ?? 0))[0];
  const res = game.resources[player];
  const canAct = game.queuedActions.length < res.maxActions;

  return (
    <div className="card scroll">
      <h3>{region.name} · {region.seats} {country.unitNamePlural}</h3>

      {playerStands ? (
        <div className="detail-actions">
          <button disabled={!canAct} onClick={() => queueAction({ type: "canvass", party: player, regionId: region.id })}>
            <MapPin size={14} /> Canvass
          </button>
          <button disabled={!canAct} onClick={() => queueAction({ type: "rally", party: player, regionId: region.id })}>Rally</button>
          {topOpp && (
            <button disabled={!canAct} onClick={() => queueAction({ type: "oppo_research", party: player, regionId: region.id, targetParty: topOpp })}>
              Target {partyShort(country, topOpp)}
            </button>
          )}
        </div>
      ) : (
        <p className="muted small">Your party doesn't contest {region.name}.</p>
      )}

      <h3 className="section-gap">Parties</h3>
      {parties.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === player ? partyInk(partyColor(country, p)) : undefined, fontWeight: p === player ? 700 : 500 }}>
            <span className="swatch" style={{ "--party": partyFill(partyColor(country, p)) } as React.CSSProperties} />
            {partyShort(country, p)}
          </span>
          <span className="meta">{((shareByParty[p] ?? 0) * 100).toFixed(1)}% · {seats[p] ?? 0} {country.unitNamePlural}</span>
          <div className="suppbar">
            <div style={{ width: `${(shareByParty[p] ?? 0) * 100}%`, background: partyColor(country, p) }} />
            <div style={{ width: `${(1 - (shareByParty[p] ?? 0)) * 100}%`, background: "#222833" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
