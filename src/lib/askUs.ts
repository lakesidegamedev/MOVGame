import type { GameState } from "@engine/types";
import type { Projection } from "@engine/voteModel";
import { getScenario } from "@content/scenarios";
import { electoralRule } from "@engine/electoralCollege";
import { movAskUrlFromSnapshot } from "./ask";

// The Ask handoff from the US desk. Separate from ./ask because it reads the
// US scenario table, which the UK and country shells should not download.

export function movAskSnapshot(game: GameState, projection: Projection) {
  const player = game.playerCandidate;
  const opponent = player === "dem" ? "rep" : "dem";
  const resources = game.resources[player];
  const names = new Map(game.states.map((state) => [state.id, state.name]));
  const sign = player === "dem" ? 1 : -1;
  return {
    version: 1,
    game: "electioneer",
    scenario: getScenario(game.scenarioId).label,
    country: "US",
    turn: game.turn,
    totalTurns: game.totalTurns,
    player,
    cash: resources.cash,
    momentum: resources.nationalMomentum,
    actionsLeft: Math.max(0, resources.actions - game.queuedActions.length),
    evPlayer: projection.ev[player],
    evOpponent: projection.ev[opponent],
    tossupEv: projection.tossupEv,
    // The scenario's college: 538 and 270 on the modern map, 531 and 266 before 1960.
    evTotal: electoralRule(game.states).total,
    evMajority: electoralRule(game.states).majority,
    states: projection.contests.map((contest) => ({
      name: names.get(contest.stateId) ?? contest.stateId,
      ev: contest.ev,
      playerMargin: (contest.demShare - 0.5) * 200 * sign,
    })),
    planned: game.queuedActions.map((action) => ({
      move: action.type,
      target: action.stateId ? (names.get(action.stateId) ?? action.stateId) : "National",
      // The issue an issue ad or pivot is about, by this election's name for it.
      ...(action.issueId ? { issue: game.issues[action.issueId]?.name ?? action.issueId } : {}),
    })),
  };
}

export function movAskUrl(game: GameState, projection: Projection): string {
  return movAskUrlFromSnapshot(movAskSnapshot(game, projection));
}
