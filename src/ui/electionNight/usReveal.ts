// The US election-night adapter: the final game state as RevealProps. Pure,
// no store access. Its own module so the UK and country results screens do
// not download the US scenario table and state map.
import type { GameState } from "@engine/types";
import { evMajority, noMajorityTally } from "@engine/electoralCollege";
import { SCENARIOS } from "@content/scenarios";
import { STATE_PATHS } from "@content/statePaths";
import type { RevealUnit } from "@lib/electionReveal";
import type { RevealMap } from "./ElectionNight";
import type { RevealData } from "./multipartyReveal";

// Same viewBox USMap.tsx uses to render STATE_PATHS in geo mode.
const US_MAP_VIEWBOX = "0 0 1000 650";

// Map geometry for the US reveal. At-large split units (ME-AL / NE-AL) reuse
// the parent state outline; the numbered congressional districts have no
// geometry of their own and stay chips-only.
function usRevealMap(units: RevealUnit[]): RevealMap {
  const shapes: RevealMap["shapes"] = {};
  for (const u of units) {
    const d =
      STATE_PATHS[u.id] ?? (u.id.endsWith("-AL") ? STATE_PATHS[u.id.split("-")[0]] : undefined);
    if (d) shapes[u.id] = { d };
  }
  // States with no electoral votes this year keep their outline, inert.
  const inert = Object.entries(STATE_PATHS)
    .filter(([id]) => !(id in shapes) && !(`${id}-AL` in shapes))
    .map(([, d]) => d);
  return { viewBox: US_MAP_VIEWBOX, shapes, ...(inert.length ? { inert } : {}) };
}

// ── US (two-party electoral college) ─────────────────────────────────────
export function usReveal(game: GameState): RevealData {
  const result = game.result!;
  const cands = game.candidates;
  const stById = new Map(game.states.map((s) => [s.id, s]));

  const units: RevealUnit[] = result.stateResults.map((sr) => {
    const st = stById.get(sr.stateId);
    return {
      id: sr.stateId,
      name: st?.name ?? sr.stateId,
      abbr: st?.abbr ?? sr.stateId,
      winnerId: sr.winner,
      winnerColor: cands[sr.winner].color,
      winnerShort: cands[sr.winner].shortName,
      units: sr.electoralVotes,
      margin: sr.margin,
      // Upset = the call differs from the state's baseline lean (the real
      // prior-election two-party share the scenario was solved against).
      upset: st ? (sr.winner === "dem") !== (st.prior2020DemShare > 0.5) : false,
    };
  });

  const scenarioId = game.scenarioId ?? "2020";
  const year = SCENARIOS[scenarioId]?.year ?? scenarioId;
  // The scenario's college: 270 of 538, 269 of 537, 266 of 531. No majority
  // reads as the deadlock (269-269 on the modern map) or the actual tally.
  const totalUnits = units.reduce((s, u) => s + u.units, 0);
  const threshold = evMajority(totalUnits);
  const deadlock = `${threshold - 1}-${threshold - 1}`;
  return {
    title: `Election Night · ${year}`,
    totalUnits,
    threshold,
    parties: [
      { id: "dem", short: cands.dem.shortName, color: cands.dem.color },
      { id: "rep", short: cands.rep.shortName, color: cands.rep.color },
    ],
    units,
    playerPartyId: game.playerCandidate,
    unitLabel: "EV",
    map: usRevealMap(units),
    noMajorityLabel: `${result.winner === "tie" ? noMajorityTally(result.electoralVotes) : deadlock}: ELECTION GOES TO THE HOUSE`,
    storageKey: `reveal-${game.seed}-us-${scenarioId}`,
  };
}

