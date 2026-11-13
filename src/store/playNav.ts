import { create } from "zustand";

// A request from inside a game (a results screen) to start another election,
// possibly in another country. The app root starts it the way the Store's Play
// buttons do. Kept free of imports so any screen can use it.

interface PlayNav {
  scenarioId: string | null;
  play: (scenarioId: string) => void;
  /** Read and clear the pending request. */
  take: () => string | null;
}

export const usePlayNav = create<PlayNav>((set, get) => ({
  scenarioId: null,
  play: (scenarioId) => set({ scenarioId }),
  take: () => {
    const id = get().scenarioId;
    if (id) set({ scenarioId: null });
    return id;
  },
}));
