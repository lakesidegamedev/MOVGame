import { useEffect, useState } from "react";
import { useUkStore } from "@store/ukStore";
import { majorityForUk, ukGameIssues } from "@engine/ukGame";
import { UkSetup } from "./UkSetup";
import { UkMap } from "./UkMap";
import { UkSeatBar } from "./UkSeatBar";
import { UkRegionPanel } from "./UkRegionPanel";
import { UkActionPanel } from "./UkActionPanel";
import { UkStandings } from "./UkStandings";
import { UkResults } from "./UkResults";
import { partyName, partyColor } from "./parties";
import { WeekRecapModal } from "@ui/WeekRecapModal";
import { MultipartyEventModal } from "@ui/MultipartyEventModal";
import { OnboardingCoach } from "@ui/coach/OnboardingCoach";
import { UK_EVENTS } from "@content/uk/events";
import { UK_ELECTION_EVENTS } from "@content/uk/electionEvents";
import { Home, MessageCircleQuestion } from "lucide-react";
import { DeskHeader } from "@ui/DeskHeader";
import { partyInk } from "@ui/colors";
import { movAskUrlFromSnapshot, movSeatAskSnapshot } from "@lib/ask";
import { moneyMillions } from "../format";

function ukEventView(electionId: string, eventId: string) {
  const deck = UK_ELECTION_EVENTS[electionId] ?? [];
  const ev = deck.find((e) => e.id === eventId) ?? UK_EVENTS.find((e) => e.id === eventId);
  if (!ev?.choices) return null;
  return {
    title: ev.headline.replace("{party}", "your party"),
    prompt: ev.prompt ?? "How do you respond?",
    choices: ev.choices,
  };
}

export function UkApp({ onExit, initialElection, initialSeed, initialParty, setup, onStarted }: {
  onExit: () => void;
  initialElection?: string;
  initialSeed?: string;
  initialParty?: string;
  /** A fresh setup screen: do not restore the autosave. */
  setup?: boolean;
  /** The setup screen started a game. */
  onStarted?: () => void;
}) {
  // Opened without a game in memory (a reload, the back button): restore the
  // autosave before the first render, so the setup screen never flashes.
  useState(() => {
    if (!setup && !useUkStore.getState().game) useUkStore.getState().tryResumeAutosave();
  });
  const game = useUkStore((s) => s.game);
  useEffect(() => {
    if (setup && game) onStarted?.();
  }, [setup, game, onStarted]);
  const endTurn = useUkStore((s) => s.endTurn);
  const undo = useUkStore((s) => s.undo);
  const canUndo = useUkStore((s) => s.history.length > 0);
  const live = useUkStore((s) => s.liveProjection)();
  const resolvePlayerEvent = useUkStore((s) => s.resolvePlayerEvent);
  const selectedRegionId = useUkStore((s) => s.selectedRegionId);
  const [recapOpen, setRecapOpen] = useState(false);

  if (!game) return <div className="app screen"><UkSetup onBack={onExit} initialElection={initialElection} initialSeed={initialSeed} initialParty={initialParty} /></div>;
  if (game.phase === "result") return <div className="app screen"><UkResults /></div>;

  const weeksLeft = game.totalTurns - game.turn;
  const res = game.resources[game.playerParty];
  const used = game.queuedActions.length;
  const playerSeats = live ? live.seats[game.playerParty] ?? 0 : 0;
  const maj = majorityForUk(game);
  const hasPending = !!game.pendingEvent;
  const pendingView = hasPending && game.pendingEvent
    ? ukEventView(game.electionId, game.pendingEvent.eventId)
    : null;

  const handleEndTurn = () => {
    if (hasPending) return;
    if (game.queuedActions.length === 0) {
      const ok = window.confirm("You have no actions queued this week. Unspent slots win nothing. End the week anyway?");
      if (!ok) return;
    }
    endTurn();
    const g = useUkStore.getState().game;
    if (g && g.phase !== "result" && (g.lastRecap?.length ?? 0) > 0 && !g.pendingEvent) setRecapOpen(true);
  };

  return (
    <div className="app screen desk">
      <DeskHeader
        kicker={<>United Kingdom · {game.label}</>}
        context={<>{weeksLeft} {weeksLeft === 1 ? "week" : "weeks"} to polling day · leading{" "}
          <strong style={{ color: partyInk(partyColor(game.playerParty)) }}>{partyName(game.playerParty)}</strong></>}
        scoreboard={live ? <UkSeatBar result={live} total={maj.total} threshold={maj.threshold} /> : undefined}
        metrics={[
          { label: "Your seats", value: playerSeats, color: partyInk(partyColor(game.playerParty)) },
          { label: "Funds", value: moneyMillions("£", res.funds, 0) },
          { label: "Actions", value: `${res.maxActions - used}/${res.maxActions}`, warn: used >= res.maxActions },
        ]}
        undoLabel="Undo"
        onUndo={undo}
        undoDisabled={!canUndo}
        endWeekLabel={hasPending ? "Resolve event first" : "End Week"}
        onEndWeek={handleEndTurn}
        endWeekDisabled={hasPending}
        ticker={game.news.length > 0 ? (
          <div className="ticker" role="status" aria-live="polite">
            <span className="ticker-tag"><span className="ticker-dot" /> WIRE</span>
            <span className="ticker-line">{game.news[0].text}</span>
          </div>
        ) : undefined}
        tools={<>
          <button className="ghost small" onClick={onExit}><Home size={14} aria-hidden="true" />Home</button>
          {live && <a className="ghost small" href={movAskUrlFromSnapshot(movSeatAskSnapshot(game, live, "UK", ukGameIssues(game)))} target="_blank" rel="noopener noreferrer"><MessageCircleQuestion size={14} aria-hidden="true" />Ask about campaign</a>}
        </>}
      />

      <div className="main">
        <div className="col">
          <UkMap />
          <UkStandings />
        </div>
        <div className="col">
          <UkRegionPanel />
          <UkActionPanel />
        </div>
      </div>

      {recapOpen && !hasPending && (
        <WeekRecapModal
          title={`Week ${Math.max(1, game.turn)} resolved`}
          items={game.lastRecap ?? []}
          unitLabel=" seats"
          onClose={() => setRecapOpen(false)}
        />
      )}
      {!recapOpen && pendingView && (
        <MultipartyEventModal event={pendingView} onResolve={resolvePlayerEvent} />
      )}

      <OnboardingCoach
        doneKey="coach-done-uk-v1"
        winLine={`Win ${maj.threshold} seats in {N} weeks. No pressure.`}
        mapHint="Click a region on the map to continue."
        mapBody="Your battleground. Colours show the current lean; click a competitive region."
        planBody="Queue your week: broadcasts, rallies, ground game. Actions cost slots. Spend all of them; unspent slots win nothing."
        selectedId={selectedRegionId}
        queuedLen={game.queuedActions.length}
        turn={game.turn}
        totalTurns={game.totalTurns}
        mapSelector=".mapwrap"
        detailSelector={(mobile) =>
          mobile
            ? document.querySelector(".sheet .card") ?? document.querySelector(".sheet")
            : document.querySelectorAll(".main .col")[1]?.querySelector(".card") ?? null
        }
      />
    </div>
  );
}
