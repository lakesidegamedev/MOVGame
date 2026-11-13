// The store catalog as the UI sees it: platform prices and listing, and
// nothing else. One shared in-memory copy for this session, refreshed at most
// once a minute, so the landing page, the Store and the account view agree and
// do not each ask the server. Nothing is written to localStorage or IndexedDB:
// a price is only ever shown from an answer the platform gave in this session.

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { LOADING_CATALOG, catalogFromResponse, unreachableCatalog, type CatalogState } from "./storeModel";

const TTL_MS = 60_000;
/** After this long without an answer the store says the price is unavailable. */
export const CATALOG_SLOW_MS = 8_000;

let shared: { at: number; state: CatalogState } | null = null;
let inflight: Promise<CatalogState> | null = null;
const listeners = new Set<(state: CatalogState) => void>();

function commit(state: CatalogState): void {
  shared = { at: Date.now(), state };
  for (const l of listeners) l(state);
}

export function loadCatalog(force = false): Promise<CatalogState> {
  if (!force && shared && Date.now() - shared.at < TTL_MS && shared.state.status === "ready") return Promise.resolve(shared.state);
  if (inflight) return inflight;
  const request = api.catalog().then(catalogFromResponse, () => unreachableCatalog());
  let timer: ReturnType<typeof setTimeout> | undefined;
  const slow = new Promise<CatalogState>((resolve) => {
    timer = setTimeout(() => resolve(unreachableCatalog()), CATALOG_SLOW_MS);
  });
  // A good answer that arrives after the slow cut-off still lands.
  void request.then((state) => {
    if (state.status === "ready" && shared?.state.status !== "ready") commit(state);
  });
  inflight = Promise.race([request, slow])
    .then((state) => {
      clearTimeout(timer);
      commit(state);
      return state;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Test-only. */
export function resetCatalogCache(): void {
  shared = null;
  inflight = null;
}

export function useCatalog(): { catalog: CatalogState; reload: () => void } {
  const [catalog, setCatalog] = useState<CatalogState>(shared?.state ?? LOADING_CATALOG);
  useEffect(() => {
    listeners.add(setCatalog);
    void loadCatalog();
    return () => { listeners.delete(setCatalog); };
  }, []);
  const reload = useCallback(() => {
    setCatalog((c) => (c.status === "ready" ? c : LOADING_CATALOG));
    void loadCatalog(true);
  }, []);
  return { catalog, reload };
}
