// Catalog price consumer. The Lakeside platform owns the one product catalog
// (price + Stripe id + scenario membership) and exposes it at
// /account/api/catalog. This game reads every price from there and has no
// price list of its own: when the platform cannot be reached, the answer is
// "unavailable" with no prices at all, never a guessed or remembered number.

import { PACKS } from "../src/content/packs.js";

const LAKESIDE_BASE = (process.env.LAKESIDE_BASE || "https://lakesidegames.net").replace(/\/+$/, "");
const CATALOG_URL = process.env.LAKESIDE_CATALOG_URL || `${LAKESIDE_BASE}/account/api/catalog?game=electioneer`;
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 5_000;

export interface CatalogItem {
  id: string;
  name: string;
  /** The platform's store description, or null when it gave none. The game falls back to its own. */
  description: string | null;
  /**
   * The platform's price for this product, in USD cents. Null whenever the
   * platform did not give one in this answer (unreachable, product absent, or
   * an unusable value). Never a bundled or remembered price.
   */
  priceCents: number | null;
  scenarios: string[];
  /**
   * True only when the platform itself lists this product for sale with a
   * usable price. A pack the game ships before the platform sells it (new
   * countries reach the game first) comes back with listed:false and must
   * render as "coming soon", never as a Buy button the checkout cannot honour.
   */
  listed: boolean;
}

export interface CatalogResult {
  /** "platform" when the live catalog answered, "unavailable" when it could not be reached or read. */
  source: "platform" | "unavailable";
  items: CatalogItem[];
}

// The game's own membership, with no price: what every answer is built on.
function membership(): CatalogItem[] {
  return PACKS.map((p) => ({ id: p.id, name: p.name, description: null, priceCents: null, scenarios: p.scenarios, listed: false }));
}

interface PlatformProduct {
  id: string;
  name?: string;
  description?: string;
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

function usablePrice(p: PlatformProduct | undefined): number | null {
  if (!p || typeof p.priceCents !== "number" || !Number.isSafeInteger(p.priceCents) || p.priceCents <= 0) return null;
  return p.priceCents;
}

let cache: { at: number; result: CatalogResult } | null = null;

/**
 * The Margin of Victory catalog with platform prices. Fetches the platform
 * catalog (5 min cache of a good answer only) and puts its prices on the
 * game's pack membership. On any failure the result is "unavailable" and no
 * item carries a price; the next call asks the platform again.
 */
export async function getCatalogResult(): Promise<CatalogResult> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.result;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CATALOG_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
    const body = (await res.json()) as { products?: unknown };
    if (!Array.isArray(body?.products)) throw new Error("catalog without a product list");
    const products = (body.products as PlatformProduct[]).filter((p) => p && typeof p.id === "string");
    const platform = new Map(products.map((p) => [p.id, p]));
    // Membership stays the game's; price, name and description come from the platform.
    const items = membership().map((m): CatalogItem => {
      const p = platform.get(m.id);
      const priceCents = usablePrice(p);
      if (!p || priceCents === null) return m;
      return {
        ...m,
        name: typeof p.name === "string" && p.name ? p.name : m.name,
        description: typeof p.description === "string" && p.description.trim() ? p.description.trim() : null,
        priceCents,
        listed: webPurchasable(p),
      };
    });
    const result: CatalogResult = { source: "platform", items };
    cache = { at: now, result };
    return result;
  } catch {
    // Never cache a failure, and never fill in a price: the store says the
    // price is unavailable and the next request asks the platform again.
    return { source: "unavailable", items: membership() };
  } finally {
    clearTimeout(timer);
  }
}

/** The catalog items alone. */
export async function getCatalog(): Promise<CatalogItem[]> {
  return (await getCatalogResult()).items;
}

/** Test-only: drop the cached platform catalog. */
export function clearCatalogCache(): void {
  cache = null;
}
