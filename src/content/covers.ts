// Country photography for the landing page. Scenario tiles use code-native
// campaign art so every election stays distinct and never depends on a missing
// or duplicated portrait asset. Each country module names its own cover.

import { COUNTRY_MODULES_BY_CODE } from "./countries/index";
import type { CountryCode } from "./scenarioRegistry";

/**
 * The landing photograph for a country, or undefined when its module has none
 * yet. Callers already render a text-led card without a cover.
 */
export function countryCover(code: CountryCode): string | undefined {
  return COUNTRY_MODULES_BY_CODE[code]?.cover ?? undefined;
}

/** Scenario art colours for a country (ScenarioArt), with a neutral default. */
export function countryArt(code: CountryCode): { a: string; b: string; glow: string } {
  return COUNTRY_MODULES_BY_CODE[code]?.art ?? { a: "#1d2a44", b: "#4b5d7a", glow: "rgba(200,210,230,0.18)" };
}
