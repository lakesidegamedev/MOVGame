import { COUNTRY_MODULES } from "@content/countries";
// Store rules, kept free of React so they can be tested on their own.
//
// Everything here reads packs only through the exported pack API (PACKS,
// STORE_PACKS, PACKS_BY_ID, packCovered) and the scenario registry, so new
// countries and packs appear without touching this file. Ownership comes from
// the server (platform purchases plus local codes); nothing in this module
// grants anything.

import { PACKS_BY_ID, STORE_PACKS, packCovered, type ScenarioPack } from "@content/packs";
import { SCENARIOS_BY_ID, SCENARIO_REGISTRY, type CountryCode, type ScenarioMeta } from "@content/scenarioRegistry";
import { countryCover } from "@content/covers";
import type { CatalogResponse, Purchase, Unlocked } from "./api";
import type { DistributionPolicy } from "./distribution";

export const COMPLETE_ID = "complete";

// ── Catalog ──────────────────────────────────────────────────────────────

export interface CatalogEntry {
  priceCents: number;
  /** The platform sells this product right now. */
  listed: boolean;
}

export interface CatalogState {
  /** loading: not answered yet. ready: the platform catalog answered. unreachable: only bundled prices are known. */
  status: "loading" | "ready" | "unreachable";
  entries: Record<string, CatalogEntry>;
}

export const LOADING_CATALOG: CatalogState = { status: "loading", entries: {} };

/** Interpret /api/catalog. Anything short of a clear platform answer counts as unreachable. */
export function catalogFromResponse(res: CatalogResponse | null | undefined): CatalogState {
  const entries: Record<string, CatalogEntry> = {};
  for (const p of Array.isArray(res?.products) ? res!.products : []) {
    if (!p || typeof p.id !== "string" || typeof p.priceCents !== "number") continue;
    entries[p.id] = { priceCents: p.priceCents, listed: p.listed === true };
  }
  // Only the platform's own answer can say a pack is not for sale. A response
  // from the bundled fallback, or from an older server that does not say, is
  // "we do not know", never "buyable".
  return { status: res?.source === "platform" ? "ready" : "unreachable", entries };
}

export function unreachableCatalog(): CatalogState {
  return { status: "unreachable", entries: {} };
}

