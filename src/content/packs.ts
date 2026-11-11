// Purchasable scenario bundles, one per country plus the Complete Collection.
// Price in USD cents. The server seeds
// activation codes per pack; redeeming a pack code unlocks every scenario in
// it. This file is shared by the client (labels) and the server (entitlement).

import { COUNTRY_MODULES } from "./countries/index";
import { SCENARIO_REGISTRY } from "./scenarioRegistry";

export interface ScenarioPack {
  id: string;
  name: string;
  description: string;
  price: number; // USD cents. Offline fallback only; the canonical price is the
                 // platform catalog (GET /api/catalog -> /account/api/catalog).
  scenarios: string[];
  // Retired from sale but still honoured for players who already own it.
  // Hidden from every storefront; entitlement checks still expand it.
  legacy?: boolean;
}

// Every pack derives from the registered country modules (content/countries):
// one pack per country holding its paid scenarios, then the Complete
// Collection, then the retired Global pack.

const countryPacks: ScenarioPack[] = COUNTRY_MODULES.map((m) => ({
  id: m.pack.id,
  name: m.pack.name,
  description: m.pack.description,
  price: m.pack.price,
  scenarios: SCENARIO_REGISTRY.filter((s) => s.country === m.code && !s.free).map((s) => s.scenarioId),
}));

/** Every paid scenario of every registered country. */
export const ALL_PAID: string[] = SCENARIO_REGISTRY.filter((s) => !s.free).map((s) => s.scenarioId);

/**
 * The retired Global Elections Pack, frozen. Owners keep exactly these
 * fourteen scenarios. Elections added later to Canada, Germany, France or
 * Australia are NOT part of it (they need the country pack or Complete).
 */
export const GLOBAL_ALL: readonly string[] = [
  "ca-2025", "ca-2021", "ca-2019", "ca-2015",
  "de-2025", "de-2021", "de-2017",
  "fr-2027", "fr-2022", "fr-2017", "fr-2012",
  "au-2025", "au-2022", "au-2019",
];

export const PACKS: ScenarioPack[] = [
  ...countryPacks,
  {
    id: "complete",
    name: "Complete Collection",
    description: "Every country and every scenario in the game, plus any scenarios added later.",
    price: 399,
    scenarios: ALL_PAID,
  },
  {
    id: "global",
    name: "Global Elections Pack",
    description: "Canada, Germany, France, and Australia. No longer sold; existing owners keep every scenario in it.",
    price: 599,
    scenarios: [...GLOBAL_ALL],
    legacy: true,
  },
];

/** Packs offered for sale, in display order. Legacy packs stay entitlement-only. */
export const STORE_PACKS: ScenarioPack[] = PACKS.filter((p) => !p.legacy);

export const PACKS_BY_ID: Record<string, ScenarioPack> = Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** The cheapest pack on sale that unlocks a scenario (for paywall prompts). */
export function packForScenario(scenarioId: string): ScenarioPack | undefined {
  return STORE_PACKS
    .filter((p) => p.scenarios.includes(scenarioId))
    .sort((a, b) => a.price - b.price)[0];
}

/** Whether owning `ownedPackIds` already covers every scenario in `packId`. */
export function packCovered(packId: string, ownedPackIds: readonly string[]): boolean {
  const target = PACKS_BY_ID[packId];
  if (!target) return false;
  if (ownedPackIds.includes(packId)) return true;
  const owned = new Set(ownedPackIds.flatMap((id) => PACKS_BY_ID[id]?.scenarios ?? []));
  return target.scenarios.every((s) => owned.has(s));
}
