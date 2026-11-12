import { describe, expect, it } from "vitest";
import { COUNTRY_MODULES, loadAllCountries, loadCountry, loadedCountries, loadedCountry } from "@content/countries";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import { PACKS } from "@content/packs";

// The web client imports the country registry with the landing page and loads
// each country's bundle on demand. This file never imports countries/all, so
// it sees the registry the way the browser does.
describe("country bundles load on demand", () => {
  it("the registry, packs and scenario rows need no bundle", () => {
    expect(SCENARIO_REGISTRY.length).toBeGreaterThan(100);
    expect(PACKS.length).toBeGreaterThan(COUNTRY_MODULES.length);
    expect(loadedCountries()).toEqual([]);
  });

  it("loads one country, caches it, and starts no other download", async () => {
    expect(loadedCountry("NZ")).toBeUndefined();
    const first = loadCountry("NZ");
    expect(loadCountry("NZ")).toBe(first); // one import per country, however many callers
    const nz = await first;
    expect(nz?.id).toBe("NZ");
    expect(loadedCountry("NZ")).toBe(nz);
    expect(await loadCountry("NZ")).toBe(nz);
    expect(loadedCountries().map((b) => b.id)).toEqual(["NZ"]);
  });

  it("resolves undefined for other engine paths and unknown codes", async () => {
    expect(await loadCountry("US")).toBeUndefined();
    expect(await loadCountry("UK")).toBeUndefined();
    expect(await loadCountry("XX")).toBeUndefined();
  });

  it("loads every multiparty bundle in registration order", async () => {
    const all = await loadAllCountries();
    const expected = COUNTRY_MODULES.filter((m) => m.engine === "country").map((m) => m.code);
    expect(all.map((b) => b.id)).toEqual(expected);
    expect(loadedCountries().map((b) => b.id)).toEqual(expected);
  });
});
