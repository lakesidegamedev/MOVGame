import { useGameStore } from "@store/gameStore";
import { electoralRule } from "@engine/electoralCollege";
import { OnboardingCoach } from "./OnboardingCoach";

// The onboarding coach on the US desk: driven by the US store, with the
// default copy. Self-gating like the others (localStorage, turn 0).
export function UsOnboardingCoach({ forceOpen }: { forceOpen?: boolean }) {
  const turn = useGameStore((s) => s.game?.turn ?? 0);
  const totalTurns = useGameStore((s) => s.game?.totalTurns ?? 0);
  const majority = useGameStore((s) => electoralRule(s.game?.states ?? []).majority);
  const selectedId = useGameStore((s) => s.selectedStateId);
  const queuedLen = useGameStore((s) => s.game?.queuedActions.length ?? 0);
  return (
    <OnboardingCoach forceOpen={forceOpen} turn={turn} totalTurns={totalTurns} majority={majority}
      selectedId={selectedId} queuedLen={queuedLen} />
  );
}
