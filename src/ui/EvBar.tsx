import type { Projection } from "@engine/index";
import { PartyLogo } from "@ui/PartyLogo";

// The You/Tossup/Them tally bar, always Dem-left / GOP-right, out of the
// scenario's college (every contest is dem, rep or tossup, so they sum to it).
// With the election `year`, each end shows that party's logo.
export function EvBar({ projection, year }: { projection: Projection; year?: number }) {
  const dem = projection.ev.dem;
  const gop = projection.ev.rep;
  const tossup = projection.tossupEv;
  const total = dem + gop + tossup || 538;
  const w = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="evbar">
      <div className={`endlabel dem`}>{year !== undefined && <PartyLogo country="US" party="dem" year={year} size={14} />}{dem}</div>
      <div className="evbar-track-wrap">
        <div className="track">
          {dem > 0 && <div className="seg dem" style={{ width: w(dem) }}>{dem >= 30 ? "DEM" : ""}</div>}
          {tossup > 0 && <div className="seg tossup" style={{ width: w(tossup) }} title={`${tossup} tossup EV`} />}
          {gop > 0 && <div className="seg gop" style={{ width: w(gop) }}>{gop >= 30 ? "GOP" : ""}</div>}
        </div>
        <span className="evbar-tossup-label">{tossup} TOSSUP EV</span>
      </div>
      <div className={`endlabel gop`}>{gop}{year !== undefined && <PartyLogo country="US" party="rep" year={year} size={14} />}</div>
    </div>
  );
}
