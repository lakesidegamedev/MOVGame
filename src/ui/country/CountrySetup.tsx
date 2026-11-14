import { useState } from "react";
import { useCountryStore } from "@store/countryStore";
import { useAuthStore } from "@store/authStore";
import { SIGN_IN_TO_PLAY_FREE, openLockedScenario, useFreeAccess } from "@lib/freeAccess";
import { playablePartiesIn, regionalReach, type CountryBundle } from "@engine/countryGame";
import { ElectionTile, PartyCard } from "@ui/ElectionTile";
import { PartyLogo } from "@ui/PartyLogo";
import { partyInk } from "@ui/colors";
import { partyColor, partyName, partyShort } from "./helpers";
import { Vote, Dices, ChevronLeft, Flag, Lock } from "lucide-react";
import type { PartyId } from "@engine/system";
import { BRAND } from "../../brand";
import { DifficultyPicker, type Difficulty } from "@ui/DifficultyPicker";
import { TideBanner, ChallengePartyBanner, RegionalPartyBanner } from "@ui/TideBanner";
import { dailyPairFor } from "@lib/daily";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { FR_FIRST_ROUND } from "@content/countries/france.runoff";
import { COUNTRY_MODULES_BY_CODE } from "@content/countries";

// "First round: PS 25.9%, UDF 28.3%, eliminated candidates 45.8%." The two
// finalists are the election's playable parties; every other key in the
// first-round table is a group of eliminated candidates.
function firstRoundLine(country: CountryBundle, election: string, finalists: PartyId[]): string {
  const shares = FR_FIRST_ROUND[election];
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const named = finalists.filter((p) => shares[p] !== undefined);
  const rest = Object.entries(shares).filter(([p]) => !named.includes(p)).reduce((s, [, x]) => s + x, 0);
  const parts = named.map((p) => `${partyShort(country, p)} ${pct(shares[p])}`);
  if (rest > 0) parts.push(`eliminated candidates ${pct(rest)}`);
  return `First round: ${parts.join(", ")}.`;
}

