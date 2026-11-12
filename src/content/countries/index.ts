// ─────────────────────────────────────────────────────────────────────────
// THE COUNTRY LIST: the single source of truth for which countries exist.
//
// Every shared table derives from COUNTRY_MODULES: the scenario registry,
// the store packs, landing covers, the daily challenge, "play next" chains
// and the native content export. To add a country, write its module file
// (see docs/adding-a-country.md), import it here and append it to the list.
//
// ORDER IS LOAD-BEARING. The daily challenge hashes the date over the
// registry in this order, so existing entries must never be reordered or
// removed. New countries go at the end.
// ─────────────────────────────────────────────────────────────────────────

import type { CountryBundle } from "@engine/countryGame";
import type { CountryModule } from "./types";
import { US_MODULE } from "./us";
import { UK_MODULE } from "./uk";
import { CANADA_MODULE } from "./canada";
import { GERMANY_MODULE } from "./germany";
import { FRANCE_MODULE } from "./france";
import { AUSTRALIA_MODULE } from "./australia";
import { NEW_ZEALAND_MODULE } from "./newZealand";
import { BRAZIL_MODULE } from "./brazil";
import { INDIA_MODULE } from "./india";
import { SPAIN_MODULE } from "./spain";
import { IRELAND_MODULE } from "./ireland";
import { JAPAN_MODULE } from "./japan";
import { ITALY_MODULE } from "./italy";
import { MEXICO_MODULE } from "./mexico";

export const COUNTRY_MODULES: readonly CountryModule[] = [
  US_MODULE,
  UK_MODULE,
  CANADA_MODULE,
  GERMANY_MODULE,
  FRANCE_MODULE,
  AUSTRALIA_MODULE,
  NEW_ZEALAND_MODULE,
  BRAZIL_MODULE,
  INDIA_MODULE,
  SPAIN_MODULE,
  IRELAND_MODULE,
  JAPAN_MODULE,
  ITALY_MODULE,
  MEXICO_MODULE,
];

export const COUNTRY_MODULES_BY_CODE: Record<string, CountryModule> = Object.fromEntries(
  COUNTRY_MODULES.map((m) => [m.code, m]),
);

export function countryModuleFor(code: string): CountryModule | undefined {
  return COUNTRY_MODULES_BY_CODE[code];
}

// Bundles loaded so far, by country code. Shared by every caller, so each
// bundle is imported once.
const loaded = new Map<string, CountryBundle>();
const loading = new Map<string, Promise<CountryBundle | undefined>>();

/**
 * Load a multiparty country's bundle (cached). Resolves undefined for an
 * unknown code or a country on another engine path.
 */
export function loadCountry(code: string): Promise<CountryBundle | undefined> {
  const done = loaded.get(code);
  if (done) return Promise.resolve(done);
  let pending = loading.get(code);
  if (!pending) {
    const load = COUNTRY_MODULES_BY_CODE[code]?.load;
    pending = load
      ? load().then((bundle) => {
          loaded.set(code, bundle);
          return bundle;
        }, (error: unknown) => {
          loading.delete(code); // a failed chunk download can be retried
          throw error;
        })
      : Promise.resolve(undefined);
    loading.set(code, pending);
  }
  return pending;
}

/**
 * Hand over bundles already in memory (countries/all imports them all), so
 * loadCountry and loadedCountry answer synchronously from the cache.
 */
export function provideCountries(bundles: CountryBundle[]): void {
  for (const bundle of bundles) loaded.set(bundle.id, bundle);
}

/** Load every multiparty bundle (the campaign editor offers them all). */
export async function loadAllCountries(): Promise<CountryBundle[]> {
  const all = await Promise.all(COUNTRY_MODULES.filter((m) => m.load).map((m) => loadCountry(m.code)));
  return all.filter((b): b is CountryBundle => !!b);
}

/** A bundle that has already loaded, or undefined. Never starts a download. */
export function loadedCountry(code: string): CountryBundle | undefined {
  return loaded.get(code);
}

/** Every bundle loaded so far, in registration order. */
export function loadedCountries(): CountryBundle[] {
  return COUNTRY_MODULES.flatMap((m) => loaded.get(m.code) ?? []);
}

export type { CountryModule } from "./types";
