// Pack prices, sourced from the Lakeside platform catalog (the single source of
// truth) with the game's bundled prices as an instant, offline-safe fallback.
// Returns a { packId: priceCents } map that renders immediately from the
// fallback and updates in place once the platform catalog loads.

import { PACKS } from "@content/packs";
import { useCatalog } from "./useCatalog";
import { priceCents } from "./storeModel";

export function usePackPrices(): Record<string, number> {
  const { catalog } = useCatalog();
  return Object.fromEntries(PACKS.map((p) => [p.id, priceCents(p.id, catalog)]));
}
