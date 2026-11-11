// Chronological "play next" chains for every engine. The order comes from the
// scenario registry (every playable election of a country, oldest first,
// wrapping at the end), so an election added to a country joins its chain
// automatically. Each module's `next` data only supplies the blurbs; an
// election without an authored blurb gets one built from its label.

import { COUNTRY_MODULES_BY_CODE } from "./countries/index";
import type { NextLink } from "./countries/types";
import { SCENARIO_REGISTRY, type ScenarioMeta } from "./scenarioRegistry";

export type NextScenarioHint = NextLink;

/**
 * A country's elections, oldest first. Two elections in the same year (UK
 * February and October 1974) keep the order of the authored `next.chain`
 * when it lists both, and registry order otherwise.
 */
export function chronologicalElections(code: string): ScenarioMeta[] {
  const authored = COUNTRY_MODULES_BY_CODE[code]?.next.chain?.map((e) => e.id) ?? [];
  const pos = (id: string) => authored.indexOf(id);
  return SCENARIO_REGISTRY.filter((s) => s.country === code)
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      if (a.row.year !== b.row.year) return a.row.year - b.row.year;
      const pa = pos(a.row.nativeId), pb = pos(b.row.nativeId);
      return pa >= 0 && pb >= 0 ? pa - pb : a.i - b.i;
    })
    .map(({ row }) => row);
}

function blurbFor(code: string, from: string, to: ScenarioMeta, wrapped: boolean): string {
  const next = COUNTRY_MODULES_BY_CODE[code]?.next;
  const mapped = next?.map?.[from];
  if (mapped?.id === to.nativeId) return mapped.blurb;
  const chained = next?.chain?.find((e) => e.id === to.nativeId);
  if (chained && !wrapped) return chained.blurb;
  const anyMapped = Object.values(next?.map ?? {}).find((e) => e.id === to.nativeId);
  if (anyMapped && !wrapped) return anyMapped.blurb;
  return wrapped ? `Back to the start: ${to.label}` : `Continue the timeline: ${to.label}`;
}

/**
 * The election to offer after `electionId` in country `code`, or null when
 * the country has no other election. The chain is chronological and wraps;
 * an unknown election continues to the country's earliest one.
 */
export function nextScenarioFor(code: string, electionId: string): NextScenarioHint | null {
  const chain = chronologicalElections(code);
  if (chain.length < 2) return null;
  const idx = chain.findIndex((e) => e.nativeId === electionId);
  const to = chain[idx < 0 ? 0 : (idx + 1) % chain.length]!;
  return { id: to.nativeId, blurb: blurbFor(code, electionId, to, idx === chain.length - 1) };
}

function chainMap(code: string): Record<string, NextScenarioHint> {
  return Object.fromEntries(
    chronologicalElections(code).flatMap((e) => {
      const next = nextScenarioFor(code, e.nativeId);
      return next ? [[e.nativeId, next]] : [];
    }),
  );
}

/** US presidential timeline (scenario ids match SCENARIOS). */
export const US_NEXT_SCENARIO: Record<string, NextScenarioHint> = chainMap("US");

/** UK general elections in chronological order (wraps at the end). */
export const UK_NEXT_SCENARIO: Record<string, NextScenarioHint> = chainMap("UK");

/** Country packs: chronological within each country, wrap to earliest. */
export function countryNextScenario(countryId: string, electionId: string): NextScenarioHint | null {
  return nextScenarioFor(countryId, electionId);
}
