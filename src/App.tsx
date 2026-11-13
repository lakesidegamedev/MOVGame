import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LandingPage, type LandingDestination } from "@ui/LandingPage";
import { LegalPage } from "@ui/LegalPage";
import { StoreLayer } from "@ui/store/StoreLayer";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import type { ResumeTarget } from "@persistence/resume";
import { armAudio } from "@lib/sfx";
import { unloadSession } from "@store/sessions";
import { useSavesStore } from "@store/savesStore";
import { LazyFallback } from "@ui/Fallbacks";
import type { EditorLaunchTarget } from "@ui/SetupScreen";
import type { View } from "@ui/view";
import { usePlayNav } from "@store/playNav";

// The landing page renders from metadata alone (the scenario registry and the
// country modules). Every game shell carries its engine, content and map
// geometry, so each one loads on demand, and so does each country's bundle.
const UsApp = lazy(() => import("@ui/UsApp").then((m) => ({ default: m.UsApp })));
const UkApp = lazy(() => import("@ui/uk/UkApp").then((m) => ({ default: m.UkApp })));
const CountryApp = lazy(() => import("@ui/country/CountryApp").then((m) => ({ default: m.CountryApp })));
const LeaderboardScreen = lazy(() => import("@ui/LeaderboardScreen").then((m) => ({ default: m.LeaderboardScreen })));
const AuthModals = lazy(() => import("@ui/auth/AuthModals").then((m) => ({ default: m.AuthModals })));

function historyView(): View {
  const view = (window.history.state as { movView?: View } | null)?.movView;
  if (view && ["landing", "us", "uk", "country", "leaderboard", "legal"].includes(view.kind)) return view;
  const legal = new URLSearchParams(window.location.search).get("legal");
  if (legal === "privacy" || legal === "terms" || legal === "credits") return { kind: "legal", tab: legal };
  return { kind: "landing" };
}

export function App() {
  const [view, setView] = useState<View>(historyView);
  const viewRef = useRef(view);
  viewRef.current = view;
  // A daily or resume target is resolving (its store and content download).
  const [busy, setBusy] = useState(false);

  const refreshSaves = () => { void useSavesStore.getState().refresh().catch(() => {}); };
  useEffect(refreshSaves, []);
  useEffect(() => {
    // Each game shell restores its own autosave when it mounts.
    const onPop = () => setView(historyView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: View) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("legal");
    window.history.pushState({ ...window.history.state, movView: next }, "", url);
    setView(next);
  };

  // A setup screen started its game: from now on, reload and back return to
  // the game instead of a fresh setup.
  const markStarted = useCallback(() => {
    const current = viewRef.current;
    if (!("setup" in current && current.setup)) return;
    const active = { ...current, setup: false } as View;
    window.history.replaceState({ ...window.history.state, movView: active }, "");
    setView(active);
  }, []);

  // Browsers block audio until a real user gesture; arm the synth on the
  // first pointer press or key press anywhere in the app, then stop listening.
  useEffect(() => {
    const arm = () => { armAudio(); window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => { window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
  }, []);

  // The daily challenge and saved campaigns need a game store, so the logic
  // lives in a module that loads on the click.
  const launch = (resolve: (m: typeof import("@ui/launch")) => Promise<View | null>) => {
    setBusy(true);
    void import("@ui/launch")
      .then(resolve)
      .then((next) => { if (next) navigate(next); })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const go = (dest: LandingDestination) => {
    if (dest.kind === "daily") {
      launch((m) => m.dailyView());
      return;
    }
    if (dest.kind === "us" || dest.kind === "uk" || dest.kind === "country") {
      unloadSession(dest.kind);
      navigate({ ...dest, setup: true });
      return;
    }
    navigate(dest);
  };
  const dailyLinkHandled = useRef(false);
  useEffect(() => {
    if (dailyLinkHandled.current) return;
    if (new URLSearchParams(window.location.search).get("daily") !== "1") return;
    dailyLinkHandled.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("daily");
    window.history.replaceState(window.history.state, "", url);
    go({ kind: "daily" });
  }, []);
  const home = () => { navigate({ kind: "landing" }); refreshSaves(); };
  const resume = (target: ResumeTarget) => launch((m) => m.resumeView(target));

  // Start an election from outside the library (the Store's Play buttons).
  const playScenario = (scenarioId: string) => {
    const meta = SCENARIOS_BY_ID[scenarioId];
    if (!meta) return;
    if (meta.engine === "us") go({ kind: "us", scenarioId: meta.nativeId });
    else if (meta.engine === "uk") go({ kind: "uk", electionId: meta.nativeId });
    else go({ kind: "country", countryId: meta.country, electionId: meta.nativeId });
  };

  // A results screen asked to start another election (a free one in another country).
  const playRequest = usePlayNav((s) => s.scenarioId);
  useEffect(() => {
    const id = playRequest ? usePlayNav.getState().take() : null;
    if (id) playScenario(id);
  }, [playRequest]);

  // The campaign editor (on the US setup screen) can start a UK or country game.
  const launchFromEditor = (target: EditorLaunchTarget) =>
    target.kind === "uk"
      ? navigate({ kind: "uk", setup: true })
      : navigate({ kind: "country", countryId: target.countryId, setup: true });

  // Everything renders above the shared auth/paywall modals; the Store sits
  // between them so log in and account dialogs open on top of it.
  const withModals = (node: React.ReactNode) => (
    <>
      {node}
      <StoreLayer onPlay={playScenario} />
      <Suspense fallback={null}>
        <AuthModals />
      </Suspense>
    </>
  );

  if (busy) return withModals(<LazyFallback />);

  if (view.kind === "us") {
    return withModals(
      <Suspense fallback={<LazyFallback />}>
        <UsApp key="us" scenarioId={view.scenarioId} initialSeed={view.initialSeed} initialParty={view.initialParty} setup={view.setup}
          onExit={home} onStarted={markStarted} onLaunch={launchFromEditor} />
      </Suspense>,
    );
  }

  if (view.kind === "uk") {
    return withModals(
      <Suspense fallback={<LazyFallback />}>
        <UkApp key="uk" onExit={home} initialElection={view.electionId} initialSeed={view.initialSeed} initialParty={view.initialParty}
          setup={view.setup} onStarted={markStarted} />
      </Suspense>,
    );
  }

  if (view.kind === "country") {
    return withModals(
      <Suspense fallback={<LazyFallback />}>
        <CountryApp key={`country-${view.countryId}`} countryId={view.countryId} onExit={home} initialElection={view.electionId}
          initialSeed={view.initialSeed} initialParty={view.initialParty} setup={view.setup} onStarted={markStarted} />
      </Suspense>,
    );
  }

  if (view.kind === "leaderboard") {
    return withModals(<Suspense fallback={<LazyFallback />}><LeaderboardScreen onBack={home} /></Suspense>);
  }

  if (view.kind === "legal") {
    return withModals(<LegalPage initialTab={view.tab} onBack={home} />);
  }

  return withModals(<LandingPage onGo={go} onResume={resume} />);
}
