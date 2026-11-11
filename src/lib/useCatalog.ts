// The store catalog as the UI sees it: platform prices and listing, with the
// bundled prices as the fallback. One shared copy, refreshed at most once a
// minute, so the landing page, the Store and the account view agree and do not
// each ask the server.

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { LOADING_CATALOG, catalogFromResponse, unreachableCatalog, type CatalogState } from "./storeModel";

const TTL_MS = 60_000;

let shared: { at: number; state: CatalogState } | null = null;
let inflight: Promise<CatalogState> | null = null;
const listeners = new Set<(state: CatalogState) => void>();

function publish(state: CatalogState): void {
  for (const l of listeners) l(state);
}

export function loadCatalog(force = false): Promise<CatalogState> {
  if (!force && shared && Date.now() - shared.at < TTL_MS && shared.state.status === "ready") return Promise.resolve(shared.state);
  if (inflight) return inflight;
  inflight = api.catalog()
    .then(catalogFromResponse, () => unreachableCatalog())
    .then((state) => {
      shared = { at: Date.now(), state };
      publish(state);
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
