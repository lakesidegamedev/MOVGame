// Pure election-night allocation and choreography shared by all renderers.

export interface RevealUnit {
  id: string;
  name: string;
  abbr: string;
  winnerId: string; // party id the tally credits this unit to
  winnerColor: string;
  winnerShort: string;
  units: number; // EV or seats
  allocation?: Record<string, number>; // Actual party seat split for multiparty regions.
  margin: number; // winner's margin in points, for drama ordering
  upset?: boolean; // flipped vs the scenario baseline
}

export const OTHERS_ID = "__others";

export function unitAllocation(unit: RevealUnit): Record<string, number> {
  return unit.allocation ?? { [unit.winnerId]: unit.units };
}

export interface ScheduleEntry {
  at: number; // ms from t0 at 1x speed
  kind: "wave" | "call" | "cliff" | "end";
  unit?: RevealUnit;
  wave?: number; // 1-based, on wave markers and wave calls
  isCliff?: boolean; // call belongs to the too-close-to-call endgame
  projectedId?: string; // set on the call whose tally crosses the threshold
}

const POLLS_BEAT = 1300; // "polls are closing…" hold
const WAVE_BEAT = 400; // pause after each wave banner
const CALL_STAGGER = 110; // between calls inside a wave
const WAVE_GAP = 1800; // between waves (tally bars animate)
const CLIFF_INTRO = 1700; // "too close to call" hold before the endgame
const CLIFF_GAP_MIN = 1000; // first cliffhanger resolves fastest…
const CLIFF_GAP_EXTRA = 1300; // …the tightest race waits the longest
const PROJECTION_PAUSE = 2200; // dramatic beat after the projection call
const END_HOLD = 1400; // hold on the final board before the CTA

// Plurality (most units wins, no threshold): pass the engine's winner. A party
// is projected once its tally beats every rival's tally plus all units still
// out (the lead can no longer be overturned). If the last call leaves a tie on
// units, the engine's tie-break already chose the winner, so it is projected
// on that call.
export function buildSchedule(
  units: RevealUnit[],
  threshold: number,
  pluralityWinner?: string,
): { entries: ScheduleEntry[]; waveCount: number; projectedId: string | null } {
  const sorted = [...units].sort((a, b) => b.margin - a.margin);
  const n = sorted.length;
  // The closest ~8 races get individual "too close to call" drama at the end.
  const cliffN = Math.min(8, Math.floor(n / 3));
  const safe = sorted.slice(0, n - cliffN);
  const cliff = sorted.slice(n - cliffN); // desc margin → tightest resolves LAST
  const waveCount = Math.max(1, Math.min(6, Math.ceil(safe.length / 3)));
  const perWave = Math.ceil(safe.length / waveCount);

  const entries: ScheduleEntry[] = [];
  const tally = new Map<string, number>();
  let projectedId: string | null = null;
  let t = POLLS_BEAT;

  const totalUnits = units.reduce((s, u) => s + u.units, 0);
  let calledUnits = 0;
  let callsLeft = units.length;

  const project = (e: ScheduleEntry, party: string) => {
    projectedId = party;
    e.projectedId = party;
    t += PROJECTION_PAUSE; // let the banner land
  };

  const pushCall = (u: RevealUnit, wave?: number, isCliff?: boolean) => {
    const e: ScheduleEntry = { at: t, kind: "call", unit: u, wave, isCliff };
    if (pluralityWinner === undefined) {
      for (const [party, seats] of Object.entries(unitAllocation(u))) {
        const v = (tally.get(party) ?? 0) + seats;
        tally.set(party, v);
        if (!projectedId && v >= threshold) project(e, party);
      }
    } else {
      for (const [party, seats] of Object.entries(unitAllocation(u))) tally.set(party, (tally.get(party) ?? 0) + seats);
      calledUnits += u.units;
      callsLeft -= 1;
      if (!projectedId) {
        const out = totalUnits - calledUnits;
        const lead = tally.get(pluralityWinner) ?? 0;
        const rival = Math.max(0, ...[...tally].filter(([p]) => p !== pluralityWinner).map(([, v]) => v));
        if (lead > rival + out || callsLeft === 0) project(e, pluralityWinner);
      }
    }
    entries.push(e);
  };

  for (let w = 0; w < waveCount; w++) {
    const slice = safe.slice(w * perWave, (w + 1) * perWave);
    if (slice.length === 0) break;
    entries.push({ at: t, kind: "wave", wave: w + 1 });
    t += WAVE_BEAT;
    for (const u of slice) {
      pushCall(u, w + 1);
      t += CALL_STAGGER;
    }
    t += WAVE_GAP;
  }

  if (cliff.length > 0) {
    entries.push({ at: t, kind: "cliff" });
    t += CLIFF_INTRO;
    cliff.forEach((u, i) => {
      t += CLIFF_GAP_MIN + (i / Math.max(1, cliff.length - 1)) * CLIFF_GAP_EXTRA;
      pushCall(u, undefined, true);
    });
  }

  t += END_HOLD;
  entries.push({ at: t, kind: "end" });
  return { entries, waveCount, projectedId };
}

