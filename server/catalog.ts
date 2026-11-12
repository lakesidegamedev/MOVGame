// Catalog price consumer. The Lakeside platform owns the one product catalog
// (price + Stripe id + scenario membership) and exposes it at
// /account/api/catalog. This game reads the price from there so there is no
// second hand-maintained price list; the bundled PACKS prices are kept only as
// an instant, offline-safe fallback if the platform is briefly unreachable.

import { PACKS } from "../src/content/packs.js";

const LAKESIDE_BASE = (process.env.LAKESIDE_BASE || "https://lakesidegames.net").replace(/\/+$/, "");
const CATALOG_URL = process.env.LAKESIDE_CATALOG_URL || `${LAKESIDE_BASE}/account/api/catalog?game=electioneer`;
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 5_000;

export interface CatalogItem {
  id: string;
  name: string;
  priceCents: number;
  scenarios: string[];
  /**
   * True only when the platform itself lists this product for sale. A pack the
   * game ships before the platform sells it (new countries reach the game
   * first) comes back with listed:false and must render as "coming soon", never
   * as a Buy button the checkout cannot honour. Always false for the bundled
   * fallback, where the platform's answer is unknown.
   */
  listed: boolean;
}

export interface CatalogResult {
  /** "platform" when the live catalog answered, "bundled" when it could not be reached. */
  source: "platform" | "bundled";
  items: CatalogItem[];
}

// Bundled fallback: the game's own membership + last-known price.
function bundled(): CatalogItem[] {
  return PACKS.map((p) => ({ id: p.id, name: p.name, priceCents: p.price, scenarios: p.scenarios, listed: false }));
}

interface PlatformProduct {
  id: string;
  name?: string;
  priceCents?: number;
  scenarios?: string[];
  /** Per-storefront sale state. Newer platform deploys send it; older ones omit it. */
  channels?: { web?: { purchasable?: unknown } };
}

/**
 * Whether the web checkout can sell a product the platform lists. Older
 * platform deploys send no `channels` block: listing alone means buyable, as
 * before. When the block is present, only an explicit `purchasable: true` on
 * the web channel counts; anything else renders as "coming soon".
 */
function webPurchasable(p: PlatformProduct): boolean {
  if (p.channels === undefined || p.channels === null) return true;
  return p.channels.web?.purchasable === true;
}

let cache: { at: number; result: CatalogResult } | null = null;

/**
 * The Margin of Victory catalog with platform prices. Fetches the platform catalog
 * (5 min cache) and overlays its prices onto the bundled membership; on any
 * failure returns the bundled fallback so prices always render.
 */
export async function getCatalogResult(): Promise<CatalogResult> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.result;

  const fallback = bundled();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CATALOG_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
    const body = (await res.json()) as { products?: PlatformProduct[] };
    const platform = new Map((body.products ?? []).map((p) => [p.id, p]));
    // Membership stays the game's; price (and name if present) come from the platform.
    const items = fallback.map((f): CatalogItem => {
      const p = platform.get(f.id);
      if (!p || typeof p.priceCents !== "number" || !Number.isSafeInteger(p.priceCents) || p.priceCents < 0) return f;
      return { id: f.id, name: p.name ?? f.name, priceCents: p.priceCents, scenarios: f.scenarios, listed: webPurchasable(p) };
    });
    const result: CatalogResult = { source: "platform", items };
    cache = { at: now, result };
    return result;
  } catch {
    // Do not cache failures; keep serving bundled prices and retry next call.
    return { source: "bundled", items: fallback };
  } finally {
    clearTimeout(timer);
  }
}

/** The catalog items alone (platform prices overlaid on the bundled membership). */
export async function getCatalog(): Promise<CatalogItem[]> {
  return (await getCatalogResult()).items;
}

/** Test-only: drop the cached platform catalog. */
export function clearCatalogCache(): void {
  cache = null;
}
