import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useGameStore } from "@store/gameStore";
import { useAuthStore } from "@store/authStore";
import { SetupScreen, type EditorLaunchTarget } from "@ui/SetupScreen";
import { USMap } from "@ui/USMap";
import { StatePanel } from "@ui/StatePanel";
import { IntelPanel } from "@ui/IntelPanel";
import { ActionPanel } from "@ui/ActionPanel";
import { EvBar } from "@ui/EvBar";
import { NewsTicker } from "@ui/NewsTicker";
import { COACH_DONE_KEY } from "@ui/coach/OnboardingCoach";
import { UsOnboardingCoach } from "@ui/coach/UsOnboardingCoach";
import { getScenario } from "@content/scenarios";
import { money, turnLabel } from "@ui/format";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { registerSavedCustomScenarios } from "@persistence/local";
import { movAskUrl } from "@lib/askUs";
import { GENERIC_DEBATES, HISTORICAL_EVENTS } from "@content/events";
import { sfx } from "@lib/sfx";
import { useHotkeys } from "@lib/hotkeys";
import { X, Settings, Home, BarChart3, History, Users, BookOpen, MessageCircleQuestion, Save, Download, Upload } from "lucide-react";
import { DeskHeader } from "@ui/DeskHeader";
import { partyInk } from "@ui/colors";
import { LazyFallback, ModalFallback } from "@ui/Fallbacks";

// THE U.S. GAME SHELL: setup, the campaign desk and the results screen. A lazy
// chunk like the UK and country shells, so the US engine, scenarios, events
// and state map stay out of the landing page download.

// The results screen and every in-game overlay (recap/event/debate/guide/
// candidates/stats/settings/timeline) only ever mount after a real user
// action (a turn ends, a button is clicked). None of them are on the first
// paint / resume path, so they load on demand and keep this chunk lean.
const ResultsScreen = lazy(() => import("@ui/ResultsScreen").then((m) => ({ default: m.ResultsScreen })));
const EventModal = lazy(() => import("@ui/EventModal").then((m) => ({ default: m.EventModal })));
const DebateScorecard = lazy(() => import("@ui/DebateScorecard").then((m) => ({ default: m.DebateScorecard })));
const RecapModal = lazy(() => import("@ui/RecapModal").then((m) => ({ default: m.RecapModal })));
const GuidePage = lazy(() => import("@ui/GuidePage").then((m) => ({ default: m.GuidePage })));
const CandidateScreen = lazy(() => import("@ui/CandidateScreen").then((m) => ({ default: m.CandidateScreen })));
const StatsScreen = lazy(() => import("@ui/StatsScreen").then((m) => ({ default: m.StatsScreen })));
const TimelineView = lazy(() => import("@ui/TimelineView").then((m) => ({ default: m.TimelineView })));
const SettingsModal = lazy(() => import("@ui/SettingsModal").then((m) => ({ default: m.SettingsModal })));

