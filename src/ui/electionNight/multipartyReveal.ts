// Shared pieces of the UK and country election-night adapters.
import type { PartyId } from "@engine/system";
import type { SeatResult, StateContest } from "@engine/types";
import { OTHERS_ID, type RevealUnit } from "@lib/electionReveal";
import type { RevealParty, RevealProps } from "./ElectionNight";

export type RevealData = Omit<RevealProps, "onDone">;

export const OTHERS_COLOR = "#5b6b8c";

// ── Shared multiparty helpers (UK + country) ─────────────────────────────
// Winner's regional margin in points = gap between the top two vote shares.
function regionMargin(sr: SeatResult): number {
  const shares = Object.values(sr.voteShare).sort((a, b) => b - a);
  return ((shares[0] ?? 0) - (shares[1] ?? 0)) * 100;
}

// Upset = the region's plurality winner differs from its real-baseline seat
// winner (StateContest.baselineSeats, the election's actual seat split).
function regionUpset(sr: SeatResult, region: StateContest | undefined): boolean {
  const base = region?.baselineSeats;
  if (!base) return false;
  const baseWinner = Object.entries(base).sort((a, b) => b[1] - a[1])[0]?.[0];
  return baseWinner !== undefined && baseWinner !== sr.winner;
}

export function multipartyUnits(
  seatResults: SeatResult[],
  regions: StateContest[],
  color: (p: PartyId) => string,
  short: (p: PartyId) => string,
): RevealUnit[] {
  const regById = new Map(regions.map((r) => [r.id, r]));
  return seatResults.map((sr) => {
    const region = regById.get(sr.contestId);
    return {
      id: sr.contestId,
      name: sr.name,
      abbr: region?.abbr ?? sr.contestId,
      winnerId: sr.winner,
      winnerColor: color(sr.winner),
      winnerShort: short(sr.winner),
      units: sr.totalSeats,
      allocation: sr.seatsByParty,
      margin: regionMargin(sr),
      upset: regionUpset(sr, region),
    };
  });
}

// Tally rows: top 4 parties by final seats, plus an aggregated "others" row
// when more parties than that actually won seats.
export function multipartyRows(
  seats: Record<PartyId, number>,
  order: PartyId[],
  color: (p: PartyId) => string,
  short: (p: PartyId) => string,
): RevealParty[] {
  const rows: RevealParty[] = order.slice(0, 4).map((p) => ({ id: p, short: short(p), color: color(p) }));
  const winners = Object.keys(seats).filter((p) => (seats[p] ?? 0) > 0);
  if (winners.length > rows.length) rows.push({ id: OTHERS_ID, short: "OTH", color: OTHERS_COLOR });
  return rows;
}

