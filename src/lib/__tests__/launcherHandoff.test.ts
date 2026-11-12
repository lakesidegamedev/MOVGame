import { describe, it, expect } from "vitest";
import { takeLauncherCode } from "../launcherHandoff";

const CODE = "Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3_-xY7Ab3";

describe("takeLauncherCode", () => {
  it("leaves a fragment without a launcher code alone", () => {
    expect(takeLauncherCode("")).toEqual({ code: null, hash: "", present: false });
    expect(takeLauncherCode("#section")).toEqual({ code: null, hash: "#section", present: false });
  });

  it("takes the code and strips it from the fragment", () => {
    expect(takeLauncherCode(`#launcher_code=${CODE}`)).toEqual({ code: CODE, hash: "", present: true });
  });

  it("keeps other fragment values", () => {
    expect(takeLauncherCode(`#launcher_code=${CODE}&x=1`)).toEqual({ code: CODE, hash: "#x=1", present: true });
  });

  it("strips but refuses a malformed code", () => {
    expect(takeLauncherCode("#launcher_code=short")).toEqual({ code: null, hash: "", present: true });
    expect(takeLauncherCode("#launcher_code=" + encodeURIComponent("<script>alert(1)</script>xxxxxxxx")))
      .toEqual({ code: null, hash: "", present: true });
    expect(takeLauncherCode("#launcher_code=")).toEqual({ code: null, hash: "", present: true });
  });
});
