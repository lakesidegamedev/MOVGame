// The country election-night adapter. Pure, no store access; the map comes
// from the country's own bundle.
import type { PartyId } from "@engine/system";
import { majorityFor, type CountryBundle, type CountryGameState } from "@engine/countryGame";
import { partyColor as coColor, partyShort as coShort, sortBySeats as coSortBySeats } from "../country/helpers";
import { multipartyRows, multipartyUnits, type RevealData } from "./multipartyReveal";

// ── Country bundles (chamber sizes vary per election) ──
export function countryReveal(country: CountryBundle, game: CountryGameState): RevealData {
  const r = game.result!;
  const majority = majorityFor(game, country); // per-election winning post
  const color = (p: PartyId) => coColor(country, p);
  const short = (p: PartyId) => coShort(country, p);
  const units = multipartyUnits(r.seatResults, game.regions, color, short);
  return {
    title: `Election Night · ${game.label}`,
    totalUnits: majority.total,
    threshold: majority.threshold,
    parties: multipartyRows(r.seats, coSortBySeats(country, r.seats), color, short),
    units,
    playerPartyId: game.playerParty,
    unitLabel: country.unitNamePlural,
    map: country.map, // all shipped bundles carry one; undefined ⇒ chip-only
    noMajorityLabel: "NO OVERALL MAJORITY: HUNG PARLIAMENT",
    storageKey: `reveal-${game.seed}-${country.id.toLowerCase()}-${game.electionId}`,
    // Only plurality countries carry this key, so every other reveal is unchanged.
    ...(majority.plurality ? { pluralityWinner: r.largestParty } : {}),
  };
}
