import { describe, expect, it } from "vitest";
import { swingValueText } from "@ui/electionNight/Swingometer";
import { verdictText } from "@ui/WhyReport";

describe("margin wording", () => {
  const rival = { ahead: "ahead", behind: "behind", level: "level" };
  const majority = { ahead: "over", behind: "short", level: "exactly on" };

  it("words a player-relative seat margin instead of dropping its sign", () => {
    expect(swingValueText(-37, "vs rival", rival)).toBe("37 behind");
    expect(swingValueText(12, "vs rival", rival)).toBe("12 ahead");
    expect(swingValueText(0, "vs rival", rival)).toBe("level");
    expect(swingValueText(-5, "vs maj.", majority)).toBe("5 short");
    expect(swingValueText(3, "vs maj.", majority)).toBe("3 over");
  });

  it("keeps the directional US margin as before", () => {
    expect(swingValueText(4.5, "pts")).toBe("+4.5 pts");
    expect(swingValueText(-120, "EV")).toBe("120 EV");
  });

  it("never prints a negative number of points in the verdict", () => {
    expect(verdictText(-5.1, "the CDU", false, "seats")).toBe("You finished 5.1 points behind the CDU and fell short in seats.");
    expect(verdictText(2.4, "Labour", false, "seats")).toBe("You finished 2.4 points ahead of Labour on the vote but fell short in seats.");
    expect(verdictText(-0.6, "the PAN", true, "points")).toBe("You finished 0.6 points behind the PAN on the vote but took the lead in points.");
    expect(verdictText(1, "Fine Gael", true, "seats")).toBe("You finished 1.0 point ahead of Fine Gael and took the lead in seats.");
    expect(verdictText(0, "the field", null, "EV")).toBe("You finished level with the field.");
  });
});
