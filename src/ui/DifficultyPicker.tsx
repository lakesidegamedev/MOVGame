import { Flag, Swords, Crosshair } from "lucide-react";

export type Difficulty = "easy" | "normal" | "hard";

// Shared easy/normal/hard picker for the UK + country setup screens (the US
// SetupScreen has its own inline cards). "normal" is the true historical fight;
// "easy" grants the underdog handicap so any year is winnable; "hard" is the
// pure-challenge headwind.
const OPTIONS: { id: Difficulty; name: string; blurb: string; Icon: typeof Flag }[] = [
  { id: "easy", name: "Easy", blurb: "A favorable climate, a bigger war chest, a sloppier opponent. Flip even a landslide.", Icon: Flag },
  { id: "normal", name: "Normal", blurb: "The real historical fight, on the calibrated map, against a disciplined campaign.", Icon: Swords },
  { id: "hard", name: "Hard", blurb: "No help, a relentless opponent. Only the tightest races are yours to steal.", Icon: Crosshair },
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
