import type { UkGameState, UkResult } from "@engine/ukGame";
import type { CountryGameState, CountryResult } from "@engine/countryGame";

// `issues` names the election's issues (countryGameIssues / ukGameIssues).
export function movSeatAskSnapshot(
  game: UkGameState | CountryGameState,
  projection: UkResult | CountryResult,
  country: string,
  issues: readonly { id: string; name: string }[],
) {
  const issueNames = new Map(issues.map((i) => [i.id, i.name]));
  const player = game.playerParty;
  const resources = game.resources[player];
  const names = new Map(game.regions.map((region) => [region.id, region.name]));
  return {
    version: 1,
    game: "electioneer",
    scenario: game.label,
    country,
    turn: game.turn,
    totalTurns: game.totalTurns,
    player,
    fundsMillions: resources.funds,
    momentum: resources.momentum,
    actionsLeft: Math.max(0, resources.actions - game.queuedActions.length),
    seatPlayer: projection.seats[player] ?? 0,
    seatTotal: Object.values(projection.seats).reduce((sum, seats) => sum + seats, 0),
    regions: projection.seatResults.map((result) => ({
      name: result.name,
      totalSeats: result.totalSeats,
      playerSeats: result.seatsByParty[player] ?? 0,
    })),
    planned: game.queuedActions.map((action) => ({
      move: action.type,
      target: action.regionId ? (names.get(action.regionId) ?? action.regionId) : "National",
      ...(action.issueId ? { issue: issueNames.get(action.issueId) ?? action.issueId } : {}),
    })),
  };
}

export function movAskUrlFromSnapshot(snapshot: object): string {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > 8_000) return "https://ask.lakesidegames.net/?game=electioneer";
  const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `https://ask.lakesidegames.net/from-mov#mov=${encoded}`;
}
