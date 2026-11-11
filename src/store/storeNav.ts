import { create } from "zustand";

// Where the in-game Store is and what it is focused on. Kept free of imports so
// any screen (and the auth store, on a redirect landing) can open it without a
// dependency cycle. The Store itself is mounted once at the app root.

export interface StoreFocus {
  /** Open straight to this pack. */
  packId?: string;
  /** The locked election the player was trying to open; highlighted inside its pack. */
  scenarioId?: string;
}

/** A job the Store should pick up the moment it opens, set by a redirect landing. */
export type StoreResume =
  | { kind: "buy"; packId: string }                        // signed in again after a Buy click: carry on to checkout
  | { kind: "return"; result: "success" | "cancelled"; packId: string | null };  // back from checkout

interface StoreNav {
  open: boolean;
  focus: StoreFocus;
  resume: StoreResume | null;
  openStore: (focus?: StoreFocus) => void;
  closeStore: () => void;
  /** Read and clear the pending resume job. */
  takeResume: () => StoreResume | null;
}

export const useStoreNav = create<StoreNav>((set, get) => ({
  open: false,
  focus: {},
  resume: null,
  openStore: (focus = {}) => set({ open: true, focus }),
  closeStore: () => set({ open: false }),
  takeResume: () => {
    const job = get().resume;
    if (job) set({ resume: null });
    return job;
  },
}));

/** Open the Store on the pack that unlocks `scenarioId`. */
export function openStoreForScenario(scenarioId: string): void {
  useStoreNav.getState().openStore({ scenarioId });
}