function randomSeed(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function CountrySetup({ country, onBack, initialElection, initialSeed, initialParty }: {
  country: CountryBundle;
  onBack: () => void;
  initialElection?: string;
  initialSeed?: string;    // prefill only — the player can still edit/reroll
  initialParty?: string;   // party id, e.g. "lpc" / "spd" (Daily Challenge routing)
}) {
  const newGame = useCountryStore((s) => s.newGame);
  const canPlay = useAuthStore((s) => s.canPlay);
  const fa = useFreeAccess();
  const ids = Object.keys(country.elections).sort((a, b) => Number(b) - Number(a));
  const [election, setElection] = useState(initialElection && country.elections[initialElection] ? initialElection : ids[0]);
  const [party, setParty] = useState<PartyId>(initialParty && country.playable.includes(initialParty) ? initialParty : country.playable[0]);
  const [seed, setSeed] = useState<string>(() => initialSeed ?? randomSeed());
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const data = country.elections[election];
  const playable = playablePartiesIn(country, election);
  const activeParty = playable.includes(party) ? party : playable[0];
  const leader = country.leaders[election]?.[activeParty];
  const setupNote = COUNTRY_MODULES_BY_CODE[country.id]?.setupNote;

  return (
    <div className="center">
      <div className="setup">
        <div className="setup-eyebrow">
          <span className="mark"><Vote size={18} /></span>{country.flag} {country.label.toUpperCase()} · {data.year}
        </div>
        <div className="title">{BRAND.name}</div>
        <p className="sub">{data.tagline}</p>
        {setupNote && <p className="muted small">{setupNote}</p>}
        {country.id === "FR" && FR_FIRST_ROUND[election] && (
          <div className="su-summary">
            <strong>Runoff starting point</strong>
            <p className="muted small">
              The first round is complete. The campaign starts with finalist support and voter transfers already reflected in the regional map.
            </p>
            <div className="small">
              {firstRoundLine(country, election, playable)}
            </div>
          </div>
        )}
        <TideBanner scenarioId={`${country.id.toLowerCase()}-${election}`} />
        {country.id === "FR" && election === "2022" && (
          <div className="callout warning">
            <strong>{activeParty === "ens" ? "Historical favorite" : "Long-shot challenge"}</strong>
            <p className="muted small">
              {activeParty === "ens"
                ? "Macron begins the runoff with a large lead. Defend it while building a stronger finish, or try the closer 2027 race for a tighter contest."
                : "Le Pen begins far behind. Build a national runoff argument to move support across France; regional pushes alone rarely close the gap."}
            </p>
          </div>
        )}
        {(() => {
          const reach = regionalReach(country, election, activeParty);
          if (reach) {
            return (
              <RegionalPartyBanner
                partyLabel={partyName(country, activeParty)}
                regionNames={reach.regions.map((id) => country.regions.find((r) => r.id === id)?.name ?? id)}
                seats={reach.seats}
                total={(data.majority ?? country.system.majority).total}
                unitPlural={country.unitNamePlural}
                historical={reach.historical}
              />
            );
          }
          const meta = SCENARIOS_BY_ID[`${country.id.toLowerCase()}-${election}`];
          const majors = meta ? dailyPairFor(meta) : country.playable.slice(0, 2);
          return !majors.includes(activeParty) ? (
            <ChallengePartyBanner partyLabel={partyName(country, activeParty)} />
          ) : null;
        })()}

        <div className="su-panel">
          {ids.length > 1 && (
            <div className="field">
              <label>Election</label>
              <div className="election-grid">
                {ids.map((id) => (
                  <ElectionTile
                    key={id}
                    scenarioId={`${country.id.toLowerCase()}-${id}`}
                    year={country.elections[id].year}
                    title={country.elections[id].label.replace(/^\d{4}\s*(·\s*)?/, "")}
                    selected={election === id}
                    locked={!canPlay(`${country.id.toLowerCase()}-${id}`)}
                    onClick={() => setElection(id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Lead which side? Your leader's traits shape the campaign</label>
            <div className="pick">
              {playable.map((p) => {
                const ld = country.leaders[election]?.[p];
                const name = ld?.name ?? partyName(country, p);
                return (
                  <PartyCard key={p} name={partyName(country, p)} sub={ld?.name ?? `${partyShort(country, p)} leader`} leader={name}
                    logo={<PartyLogo country={country.id} party={p} year={data?.year} />}
                    color={partyColor(country, p)} selected={activeParty === p} onClick={() => setParty(p)} />
                );
              })}
            </div>
            {leader && (
              <div className="su-summary">
                <div className="su-summary-row"><span className="su-summary-k">Charisma</span><span className="su-summary-v">{leader.charisma}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Energy</span><span className="su-summary-v">{leader.energy}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Competence</span><span className="su-summary-v">{leader.competence}</span></div>
                <div className="su-summary-row"><span className="su-summary-k">Machine</span><span className="su-summary-v">{leader.machine}</span></div>
              </div>
            )}
          </div>

          <DifficultyPicker value={difficulty} onChange={setDifficulty} />

          <div className="field">
            <label>Seed: same seed replays the same events & RNG</label>
            <div className="su-seed">
              <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
              <button type="button" className="ghost su-reroll" title="Reroll seed" onClick={() => setSeed(randomSeed())}>
                <Dices size={16} /> Reroll
              </button>
            </div>
          </div>

          <div className="su-summary">
            <div className="su-summary-row">
              <span className="su-summary-k">Leading</span>
              <span className="su-summary-v" style={{ color: partyInk(partyColor(country, activeParty)) }}>
                {partyName(country, activeParty)}{leader ? ` · ${leader.name}` : ""}
              </span>
            </div>
            <div className="su-summary-row"><span className="su-summary-k">Goal</span><span className="su-summary-v">{data.goalText ?? country.goalText}</span></div>
          </div>
        </div>

        <div className="su-nav">
          <button className="ghost" onClick={onBack}><ChevronLeft size={16} /> All scenarios</button>
          <button
            className="primary su-next"
            onClick={() => {
              const sid = `${country.id.toLowerCase()}-${election}`;
              if (!canPlay(sid)) { openLockedScenario(sid); return; }
              newGame(country.id, election, activeParty, seed, difficulty);
            }}
          >
            <Flag size={15} /> {canPlay(`${country.id.toLowerCase()}-${election}`)
              ? <>Begin {data.year} as {partyShort(country, activeParty)}</>
              : <><Lock size={14} aria-hidden="true" /> {fa.on ? SIGN_IN_TO_PLAY_FREE : "Unlock to play"}</>}
          </button>
          {!canPlay(`${country.id.toLowerCase()}-${election}`) && fa.on && !fa.signedIn && <span className="muted small">{fa.untilLine}</span>}
        </div>
      </div>
    </div>
  );
}
