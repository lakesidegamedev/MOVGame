import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import { useStoreNav } from "@store/storeNav";
import { useStoreFlow } from "@store/storeFlow";

const StoreScreen = lazy(() => import("./StoreScreen"));

/**
 * Mounted once at the app root. Shows the Store over the current screen when
 * something opens it, and ties it to browser history so the Back button (and
 * the phone's back gesture) closes it instead of leaving the game.
 */
export function StoreLayer({ onPlay }: { onPlay: (scenarioId: string) => void }) {
  const open = useStoreNav((s) => s.open);
  const closeStore = useStoreNav((s) => s.closeStore);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    // Stale outcomes from an earlier visit do not greet the player again; a purchase still in flight does.
    const flow = useStoreFlow.getState();
    if (!useStoreNav.getState().resume && ["cancelled", "error", "needs-login"].includes(flow.phase.kind)) flow.dismiss();
    window.history.pushState({ ...(window.history.state ?? {}), movStore: true }, "");
    const onPop = () => {
      if ((window.history.state as { movStore?: boolean } | null)?.movStore) return;
      closeStore();
      const next = pending.current;
      pending.current = null;
      next?.();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, closeStore]);

  // Leave the Store, then (optionally) carry on once the history entry is gone.
  const leave = useCallback((after?: () => void) => {
    if ((window.history.state as { movStore?: boolean } | null)?.movStore) {
      pending.current = after ?? null;
      window.history.back();
    } else {
      closeStore();
      after?.();
    }
  }, [closeStore]);

  const play = useCallback((scenarioId: string) => {
    leave(() => {
      useStoreFlow.getState().dismiss();
      onPlay(scenarioId);
    });
  }, [leave, onPlay]);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <StoreScreen onClose={() => leave()} onPlay={play} />
    </Suspense>
  );
}