/** Platform price when known, bundled price otherwise. */
export function priceCents(packId: string, catalog: CatalogState): number {
  return catalog.entries[packId]?.priceCents ?? PACKS_BY_ID[packId]?.price ?? 0;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Ownership ────────────────────────────────────────────────────────────

export type OwnedReason =
  | { kind: "free" }
  | { kind: "purchase"; provider: "stripe" | "apple" | "google"; at: number | null }
  | { kind: "code"; at: number | null }
  | { kind: "supporter"; at: number | null }
  /** Unlocked on the account but no receipt is attached (older local activations). */
  | { kind: "account" }
  /** Covered by other packs the player owns (Complete, the legacy Global pack, or a mix). */
  | { kind: "included"; via: Array<{ pack: ScenarioPack; reason: OwnedReason }> };

function latestPaid(packId: string, purchases: readonly Purchase[]): Purchase | undefined {
  return purchases
    .filter((p) => p.packId === packId && p.status === "paid")
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

function directReason(packId: string, purchases: readonly Purchase[]): OwnedReason {
  const p = latestPaid(packId, purchases);
  if (!p) return { kind: "account" };
  switch (p.provider) {
    case "apple": return { kind: "purchase", provider: "apple", at: p.createdAt };
    case "google": return { kind: "purchase", provider: "google", at: p.createdAt };
    case "supporter": return { kind: "supporter", at: p.createdAt };
    case "code": return { kind: "code", at: p.createdAt };
    default: return { kind: "purchase", provider: "stripe", at: p.createdAt };
  }
}

/**
 * Why the player has `packId`, or null when they do not. A pack counts as
 * owned when it was granted directly or when the packs they own cover every
 * election in it (packCovered).
 */
export function ownedReason(packId: string, ownedPackIds: readonly string[], purchases: readonly Purchase[]): OwnedReason | null {
  const target = PACKS_BY_ID[packId];
  if (!target || !packCovered(packId, ownedPackIds)) return null;
  if (ownedPackIds.includes(packId)) return directReason(packId, purchases);

  const owned = ownedPackIds.map((id) => PACKS_BY_ID[id]).filter((p): p is ScenarioPack => !!p && p.id !== packId);
  const targetSet = new Set(target.scenarios);
  // One pack that covers everything (Complete, the legacy Global pack) is the clearest answer.
  const whole = owned.find((p) => target.scenarios.every((s) => p.scenarios.includes(s)));
  const contributing = whole ? [whole] : owned.filter((p) => p.scenarios.some((s) => targetSet.has(s)));
  return {
    kind: "included",
    via: contributing.map((pack) => ({ pack, reason: directReason(pack.id, purchases) })),
  };
}

function formatDate(ts: number | null): string {
  if (ts == null || !Number.isFinite(ts)) return "";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Plain-language reason shown next to an owned pack. */
export function describeReason(reason: OwnedReason): string {
  switch (reason.kind) {
    case "free": return "Included free with the game";
    case "purchase": {
      const when = formatDate(reason.at);
      const suffix = when ? ` on ${when}` : "";
      if (reason.provider === "apple") return `Bought on the App Store${suffix}`;
      if (reason.provider === "google") return `Bought on Google Play${suffix}`;
      return `Purchased${suffix}`;
    }
    case "code": {
      const when = formatDate(reason.at);
      return `Unlocked with a code${when ? ` on ${when}` : ""}`;
    }
    case "supporter": return "Included with your Supporter membership";
    case "account": return "Unlocked on your account";
    case "included": {
      const names = reason.via.map((v) => v.pack.name);
      const joined = names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      const whole = names.length === 1 && /pack|collection/i.test(names[0]);
      const base = `Included in your ${joined}${whole ? "" : names.length === 1 ? " pack" : " packs"}`;
      const sole = reason.via.length === 1 ? reason.via[0].reason : null;
      return sole?.kind === "supporter" ? `${base} from your Supporter membership` : base;
    }
  }
}

// ── Offers ───────────────────────────────────────────────────────────────

export type Offer =
  | { kind: "owned"; reason: OwnedReason }
  /** Sold elsewhere (Steam, App Store, Google Play); this build never shows Lakeside checkout. */
  | { kind: "native-store"; storeName: string }
  /** Internal preview build: everything already plays, and nothing can be bought. */
  | { kind: "preview" }
  | { kind: "buy"; priceCents: number }
  /** The game ships this pack but the platform does not sell it yet. */
  | { kind: "coming-soon" }
  /** Buy is off until the platform answers; the bundled price is shown for reference. */
  | { kind: "unavailable"; priceCents: number; reason: "loading" | "unreachable" };

export interface OfferContext {
  ownedPackIds: readonly string[];
  purchases: readonly Purchase[];
  catalog: CatalogState;
  policy: Pick<DistributionPolicy, "externalStore" | "nativeStoreName"> & { preview?: boolean };
}

/**
 * What the store shows for a pack. Owned packs never carry a price or a Buy
 * button; a pack the platform does not list is "coming soon", never a dead
 * button; and when the platform cannot be reached Buy is off with a reason.
 */
export function offerFor(packId: string, ctx: OfferContext): Offer {
  const reason = ownedReason(packId, ctx.ownedPackIds, ctx.purchases);
  if (reason) return { kind: "owned", reason };
  if (ctx.policy.preview) return { kind: "preview" };
  if (!ctx.policy.externalStore) return { kind: "native-store", storeName: ctx.policy.nativeStoreName ?? "your platform store" };
  const { catalog } = ctx;
  if (catalog.status === "loading") return { kind: "unavailable", priceCents: priceCents(packId, catalog), reason: "loading" };
  if (catalog.status === "unreachable") return { kind: "unavailable", priceCents: priceCents(packId, catalog), reason: "unreachable" };
  const entry = catalog.entries[packId];
  if (!entry?.listed) return { kind: "coming-soon" };
  return { kind: "buy", priceCents: entry.priceCents };
}

export function unavailableMessage(reason: "loading" | "unreachable"): string {
  return reason === "loading"
    ? "Checking the store…"
    : "The Lakeside store can't be reached right now, so buying is paused. You can still browse. Try again in a moment.";
}

// ── Complete Collection ──────────────────────────────────────────────────

/** Country packs on sale, excluding the Complete Collection itself. */
export function countryPacks(): ScenarioPack[] {
  return STORE_PACKS.filter((p) => p.id !== COMPLETE_ID);
}

export function completePack(): ScenarioPack | undefined {
  return PACKS_BY_ID[COMPLETE_ID];
}

export interface CompleteSummary {
  pack: ScenarioPack;
  /** Every election of the collection's countries, free ones included. */
  elections: number;
  /** How many of those are free to everyone anyway. */
  freeElections: number;
  countries: number;
  /** Country packs the player does not have yet, and what they hold. */
  addsPacks: ScenarioPack[];
  addsElections: number;
  /** Country packs already owned or covered. */
  havePacks: ScenarioPack[];
  /** What the remaining packs cost one by one, at current prices. */
  separateCents: number;
  /** Positive when the collection is cheaper than buying the remainder separately. */
  saveCents: number;
}

export function countryOfScenario(scenarioId: string): CountryCode | undefined {
  return SCENARIOS_BY_ID[scenarioId]?.country;
}

export function summarizeComplete(ownedPackIds: readonly string[], catalog: CatalogState): CompleteSummary | null {
  const pack = completePack();
  if (!pack) return null;
  const codes = new Set(pack.scenarios.map(countryOfScenario).filter(Boolean));
  const countries = codes.size;
  const everything = SCENARIO_REGISTRY.filter((s) => codes.has(s.country));
  const all = countryPacks();
  const havePacks = all.filter((p) => packCovered(p.id, ownedPackIds));
  const addsPacks = all.filter((p) => !packCovered(p.id, ownedPackIds));
  const owned = new Set(ownedPackIds.flatMap((id) => PACKS_BY_ID[id]?.scenarios ?? []));
  const addsElections = pack.scenarios.filter((s) => !owned.has(s)).length;
  const separateCents = addsPacks.reduce((sum, p) => sum + priceCents(p.id, catalog), 0);
  return {
    pack,
    elections: everything.length,
    freeElections: everything.filter((s) => s.free).length,
    countries,
    addsPacks,
    addsElections,
    havePacks,
    separateCents,
    saveCents: separateCents - priceCents(pack.id, catalog),
  };
}

// ── Pack facts ───────────────────────────────────────────────────────────

export interface PackFacts {
  pack: ScenarioPack;
  country: CountryCode | undefined;
  flag: string;
  /**
   * Every election of the pack's country, newest first: the paid ones the pack
   * sells plus the country's free ones (shown as "Free"). Packs that are not a
   * country's (Complete, Global) list only their own scenarios.
   */
  elections: ScenarioMeta[];
  /** How many of `elections` are free to everyone. */
  freeCount: number;
  /** "4 elections, 1 free" or "3 elections". */
  countLabel: string;
  from: number | null;
  to: number | null;
  yearRange: string;
  system: string | undefined;
  cover: string | undefined;
}

/** "4 elections, 1 free" when some are free, "3 elections" otherwise. */
export function electionCountLabel(total: number, free: number): string {
  const base = `${total} ${total === 1 ? "election" : "elections"}`;
  return free > 0 ? `${base}, ${free} free` : base;
}

export function packFacts(pack: ScenarioPack): PackFacts {
  const home = COUNTRY_MODULES.find((m) => m.pack.id === pack.id);
  // A country pack opens its country's free elections too; the Complete
  // Collection opens every election of every country it covers, so its count
  // is the whole game and matches the Store's hero (summarizeComplete).
  const countries = home
    ? new Set<string>([home.code])
    : pack.id === COMPLETE_ID ? new Set(pack.scenarios.map(countryOfScenario).filter(Boolean)) : new Set<string>();
  const free = SCENARIO_REGISTRY.filter((s) => countries.has(s.country) && s.free);
  const elections = [...pack.scenarios.map((id) => SCENARIOS_BY_ID[id]), ...free]
    .filter((m): m is ScenarioMeta => !!m)
    .filter((m, i, all) => all.findIndex((x) => x.scenarioId === m.scenarioId) === i)
    .sort((a, b) => b.year - a.year || b.scenarioId.localeCompare(a.scenarioId));
  const freeCount = elections.filter((m) => m.free).length;
  const country = home?.code ?? elections[0]?.country;
  const years = elections.map((e) => e.year);
  const from = years.length ? Math.min(...years) : null;
  const to = years.length ? Math.max(...years) : null;
  return {
    pack,
    country,
    flag: home?.flag ?? elections[0]?.flag ?? "",
    elections,
    freeCount,
    countLabel: electionCountLabel(elections.length, freeCount),
    from,
    to,
    yearRange: from == null || to == null ? "" : from === to ? String(from) : `${from} to ${to}`,
    system: country ? COUNTRY_MODULES.find((m) => m.code === country)?.systemLabel : undefined,
    cover: country ? (countryCover(country) as string | undefined) : undefined,
  };
}

/** The elections everyone has for free, newest first. */
export function freeElections(): ScenarioMeta[] {
  return SCENARIO_REGISTRY.filter((s) => s.free).sort((a, b) => b.year - a.year);
}

export interface FreeCountryGroup {
  country: CountryCode;
  name: string;
  flag: string;
  /** Newest first. */
  elections: ScenarioMeta[];
}

/** The free elections grouped by country, in the countries' registration order. */
export function freeElectionsByCountry(): FreeCountryGroup[] {
  return COUNTRY_MODULES.map((m) => ({
    country: m.code,
    name: m.name,
    flag: m.flag,
    elections: SCENARIO_REGISTRY.filter((s) => s.country === m.code && s.free).sort((a, b) => b.year - a.year),
  })).filter((g) => g.elections.length > 0);
}

/** Unique country covers for the Complete Collection collage. */
export function completeCovers(): Array<{ country: CountryCode; flag: string; cover: string | undefined }> {
  const pack = completePack();
  const seen = new Set<CountryCode>();
  const out: Array<{ country: CountryCode; flag: string; cover: string | undefined }> = [];
  for (const id of pack?.scenarios ?? []) {
    const m = SCENARIOS_BY_ID[id];
    if (!m || seen.has(m.country)) continue;
    seen.add(m.country);
    out.push({ country: m.country, flag: m.flag, cover: countryCover(m.country) as string | undefined });
  }
  return out;
}

// ── Account view ─────────────────────────────────────────────────────────

export interface OwnershipRow {
  key: string;
  name: string;
  detail: string;
  reason: OwnedReason;
}

/** What the player owns, one row per pack, with why. The free base game leads. */
export function ownershipRows(unlocked: Unlocked, purchases: readonly Purchase[]): OwnershipRow[] {
  const free = freeElections();
  const countries = new Set(free.map((s) => s.country)).size;
  const rows: OwnershipRow[] = [{
    key: "free",
    name: "Base game",
    detail: `${free.length} free elections across ${countries} countries, and the Daily Challenge`,
    reason: { kind: "free" },
  }];
  const ids = [...unlocked.packIds].filter((id) => PACKS_BY_ID[id]);
  for (const id of ids) {
    const pack = PACKS_BY_ID[id];
    rows.push({
      key: id,
      name: pack.name,
      detail: packFacts(pack).countLabel,
      reason: ownedReason(id, ids, purchases) ?? { kind: "account" },
    });
  }
  return rows;
}

// ── Purchase flow helpers ────────────────────────────────────────────────

/**
 * Elections to offer after a purchase. The election the player was trying to
 * open leads; otherwise the newest elections of the pack they bought (for the
 * Complete Collection, of the packs it added).
 */
export function electionsToOffer(packId: string, focusScenarioId: string | undefined, ownedBefore: readonly string[], limit = 3): ScenarioMeta[] {
  const pack = PACKS_BY_ID[packId];
  if (!pack) return [];
  const before = new Set(ownedBefore.flatMap((id) => PACKS_BY_ID[id]?.scenarios ?? []));
  const fresh = pack.scenarios.filter((s) => !before.has(s));
  const pool = (fresh.length ? fresh : pack.scenarios)
    .map((id) => SCENARIOS_BY_ID[id])
    .filter((m): m is ScenarioMeta => !!m);
  const out: ScenarioMeta[] = [];
  const focus = focusScenarioId ? SCENARIOS_BY_ID[focusScenarioId] : undefined;
  if (focus && pack.scenarios.includes(focus.scenarioId)) out.push(focus);
  // Spread across countries for the Complete Collection: newest election per country first.
  const byCountry = new Map<CountryCode, ScenarioMeta[]>();
  for (const m of [...pool].sort((a, b) => b.year - a.year)) {
    byCountry.set(m.country, [...(byCountry.get(m.country) ?? []), m]);
  }
  for (const list of byCountry.values()) {
    for (const m of list.slice(0, 1)) if (!out.includes(m)) out.push(m);
  }
  for (const m of [...pool].sort((a, b) => b.year - a.year)) if (!out.includes(m)) out.push(m);
  return out.slice(0, limit);
}
