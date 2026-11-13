import { loadedCountry } from "@content/countries";
import type { ReplayLog } from "@lib/replay";
import { money } from "./format";

/**
 * Cash from a replay log, in the campaign's own currency and units. US cash
 * is in dollars; UK and country funds are already in millions, the way the
 * campaign desk shows them ("£14M").
 */
export function replayMoney(log: Pick<ReplayLog, "engine" | "scenarioId"> | null | undefined, n: number): string {
  if (log?.engine === "uk" || log?.engine === "country") {
    // Country replay logs carry "<CODE>-<election>" as their scenario id.
    const currency = log.engine === "uk" ? "£" : loadedCountry(log.scenarioId.split("-")[0]!.toUpperCase())?.currency ?? "$";
    return `${n < 0 ? "-" : ""}${currency}${Math.abs(n).toFixed(1)}M`;
  }
  return money(n);
}
