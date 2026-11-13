// Rough edges found playing 2.0 on the live site: what a results screen
// offers a player without packs, campaign cash in its own units, and the
// projected outcome of a presidential runoff.
import { describe, it, expect } from "vitest";
import { freeAlternative } from "@content/nextScenario";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { COUNTRY_MODULES } from "@content/countries";
import { replayMoney } from "../replayMoney";
import { money, moneyMillions } from "../format";
import { projectedOutcomeLabel } from "../country/CountryPanels";
import { freeChoice } from "../electionNight/ElectionNightShell";

describe("freeAlternative", () => {
  const freeIn = (country: string) => SCENARIO_REGISTRY.filter((s) => s.country === country && s.free).sort((a, b) => b.year - a.year);

  it("offers every finished free election another free election, never the one just played", () => {
    for (const played of SCENARIO_REGISTRY.filter((s) => s.free)) {
      const alt = freeAlternative(played.country, played.scenarioId);
      expect(alt, played.scenarioId).not.toBeNull();
      expect(alt!.free).toBe(true);
      expect(alt!.scenarioId).not.toBe(played.scenarioId);
      // Same country when it has another free election, otherwise somewhere else.
      if (freeIn(played.country).length > 1) expect(alt!.country).toBe(played.country);
      else expect(alt!.country).not.toBe(played.country);
    }
  });

  it("keeps a US player in the US: 2020 after 2024, and 2024 after a paid US election", () => {
    expect(freeAlternative("US", "us-2024")!.scenarioId).toBe("us-2020");
    expect(freeAlternative("US", "us-2020")!.scenarioId).toBe("us-2024");
    expect(freeAlternative("US", "us-1960")!.scenarioId).toBe("us-2024");
  });

  it("offers the same country's free election after a paid one", () => {
    for (const m of COUNTRY_MODULES) {
      const paid = SCENARIO_REGISTRY.find((s) => s.country === m.code && !s.free);
      if (!paid) continue;
      expect(freeAlternative(m.code, paid.scenarioId)!.scenarioId, paid.scenarioId).toBe(freeIn(m.code)[0]!.scenarioId);
    }
  });

  it("moves on to the next country's newest free election once a country's free ones are played, and wraps", () => {
    const order = COUNTRY_MODULES.map((m) => m.code as string);
    const uk = freeIn("UK");
    expect(uk).toHaveLength(1);
    expect(freeAlternative("UK", uk[0]!.scenarioId)!.country).toBe(order[order.indexOf("UK") + 1]);
    const last = order[order.length - 1]!;
    expect(freeIn(last)).toHaveLength(1);
    expect(freeAlternative(last, freeIn(last)[0]!.scenarioId)!.scenarioId).toBe(freeIn(order[0]!)[0]!.scenarioId);
  });
});

describe("freeChoice", () => {
  it("names the free election once, with its year a single time", () => {
    const label = freeChoice(false, "US", "us-2024")!.label;
    expect(label).toMatch(/^\S+ 2020 · /);
    expect(label).not.toMatch(/2020 2020/);
    expect(freeChoice(true, "US", "us-2024")).toBeNull();
  });
});

describe("replayMoney", () => {
  it("shows UK and country funds in millions, US cash in dollars", () => {
    expect(replayMoney({ engine: "uk", scenarioId: "uk-2024" }, 12)).toBe("£12.0M");
    expect(replayMoney({ engine: "uk", scenarioId: "uk-2024" }, -2.5)).toBe("-£2.5M");
    expect(replayMoney({ engine: "us", scenarioId: "us-2024" }, 53_000_000)).toBe("$53.0M");
    expect(replayMoney({ engine: "country", scenarioId: "zz-2024" }, 8)).toBe("$8.0M");
  });

  it("puts a minus sign before the currency symbol, never after it", () => {
    expect(replayMoney({ engine: "us", scenarioId: "us-2024" }, -8_100_000)).toBe("-$8.1M");
    expect(replayMoney({ engine: "uk", scenarioId: "uk-2024" }, -0.01)).toBe("£0.0M");
  });
});

describe("money", () => {
  it("reads -$8.1M for campaign debt, at every size", () => {
    expect(money(-8_100_000)).toBe("-$8.1M");
    expect(money(-1_250_000_000)).toBe("-$1.25B");
    expect(money(-350_000)).toBe("-$350K");
    expect(money(-12)).toBe("-$12");
    expect(money(8_100_000)).toBe("$8.1M");
    expect(money(-0.4)).toBe("$0");
  });

  it("formats amounts already in millions in the campaign's currency", () => {
    expect(moneyMillions("£", -2.5)).toBe("-£2.5M");
    expect(moneyMillions("R$", 14, 0)).toBe("R$14M");
    expect(moneyMillions("₹", -0.04)).toBe("₹0.0M");
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
