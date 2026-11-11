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
];

export const COUNTRY_MODULES_BY_CODE: Record<string, CountryModule> = Object.fromEntries(
  COUNTRY_MODULES.map((m) => [m.code, m]),
);

export function countryModuleFor(code: string): CountryModule | undefined {
  return COUNTRY_MODULES_BY_CODE[code];
}

/** Bundles for the shared multiparty engine, keyed by country code. */
export const COUNTRIES: Record<string, CountryBundle> = Object.fromEntries(
  COUNTRY_MODULES.filter((m) => m.engine === "country" && m.bundle).map((m) => [m.code, m.bundle!]),
);

export function getCountry(id: string): CountryBundle | undefined {
  return COUNTRIES[id];
}

export type { CountryModule } from "./types";
