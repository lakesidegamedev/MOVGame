import { createContext, useContext } from "react";
import type { ApiUser, Purchase } from "@lib/api";
import type { CatalogState } from "@lib/storeModel";

export interface StoreCtx {
  catalog: CatalogState;
  ownedPackIds: readonly string[];
  purchases: readonly Purchase[];
  user: ApiUser | null;
  /** A purchase is already in progress; every Buy button waits. */
  busy: boolean;
  /** Election the player came from, highlighted in its pack. */
  focusScenarioId?: string;
  canPlay: (scenarioId: string) => boolean;
  buy: (packId: string) => void;
  openPack: (packId: string) => void;
  play: (scenarioId: string) => void;
}

export const StoreContext = createContext<StoreCtx | null>(null);

export function useStoreCtx(): StoreCtx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreContext missing");
  return ctx;
}
