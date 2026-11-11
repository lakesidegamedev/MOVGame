import { useState } from "react";
import { Check } from "lucide-react";
import type { ScenarioMeta } from "@content/scenarioRegistry";
import type { PackFacts } from "@lib/storeModel";

/** Cover photo for a country, or a colour block with the flag when there is none. */
export function Cover({ facts, className = "" }: { facts: Pick<PackFacts, "cover" | "flag">; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!facts.cover || failed) {
    return <span className={`store-cover fallback ${className}`} aria-hidden="true"><span>{facts.flag}</span></span>;
  }
  return (
    <img
      className={`store-cover ${className}`}
      src={facts.cover}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const DIFF_LABEL: Record<ScenarioMeta["difficulty"], string> = { easy: "Easier", medium: "Medium", hard: "Harder" };

export function DifficultyChip({ difficulty }: { difficulty: ScenarioMeta["difficulty"] }) {
  return <span className={`store-chip diff-${difficulty}`} title="How hard it is to rewrite this election's result">{DIFF_LABEL[difficulty]}</span>;
}

export function electionName(meta: ScenarioMeta): string {
  return meta.label.split("·")[1]?.trim() ?? meta.label;
}

export function electionYearLabel(meta: ScenarioMeta): string {
  return meta.label.split("·")[0].trim();
}

export function OwnedTick() {
  return <span className="store-tick" aria-hidden="true"><Check size={13} /></span>;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
