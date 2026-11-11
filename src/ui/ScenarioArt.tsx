import type { CSSProperties } from "react";
import type { CountryCode } from "@content/scenarioRegistry";
import { countryModuleFor } from "@content/countries";
import { countryArt } from "@content/covers";

function variantFor(scenarioId: string): number {
  let hash = 2166136261;
  for (const char of scenarioId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 6;
}

export function ScenarioArt({
  scenarioId,
  country,
  year,
}: {
  scenarioId: string;
  country: CountryCode;
  year: number;
}) {
  const variant = variantFor(scenarioId);
  const module = countryModuleFor(country);
  const art = countryArt(country);
  const palette = { "--art-a": art.a, "--art-b": art.b, "--art-glow": art.glow } as CSSProperties;
  return (
    <div
      className={`scenario-cover scenario-art art-${country.toLowerCase()} art-v${variant}`}
      style={palette}
      data-scenario-art={scenarioId}
      aria-hidden="true"
    >
      <span className="scenario-art-top">
        <span>{module?.flag} {module?.name}</span>
        <span>Margin of Victory archive</span>
      </span>
      <span className="scenario-art-year">{year}</span>
      <span className="scenario-art-title">Campaign file / {scenarioId.toUpperCase()}</span>
      <span className="scenario-art-mark">B</span>
    </div>
  );
}
