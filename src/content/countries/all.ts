// ─────────────────────────────────────────────────────────────────────────
// EVERY COUNTRY BUNDLE, IMPORTED UP FRONT.
//
// For the Node server, the native export scripts, the balance tools and
// tests: code that wants synchronous access to every CountryBundle. The web
// client must not import this file (it would put every country's map and
// events back into the first download; a test enforces it). Client code
// awaits loadCountry(code) from ./index instead.
//
// A new country adds its bundle import and list entry here (alphabetical).
// Importing this file throws if the list and the registered modules differ.
// ─────────────────────────────────────────────────────────────────────────

import type { CountryBundle } from "@engine/countryGame";
import { COUNTRY_MODULES, provideCountries } from "./index";
import { AUSTRALIA } from "./australia.bundle";
import { BRAZIL } from "./brazil.bundle";
import { CANADA } from "./canada.bundle";
import { FRANCE } from "./france.bundle";
import { GERMANY } from "./germany.bundle";
import { INDIA } from "./india.bundle";
import { IRELAND } from "./ireland.bundle";
import { ITALY } from "./italy.bundle";
import { JAPAN } from "./japan.bundle";
import { MEXICO } from "./mexico.bundle";
import { NEW_ZEALAND } from "./newZealand.bundle";
import { SPAIN } from "./spain.bundle";

const BUNDLES: CountryBundle[] = [AUSTRALIA, BRAZIL, CANADA, FRANCE, GERMANY, INDIA, IRELAND, ITALY, JAPAN, MEXICO, NEW_ZEALAND, SPAIN];

const byCode = new Map(BUNDLES.map((bundle) => [bundle.id, bundle]));
const multiparty = COUNTRY_MODULES.filter((m) => m.engine === "country");
for (const m of multiparty) {
  if (!byCode.has(m.code)) throw new Error(`countries/all.ts: import the ${m.code} bundle and add it to BUNDLES`);
}
for (const code of byCode.keys()) {
  if (!multiparty.some((m) => m.code === code)) throw new Error(`countries/all.ts: bundle ${code} has no registered module in countries/index.ts`);
}

/** Bundles for the shared multiparty engine, keyed by country code, in registration order. */
export const COUNTRIES: Record<string, CountryBundle> = Object.fromEntries(
  multiparty.map((m) => [m.code, byCode.get(m.code)!]),
);

// loadCountry and loadedCountry now answer from memory, with no dynamic import.
provideCountries(Object.values(COUNTRIES));

export function getCountry(id: string): CountryBundle | undefined {
  return COUNTRIES[id];
}

export * from "./index";
