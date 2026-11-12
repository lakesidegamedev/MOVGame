import { Flag, Swords, Crosshair } from "lucide-react";

export type Difficulty = "easy" | "normal" | "hard";

// Shared easy/normal/hard picker for the UK + country setup screens (the US
// SetupScreen has its own inline cards). "normal" is the historical map with a
// slightly stronger player campaign; "easy" adds a head start sized to the race; "hard" is the
// pure-challenge headwind.
const OPTIONS: { id: Difficulty; name: string; blurb: string; Icon: typeof Flag }[] = [
  { id: "easy", name: "Easy", blurb: "A head start sized to the race, a bigger war chest, a sloppier opponent. Landslides are still a fight.", Icon: Flag },
  { id: "normal", name: "Normal", blurb: "The real historical map and a slightly stronger campaign than your rivals'. Skill decides close races.", Icon: Swords },
  { id: "hard", name: "Hard", blurb: "A lighter campaign against a relentless main rival. Only the tightest races are yours to steal.", Icon: Crosshair },
];

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div className="field">
      <label>Difficulty</label>
      <div className="su-optgrid su-optgrid-3" role="group" aria-label="Difficulty">
        {OPTIONS.map(({ id, name, blurb, Icon }) => {
          const sel = value === id;
          return (
            <button
              key={id}
              type="button"
              className={`su-opt${sel ? " sel" : ""}`}
              aria-pressed={sel}
              onClick={() => onChange(id)}
            >
              <span className="su-opt-name"><Icon size={14} className="su-opt-icon" aria-hidden="true" /> {name}</span>
              <span className="su-opt-blurb">{blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