// True when the viewport is in the single-column mobile layout. Re-renders on
// viewport changes so State Detail can switch between inline and bottom-sheet.
function useIsMobile(): boolean {
  const hasMM = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [mobile, setMobile] = useState(() => hasMM && window.matchMedia("(max-width: 768px)").matches);
  useEffect(() => {
    if (!hasMM) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [hasMM]);
  return mobile;
}

function SaveControls() {
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const saveGame = useGameStore((s) => s.saveGame);
  const signedIn = useAuthStore((s) => !!s.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const doExport = () => {
    const json = exportSave();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Save exported");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      importSave(String(reader.result)).then(() => flash("Save imported"), () => flash("Import failed: invalid file"));
    };
    reader.readAsText(file);
  };

  return (
    <div className="save-controls">
      <button className="ghost small" onClick={async () => { await saveGame(`Save ${new Date().toLocaleString()}`); flash(signedIn ? "Saved and syncing" : "Saved locally"); }}><Save size={14} aria-hidden="true" />Save</button>
      <button className="ghost small" onClick={doExport}><Download size={14} aria-hidden="true" />Export</button>
      <button className="ghost small" onClick={() => fileRef.current?.click()}><Upload size={14} aria-hidden="true" />Import</button>
      <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
      <span className="chip save-status" title={signedIn
        ? "Your saves sync to your account across devices."
        : "Saves are kept in this browser only. Sign in to sync across devices."}>
        {signedIn ? "Synced" : "Local only"}
      </span>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function GameScreen({ onHome }: { onHome: () => void }) {
  const game = useGameStore((s) => s.game)!;
  const endTurn = useGameStore((s) => s.endTurn);
  const undo = useGameStore((s) => s.undo);
  const canUndoWeek = useGameStore((s) => s.history.length > 0);
  const removeQueuedAction = useGameStore((s) => s.removeQueuedAction);
  const live = useGameStore((s) => s.liveProjection)();
  const [recapOpen, setRecapOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tourNonce, setTourNonce] = useState(0);
  const replayTutorial = () => {
    try {
      window.localStorage.removeItem(COACH_DONE_KEY);
    } catch {
      /* private mode etc. */
    }
    setSettingsOpen(false);
    setTourNonce((n) => n + 1);
  };
  const [timelineOpen, setTimelineOpen] = useState(false);
  const replay = useGameStore((s) => s.replay);

  const isMobile = useIsMobile();
  const selectedStateId = useGameStore((s) => s.selectedStateId);
  const selectState = useGameStore((s) => s.selectState);

  const debateOpen = useGameStore((s) => s.lastDebate) !== null;
  const player = game.playerCandidate;
  const res = game.resources[player];
  const cand = game.candidates[player];
  const plannedActions = game.queuedActions.length;
  const handleUndo = () => {
    if (plannedActions > 0) removeQueuedAction(plannedActions - 1);
    else undo();
  };
  const year = getScenario(game.scenarioId).year;
  const hasPendingEvent = game.pendingEvents.some((p) => p.forCandidate === player);
  const debateDeck = game.eventMode === "plausible"
    ? GENERIC_DEBATES
    : HISTORICAL_EVENTS[game.scenarioId ?? "2020"] ?? HISTORICAL_EVENTS["2020"];
  const nextDebate = debateDeck.find((event) => event.isDebate && event.trigger.kind === "scheduled" && event.trigger.turn === game.turn + 1 && !game.firedEventIds.includes(event.id));

  // Plays a poll-tick cue when a fresh event modal opens for the player.
  const prevHasPendingEvent = useRef(hasPendingEvent);
  useEffect(() => {
    if (hasPendingEvent && !prevHasPendingEvent.current) sfx.eventPopup();
    prevHasPendingEvent.current = hasPendingEvent;
  }, [hasPendingEvent]);

  // Tracks the player's live electoral-vote count so a turn's outcome can
  // play a small up/down tick.
  const prevEv = useRef(live ? live.ev[player] : null);
  useEffect(() => {
    if (!live) return;
    prevEv.current = live.ev[player];
  }, [live, player]);

  const anyModalOpen = recapOpen || guideOpen || candOpen || statsOpen || settingsOpen || debateOpen || hasPendingEvent;

  const handleEndTurn = () => {
    if (hasPendingEvent) return;
    if (game.queuedActions.length === 0) {
      const ok = window.confirm("You have no actions queued this week. Unspent slots win nothing. End the week anyway?");
      if (!ok) return;
    }
    const before = prevEv.current;
    endTurn();
    sfx.turnAdvance();
    const g = useGameStore.getState().game;
    if (g && g.phase !== "result" && g.lastRecap.length > 0) setRecapOpen(true);
    const after = useGameStore.getState().liveProjection();
    if (before !== null && after) {
      const delta = after.ev[player] - before;
      if (delta > 0) sfx.pollUp();
      else if (delta < 0) sfx.pollDown();
    }
  };

  const closeTopModal = () => {
    if (settingsOpen) return setSettingsOpen(false);
    if (statsOpen) return setStatsOpen(false);
    if (candOpen) return setCandOpen(false);
    if (guideOpen) return setGuideOpen(false);
    if (recapOpen) return setRecapOpen(false);
    if (isMobile && selectedStateId) return selectState(null);
  };

  useHotkeys({
    onEndTurn: !anyModalOpen ? handleEndTurn : undefined,
    onEscape: anyModalOpen ? closeTopModal : undefined,
    onPickAction: !anyModalOpen ? (i) => window.dispatchEvent(new CustomEvent("hotkey-pick-action", { detail: i })) : undefined,
    onHelp: () => setSettingsOpen((v) => !v),
  });

  const remaining = res.maxActions - plannedActions;
  return (
    <div className="app screen desk" key="game">
      <DeskHeader
        kicker={SCENARIOS_BY_ID[`us-${game.scenarioId}`]?.label ?? `Campaign ${year}`}
        context={<>{turnLabel(game.turn, game.totalTurns)} · playing <strong style={{ color: partyInk(cand.color) }}>{cand.shortName}–{cand.runningMate.split(" ").slice(-1)[0]}</strong></>}
        scoreboard={live ? <EvBar projection={live} year={year} /> : undefined}
        metrics={[
          { label: "Cash", value: money(res.cash) },
          { label: "Actions left", value: `${remaining}/${res.maxActions}`, warn: remaining <= 0 },
          { label: "Momentum", value: res.nationalMomentum.toFixed(0), title: "Short-term campaign energy, from -100 to +100." },
        ]}
        undoLabel={plannedActions > 0 ? "Undo action" : "Undo week"}
        onUndo={handleUndo}
        undoDisabled={!canUndoWeek && plannedActions === 0}
        endWeekLabel={hasPendingEvent ? "Resolve event first" : "End Week"}
        onEndWeek={handleEndTurn}
        endWeekDisabled={hasPendingEvent}
        ticker={<NewsTicker />}
        banner={nextDebate ? (
          <div className="deadline-banner" role="status">
            <strong>Next week: {nextDebate.title}</strong>
            <span>Debate prep and policy prep are available in this week's plan.</span>
          </div>
        ) : undefined}
        tools={<>
          <button className="ghost small" onClick={onHome}><Home size={14} aria-hidden="true" />Home</button>
          <button className="ghost small" onClick={() => setStatsOpen(true)}><BarChart3 size={14} aria-hidden="true" />Stats</button>
          {/* Read-only replay. Hidden mid-game on the daily so it can't be used to
              scout the shared board; always available once a game is over. */}
          {replay && replay.mode !== "daily" && (
            <button className="ghost small" onClick={() => setTimelineOpen(true)}><History size={14} aria-hidden="true" />Timeline</button>
          )}
          <button className="ghost small" onClick={() => setCandOpen(true)}><Users size={14} aria-hidden="true" />Candidates</button>
          <button className="ghost small" onClick={() => setGuideOpen(true)}><BookOpen size={14} aria-hidden="true" />Guide</button>
          {live && <a className="ghost small" href={movAskUrl(game, live)} target="_blank" rel="noopener noreferrer"><MessageCircleQuestion size={14} aria-hidden="true" />Ask about campaign</a>}
          <SaveControls />
          <button className="ghost small icon-btn" data-coach="settings" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings"><Settings size={15} /></button>
        </>}
      />

      <div className="main">
        <div className="col">
          <USMap />
          <IntelPanel />
        </div>
        <div className="col">
          {/* On mobile, State Detail is a tap-to-open bottom sheet (below), not a
              persistent card that pushes the map and actions around. */}
          {!isMobile && <StatePanel />}
          <ActionPanel />
        </div>
      </div>

      {isMobile && selectedStateId && (
        <div className="sheet-scrim" onClick={() => selectState(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => selectState(null)} aria-label="Close"><X size={18} /></button>
            <StatePanel />
          </div>
        </div>
      )}

      <Suspense fallback={<ModalFallback />}>
        {recapOpen && <RecapModal onClose={() => setRecapOpen(false)} />}
        {!recapOpen && !debateOpen && hasPendingEvent && <EventModal />}
        {debateOpen && <DebateScorecard />}
        {guideOpen && <GuidePage onClose={() => setGuideOpen(false)} />}
        {candOpen && <CandidateScreen scenarioId={game.scenarioId} onClose={() => setCandOpen(false)} />}
        {statsOpen && <StatsScreen onClose={() => setStatsOpen(false)} />}
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} onReplayTutorial={replayTutorial} />}
        {timelineOpen && replay && <TimelineView log={replay} onClose={() => setTimelineOpen(false)} />}
      </Suspense>

      {/* First-run guided tour; self-gating (localStorage, turn 0, US only).
          key={tourNonce} forces a remount so "Replay tutorial" restarts it from step 1. */}
      <UsOnboardingCoach key={tourNonce} forceOpen={tourNonce > 0} />
    </div>
  );
}

export function UsApp({ scenarioId, initialSeed, initialParty, setup, onExit, onStarted, onLaunch }: {
  scenarioId?: string;
  initialSeed?: string;
  initialParty?: string;
  /** A fresh setup screen: do not restore the autosave. */
  setup?: boolean;
  onExit: () => void;
  /** The setup screen started a game. */
  onStarted: () => void;
  /** The campaign editor launched a UK or country game. */
  onLaunch: (target: EditorLaunchTarget) => void;
}) {
  const game = useGameStore((s) => s.game);
  // Opened without a game in memory (a reload, the back button): bring the
  // autosave back before showing anything.
  const [restoring, setRestoring] = useState(() => !setup && !useGameStore.getState().game);
  useEffect(() => {
    // Saved editor scenarios join the scenario table so getScenario(id)
    // resolves them for the setup list and for a resumed custom race.
    const registered = registerSavedCustomScenarios();
    if (!restoring) return;
    void registered
      .then(() => (useGameStore.getState().game ? undefined : useGameStore.getState().loadGame("autosave")))
      .catch(() => {})
      .finally(() => setRestoring(false));
    // Mount only: the restore runs once per visit to the US shell.
  }, []);
  useEffect(() => {
    if (setup && game) onStarted();
  }, [setup, game, onStarted]);

  if (restoring) return <LazyFallback />;
  if (!game) {
    return (
      <div className="app screen" key="setup">
        <SetupScreen
          initialScenarioId={scenarioId}
          initialSeed={initialSeed}
          initialParty={initialParty}
          onExit={onExit}
          onLaunch={onLaunch}
        />
      </div>
    );
  }
  if (game.phase === "result") return <div className="app screen" key="result"><Suspense fallback={<LazyFallback />}><ResultsScreen /></Suspense></div>;
  return <GameScreen onHome={onExit} />;
}
