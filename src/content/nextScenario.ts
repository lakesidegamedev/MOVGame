// Chronological "play next" chains for every engine, derived from each
// country module's `next` data. Keeps the retention loop in one place so
// Results screens don't each hard-code their own map.

import { COUNTRY_MODULES_BY_CODE } from "./countries/index";
import type { NextLink } from "./countries/types";

export type NextScenarioHint = NextLink;

function chainToMap(chain: readonly NextLink[]): Record<string, NextScenarioHint> {
  return Object.fromEntries(
    chain.map((entry, i) => {
      const next = chain[(i + 1) % chain.length]!;
      return [entry.id, { id: next.id, blurb: next.blurb }];
    }),
  );
}

/**
 * The election to offer after `electionId` in country `code`, or null. An
 * explicit `next.map` entry wins; otherwise the chain continues (wrapping),
 * and an election missing from the chain continues to its first entry.
 */
export function nextScenarioFor(code: string, electionId: string): NextScenarioHint | null {
  const next = COUNTRY_MODULES_BY_CODE[code]?.next;
  if (!next) return null;
  const mapped = next.map?.[electionId];
  if (mapped) return { id: mapped.id, blurb: mapped.blurb };
  const chain = next.chain ?? [];
  if (chain.length === 0) return null;
  const idx = chain.findIndex((e) => e.id === electionId);
  if (idx < 0) return { id: chain[0]!.id, blurb: chain[0]!.blurb };
  const hint = chain[(idx + 1) % chain.length]!;
  return { id: hint.id, blurb: hint.blurb };
}

/** US presidential timeline (scenario ids match SCENARIOS). */
export const US_NEXT_SCENARIO: Record<string, NextScenarioHint> = { ...(COUNTRY_MODULES_BY_CODE.US?.next.map ?? {}) };

/** UK general elections in chronological order (wraps at the end). */
export const UK_NEXT_SCENARIO: Record<string, NextScenarioHint> = chainToMap(COUNTRY_MODULES_BY_CODE.UK?.next.chain ?? []);

/** Country packs: chronological within each country, wrap to earliest. */
export function countryNextScenario(countryId: string, electionId: string): NextScenarioHint | null {
  return nextScenarioFor(countryId, electionId);
}
