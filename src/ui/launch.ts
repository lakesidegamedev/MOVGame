// Starting points that need a game store: the daily challenge and resuming a
// saved campaign. The landing shell imports this module on demand, and it
// imports only the store (and country bundle) the target needs, so a click on
// the landing page never downloads the other engine paths.

import { dailyAssignment, utcDateString } from "@lib/daily";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { loadCountry } from "@content/countries";
import { hashSeed } from "@engine/rng";
import { registerSavedCustomScenarios } from "@persistence/local";
import type { ResumeTarget } from "@persistence/resume";
import type { View } from "./view";

/**
 * Where the daily challenge goes today: back into today's daily game if one is
 * in memory or in the autosave, otherwise to a fresh setup with the day's seed
 * and side prefilled (client and server share the deterministic assignment).
 */
export async function dailyView(): Promise<View | null> {
  const assignment = dailyAssignment(utcDateString());
  const meta = SCENARIOS_BY_ID[assignment.scenarioId];
  if (!meta) return null;
  const dailySeed = hashSeed(assignment.seed);
  const prefill = { initialSeed: assignment.seed, initialParty: assignment.role };

  if (meta.engine === "us") {
    const { useGameStore } = await import("@store/gameStore");
    const isDaily = () => {
      const g = useGameStore.getState().game;
      return g?.seed === dailySeed && g.scenarioId === meta.nativeId && g.playerCandidate === assignment.role;
    };
    if (isDaily()) return { kind: "us" };
    if (!useGameStore.getState().game) {
      try {
        await registerSavedCustomScenarios();
        await useGameStore.getState().loadGame("autosave");
        if (isDaily()) return { kind: "us" };
      } catch {
        // No readable autosave: start the daily fresh.
      }
    }
    useGameStore.getState().unload();
    return { kind: "us", scenarioId: meta.nativeId, ...prefill, setup: true };
  }

  if (meta.engine === "uk") {
    const { useUkStore } = await import("@store/ukStore");
    const isDaily = () => {
      const g = useUkStore.getState().game;
      return g?.seed === dailySeed && g.electionId === meta.nativeId && g.playerParty === assignment.role;
    };
    if (isDaily()) return { kind: "uk" };
    if (!useUkStore.getState().game && useUkStore.getState().tryResumeAutosave() && isDaily()) return { kind: "uk" };
    useUkStore.getState().unload();
    return { kind: "uk", electionId: meta.nativeId, ...prefill, setup: true };
  }

  const [{ useCountryStore }] = await Promise.all([import("@store/countryStore"), loadCountry(meta.country)]);
  const isDaily = () => {
    const g = useCountryStore.getState().game;
    return g?.seed === dailySeed && g.countryId === meta.country && g.electionId === meta.nativeId && g.playerParty === assignment.role;
  };
  if (isDaily()) return { kind: "country", countryId: meta.country };
  if (!useCountryStore.getState().game && useCountryStore.getState().tryResumeAutosave(meta.country) && isDaily()) {
    return { kind: "country", countryId: meta.country };
  }
  useCountryStore.getState().unload();
  return { kind: "country", countryId: meta.country, electionId: meta.nativeId, ...prefill, setup: true };
}

/** Load a saved campaign; resolves the view to open, or null if nothing loaded. */
export async function resumeView(target: ResumeTarget): Promise<View | null> {
  if (target.kind === "us") {
    const { useGameStore } = await import("@store/gameStore");
    if (target.saveId !== "autosave" || !useGameStore.getState().game) {
      await registerSavedCustomScenarios();
      await useGameStore.getState().loadGame(target.saveId);
    }
    return useGameStore.getState().game ? { kind: "us" } : null;
  }
  if (target.kind === "uk") {
    const { useUkStore } = await import("@store/ukStore");
    return useUkStore.getState().tryResumeAutosave() ? { kind: "uk" } : null;
  }
  const [{ useCountryStore }] = await Promise.all([import("@store/countryStore"), loadCountry(target.countryId)]);
  return useCountryStore.getState().tryResumeAutosave(target.countryId) ? { kind: "country", countryId: target.countryId } : null;
}
