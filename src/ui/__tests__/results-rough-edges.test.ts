// Rough edges found playing 2.0 on the live site: what a results screen
// offers a player without packs, campaign cash in its own units, and the
// projected outcome of a presidential runoff.
import { describe, it, expect } from "vitest";
import { freeAlternative } from "@content/nextScenario";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { COUNTRY_MODULES } from "@content/countries";
import { replayMoney } from "../replayMoney";
import { projectedOutcomeLabel } from "../country/CountryPanels";

describe("freeAlternative", () => {
  it("offers every finished free election a free election in another country", () => {
    for (const played of SCENARIO_REGISTRY.filter((s) => s.free)) {
      const alt = freeAlternative(played.country, played.scenarioId);
      expect(alt, played.scenarioId).not.toBeNull();
      expect(alt!.free).toBe(true);
      expect(alt!.country).not.toBe(played.country);
    }
  });

  it("goes to the next country's newest free election and wraps at the end", () => {
    const order = COUNTRY_MODULES.map((m) => m.code as string);
    expect(freeAlternative("US", "us-2024")!.country).toBe(order[1]);
    expect(freeAlternative(order[order.length - 1]!, "x")!.country).toBe(order[0]);
    const us = SCENARIO_REGISTRY.filter((s) => s.country === order[0] && s.free).sort((a, b) => b.year - a.year)[0]!;
    expect(freeAlternative(order[order.length - 1]!, "x")!.scenarioId).toBe(us.scenarioId);
  });
});

describe("replayMoney", () => {
  it("shows UK and country funds in millions, US cash in dollars", () => {
    expect(replayMoney({ engine: "uk", scenarioId: "uk-2024" }, 12)).toBe("£12.0M");
    expect(replayMoney({ engine: "uk", scenarioId: "uk-2024" }, -2.5)).toBe("-£2.5M");
    expect(replayMoney({ engine: "us", scenarioId: "us-2024" }, 53_000_000)).toBe("$53.0M");
    expect(replayMoney({ engine: "country", scenarioId: "zz-2024" }, 8)).toBe("$8.0M");
  });
});

describe("projectedOutcomeLabel", () => {
  it("never calls a presidency a minority government", () => {
    expect(projectedOutcomeLabel({ runoff: true }, "majority")).toBe("Wins presidency");
    expect(projectedOutcomeLabel({ runoff: true }, "minority")).toBe("Too close to call");
    expect(projectedOutcomeLabel({ runoff: true }, "hung")).toBe("Too close to call");
    expect(projectedOutcomeLabel({ plurality: true }, "majority")).toBe("Wins presidency");
    expect(projectedOutcomeLabel({}, "minority")).toBe("Minority government");
    expect(projectedOutcomeLabel({}, "coalition")).toBe("Coalition");
  });
});
