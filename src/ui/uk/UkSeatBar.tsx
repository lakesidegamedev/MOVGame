import type { UkResult } from "@engine/ukGame";
import { partyColor, partyShort, sortBySeats } from "./parties";
import { partyFill, partyInk, textOn } from "@ui/colors";

// Seat tally bar styled like the U.S. EvBar: largest party on the left, a
// stacked track sized to this election's chamber, and the majority marker.
export function UkSeatBar({
  result,
  total = 650,
  threshold = 326,
}: {
  result: UkResult;
  total?: number;
  threshold?: number;
}) {
  const order = sortBySeats(result.seats);
  const w = (n: number) => `${(n / total) * 100}%`;
  const largest = order[0];

  return (
    <div className="evbar" title={`Seats won: ${threshold} for a majority`}>
      <div className="endlabel" style={{ color: largest ? partyInk(partyColor(largest)) : undefined }}>
        {largest ? result.seats[largest] : 0}
      </div>
      <div className="track">
        {order.map((p) => {
          const fill = partyFill(partyColor(p));
          return (
            <div key={p} className="seg" style={{ width: w(result.seats[p]), background: fill, color: textOn(fill) }} title={`${partyShort(p)} ${result.seats[p]}`}>
              {result.seats[p] >= 40 ? partyShort(p) : ""}
            </div>
          );
        })}
        <div className="threshold" style={{ left: `${(threshold / total) * 100}%` }} />
      </div>
      <div className="endlabel goal">{threshold}<small>majority</small></div>
    </div>
  );
}
