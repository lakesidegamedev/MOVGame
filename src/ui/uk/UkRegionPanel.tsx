import { useUkStore } from "@store/ukStore";
import { partyInk, partyFill } from "@ui/colors";
import { tallyRegion, allocateRegionSeats } from "@engine/multiparty";
import { partyColor, partyShort, byDisplayOrder } from "./parties";
import { MapPin } from "lucide-react";

// A horizontal multiparty share bar (the UK analog of the dem/rep .suppbar).
function ShareBar({ shares }: { shares: Record<string, number> }) {
  const order = Object.keys(shares).sort((a, b) => (shares[b] ?? 0) - (shares[a] ?? 0));
  return (
    <div className="suppbar">
      {order.map((p) => (
        <div key={p} style={{ width: `${(shares[p] ?? 0) * 100}%`, background: partyColor(p) }} />
      ))}
    </div>
  );
}

export function UkRegionPanel() {
  const game = useUkStore((s) => s.game)!;
  const selectedId = useUkStore((s) => s.selectedRegionId);
  const queueAction = useUkStore((s) => s.queueAction);
  const player = game.playerParty;
  const region = game.regions.find((r) => r.id === selectedId);

  if (!region) {
    return (
      <div className="card">
        <h3>Region Detail</h3>
        <p className="empty-hint">Select a region on the map to inspect its vote shares, seat projection, and campaign there.</p>
      </div>
    );
  }

  const { shareByParty } = tallyRegion(region);
  const seats = allocateRegionSeats(region, shareByParty);
  const parties = Object.keys(shareByParty).sort(byDisplayOrder);
  const playerStands = region.baselineShare?.[player] !== undefined;
  const opponents = parties.filter((p) => p !== player && (shareByParty[p] ?? 0) > 0.03);
  const topOpp = opponents.sort((a, b) => (shareByParty[b] ?? 0) - (shareByParty[a] ?? 0))[0];
  const res = game.resources[player];
  const canAct = game.queuedActions.length < res.maxActions;

  return (
    <div className="card scroll">
      <h3>{region.name} · {region.seats} seats</h3>

      {playerStands ? (
        <div className="detail-actions">
          <button disabled={!canAct} onClick={() => queueAction({ type: "canvass", party: player, regionId: region.id })}>
            <MapPin size={14} /> Canvass
          </button>
          <button disabled={!canAct} onClick={() => queueAction({ type: "rally", party: player, regionId: region.id })}>Rally</button>
          {topOpp && (
            <button disabled={!canAct} onClick={() => queueAction({ type: "oppo_research", party: player, regionId: region.id, targetParty: topOpp })}>
              Target {partyShort(topOpp)}
            </button>
          )}
        </div>
      ) : (
        <p className="muted small">Your party doesn't stand in {region.name}.</p>
      )}

      <div className="kv"><span className="k">Vote share</span><span /></div>
      <div style={{ margin: "2px 0 10px" }}><ShareBar shares={shareByParty} /></div>

      <h3 className="section-gap">Parties</h3>
      {parties.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === player ? partyInk(partyColor(p)) : undefined, fontWeight: p === player ? 700 : 500 }}>
            <span className="swatch" style={{ "--party": partyFill(partyColor(p)) } as React.CSSProperties} />
            {partyShort(p)}
          </span>
          <span className="meta">{((shareByParty[p] ?? 0) * 100).toFixed(1)}% · {seats[p] ?? 0} seats</span>
          <div className="suppbar">
            <div style={{ width: `${(shareByParty[p] ?? 0) * 100}%`, background: partyColor(p) }} />
            <div style={{ width: `${(1 - (shareByParty[p] ?? 0)) * 100}%`, background: "#222833" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
