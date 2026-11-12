// The UK election-night adapter. Pure, no store access.
import type { UkGameState } from "@engine/ukGame";
import { REGION_PATHS, UK_VIEWBOX } from "@content/uk/regionPaths";
import { partyColor as ukColor, partyShort as ukShort, sortBySeats as ukSortBySeats } from "../uk/parties";
import { multipartyRows, multipartyUnits, type RevealData } from "./multipartyReveal";

// ── UK (650-seat Westminster) ────────────────────────────────────────────
export function ukReveal(game: UkGameState): RevealData {
  const r = game.result!;
  const units = multipartyUnits(r.seatResults, game.regions, ukColor, ukShort);
  const total = units.reduce((s, u) => s + u.units, 0); // 650 in the modern era
  return {
    title: `Election Night · ${game.label}`,
    totalUnits: total,
    threshold: Math.floor(total / 2) + 1, // 326 of 650
    parties: multipartyRows(r.seats, ukSortBySeats(r.seats), ukColor, ukShort),
    units,
    playerPartyId: game.playerParty,
    unitLabel: "seats",
    map: { viewBox: UK_VIEWBOX, shapes: REGION_PATHS },
    noMajorityLabel: "NO OVERALL MAJORITY: HUNG PARLIAMENT",
    storageKey: `reveal-${game.seed}-uk-${game.electionId}`,
  };
}

