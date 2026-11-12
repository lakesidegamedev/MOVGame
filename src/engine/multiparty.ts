// ─────────────────────────────────────────────────────────────────────────
// MULTIPARTY VOTE MODEL + REGIONAL SEATS CURVE (the UK engine path).
//
// The two-party U.S. path stays the sigmoid model in voteModel.ts. This module
// is its N-party generalization:
//   - vote shares come from a softmax over per-party appeal (sigmoid is the N=2
//     case: softmax({dem:m, rep:0}).dem === sigmoid(m)).
//   - a region's fixed seat pool is split by a calibrated FPTP disproportionality
//     curve: seats_p ∝ efficiency[p] · share_p ^ k, largest-remainder rounded.
//
// Everything is pure + deterministic — no RNG, no DOM.
// ─────────────────────────────────────────────────────────────────────────

import type { PartyId, MajorityRule } from "./system";
import type {
  Government,
  SeatResult,
  StateBloc,
  StateContest,
} from "./types";

// Numerically-stable softmax over an appeal vector → vote shares summing to 1.
export function softmax(appeals: Record<PartyId, number>): Record<PartyId, number> {
  const ids = Object.keys(appeals);
  if (ids.length === 0) return {};
  const max = Math.max(...ids.map((i) => appeals[i]));
  let sum = 0;
  const exps: Record<PartyId, number> = {};
  for (const i of ids) {
    const e = Math.exp(appeals[i] - max);
    exps[i] = e;
    sum += e;
  }
  const out: Record<PartyId, number> = {};
  for (const i of ids) out[i] = sum > 0 ? exps[i] / sum : 1 / ids.length;
  return out;
}

// Live per-party vote shares for a single bloc: softmax over baseline appeal
// plus everything the campaign has done to it. Legible because campaignAppeal is
// literally the sum of the causes logged against that bloc.
export function blocPartyShares(bloc: StateBloc): Record<PartyId, number> {
  const appeal = bloc.appeal ?? {};
  const camp = bloc.campaignAppeal ?? {};
  const combined: Record<PartyId, number> = {};
  for (const p of Object.keys(appeal)) combined[p] = appeal[p] + (camp[p] ?? 0);
  return softmax(combined);
}

// Turnout-weighted per-party vote totals for one region (a contest with blocs).
export function tallyRegion(region: StateContest): {
  votesByParty: Record<PartyId, number>;
  totalVotes: number;
  shareByParty: Record<PartyId, number>;
} {
  const votesByParty: Record<PartyId, number> = {};
  let totalVotes = 0;
  for (const bloc of region.blocs) {
    const weight = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm;
    const shares = blocPartyShares(bloc);
    for (const p of Object.keys(shares)) {
      votesByParty[p] = (votesByParty[p] ?? 0) + weight * shares[p];
    }
    totalVotes += weight;
  }
  const shareByParty: Record<PartyId, number> = {};
  for (const p of Object.keys(votesByParty)) {
    shareByParty[p] = totalVotes > 0 ? votesByParty[p] / totalVotes : 0;
  }
  return { votesByParty, totalVotes, shareByParty };
}

// Largest-remainder rounding of fractional seat counts to integers summing
// exactly to `total`. The UK analog of "538 EV by construction".
export function largestRemainder(
  weights: Record<PartyId, number>,
  total: number,
): Record<PartyId, number> {
  const ids = Object.keys(weights);
  const sumW = ids.reduce((s, i) => s + Math.max(0, weights[i]), 0);
  const out: Record<PartyId, number> = {};
  if (sumW <= 0 || total <= 0) {
    for (const i of ids) out[i] = 0;
    return out;
  }
  const exact: Record<PartyId, number> = {};
  let assigned = 0;
  for (const i of ids) {
    exact[i] = (Math.max(0, weights[i]) / sumW) * total;
    out[i] = Math.floor(exact[i]);
    assigned += out[i];
  }
  let remaining = total - assigned;
  // Hand out the leftover seats to the largest fractional remainders.
  const byRemainder = ids
    .map((i) => ({ i, frac: exact[i] - Math.floor(exact[i]) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < byRemainder.length && remaining > 0; k++) {
    out[byRemainder[k].i] += 1;
    remaining--;
  }
  return out;
}

// Default FPTP amplification: ~2.5 seats-share points move per point of
// vote-share swing, the disproportionality that turns a vote lead into a much
// bigger seat lead.
export const DEFAULT_SEAT_ELASTICITY = 2.6;

// THE SEATS CURVE. Convert a region's per-party vote shares into integer seats by
// swinging off the real baseline: neutral (current == baseline) reproduces the
// region's real seats exactly; as a party's share rises above its baseline it
// gains seats (amplified by elasticity), as it falls it sheds them. The result
// is largest-remainder renormalized so it always sums to the region's pool — so
// every seat a surging party wins is one a fading party loses.
export function allocateRegionSeats(region: StateContest, shareByParty: Record<PartyId, number>): Record<PartyId, number> {
  const seats = region.seats ?? 0;
  const baseSeats = region.baselineSeats ?? {};
  const baseShare = region.baselineShare ?? {};
  const elasticity = region.seatElasticity ?? DEFAULT_SEAT_ELASTICITY;

  const ids = new Set<PartyId>([...Object.keys(baseSeats), ...Object.keys(shareByParty)]);
  const raw: Record<PartyId, number> = {};
  if (region.proportional) {
    // Presidential points: a straight proportional split of the pool. The
    // swing curve below is sticky in small pools (a region's points only move
    // once the swing is worth half a point there), which let a candidate win
    // the runoff vote and still trail on points.
    for (const p of ids) raw[p] = Math.max(0, shareByParty[p] ?? 0) * seats;
    return largestRemainder(raw, seats);
  }
  for (const p of ids) {
    const swing = (shareByParty[p] ?? 0) - (baseShare[p] ?? 0);
    // Seat delta = elasticity · swing · poolSize. Clamp at zero (a party can't
    // win negative seats), then renormalize below preserves the pool total.
    raw[p] = Math.max(0, (baseSeats[p] ?? 0) + elasticity * swing * seats);
  }
  return largestRemainder(raw, seats);
}

// Every seat-bearing region uses presidential points (see StateContest.proportional).
function isPresidency(regions: StateContest[]): boolean {
  const pools = regions.filter((r) => r.seats && r.blocs.length > 0);
  return pools.length > 0 && pools.every((r) => r.proportional === true);
}

// Replace `units` in place with the national largest-remainder split of the
// same total, keyed like the regional tally.
function presidentialUnits(nationalVotes: Record<PartyId, number>, units: Record<PartyId, number>) {
  const total = Object.values(units).reduce((a, b) => a + b, 0);
  const split = largestRemainder(nationalVotes, total);
  for (const p of Object.keys(units)) units[p] = split[p] ?? 0;
  for (const p of Object.keys(split)) units[p] = split[p];
}

// Run the full multiparty election: every region's vote shares → seats, summed
// to a national seat total + national vote share + the government-formation call.
export function computeSeatsResult(
  regions: StateContest[],
  majority: MajorityRule,
  abstainingParties: PartyId[] = [],
  // Optional coalition-compatibility predicate: can `lead` govern with `partner`?
  // (UK: the two main rivals never partner each other.) Omitted ⇒ anyone may.
  compatible?: (lead: PartyId, partner: PartyId) => boolean,
): {
  seats: Record<PartyId, number>;
  voteShare: Record<PartyId, number>;
  seatResults: SeatResult[];
  largestParty: PartyId;
  hung: boolean;
  government: Government;
} {
  const seats: Record<PartyId, number> = {};
  const nationalVotes: Record<PartyId, number> = {};
  let nationalTotal = 0;
  const seatResults: SeatResult[] = [];

  for (const region of regions) {
    if (!region.seats || region.blocs.length === 0) continue;
    const { votesByParty, totalVotes, shareByParty } = tallyRegion(region);
    const seatsByParty = allocateRegionSeats(region, shareByParty);
    for (const p of Object.keys(seatsByParty)) seats[p] = (seats[p] ?? 0) + seatsByParty[p];
    for (const p of Object.keys(votesByParty)) nationalVotes[p] = (nationalVotes[p] ?? 0) + votesByParty[p];
    nationalTotal += totalVotes;

    let winner = "";
    let best = -1;
    for (const p of Object.keys(seatsByParty)) {
      if (seatsByParty[p] > best) { best = seatsByParty[p]; winner = p; }
    }
    seatResults.push({
      contestId: region.id,
      name: region.name,
      totalSeats: region.seats,
      seatsByParty,
      voteShare: shareByParty,
      winner,
    });
  }

  const voteShare: Record<PartyId, number> = {};
  for (const p of Object.keys(nationalVotes)) voteShare[p] = nationalTotal > 0 ? nationalVotes[p] / nationalTotal : 0;

  // A presidency's points are the national vote split (largest remainder over
  // the whole pool), so per-region rounding in small pools cannot turn a vote
  // lead into a tie. The regional points above stay as the map's breakdown.
  if (isPresidency(regions)) presidentialUnits(nationalVotes, seats);

  // Largest party by seats. Under plurality a tie on units goes to the higher
  // national vote share; an exact tie on both keeps the earlier party.
  let largestParty = "";
  let mostSeats = -1;
  for (const p of Object.keys(seats)) {
    if (seats[p] > mostSeats) { mostSeats = seats[p]; largestParty = p; }
    else if (majority.plurality && seats[p] === mostSeats && (voteShare[p] ?? 0) > (voteShare[largestParty] ?? 0)) {
      largestParty = p;
    }
  }

  const government = formGovernment(seats, majority, abstainingParties, largestParty, compatible);
  const hung = government.kind === "hung" || government.kind === "minority" ||
    government.kind === "coalition" || government.kind === "confidence_supply";

  return { seats, voteShare, seatResults, largestParty, hung, government };
}

// The government-formation call. Effective threshold accounts for abstaining
// parties (Sinn Féin) + the Speaker — the bar to actually command the Commons.
export function formGovernment(
  seats: Record<PartyId, number>,
  majority: MajorityRule,
  abstainingParties: PartyId[],
  largestParty: PartyId,
  compatible: (lead: PartyId, partner: PartyId) => boolean = () => true,
): Government {
  // Plurality: the largest party wins outright, whatever its share.
  if (majority.plurality) {
    const top = seats[largestParty] ?? 0;
    return top > 0 ? { kind: "majority", party: largestParty, seats: top } : { kind: "hung", largest: largestParty };
  }

  const abstainSeats = abstainingParties.reduce((s, p) => s + (seats[p] ?? 0), 0);
  // Effective Commons size after abstentions; majority is half of that + 1.
  const effectiveTotal = majority.total - abstainSeats;
  const threshold = majority.effectiveThreshold ?? Math.floor(effectiveTotal / 2) + 1;

  const lead = seats[largestParty] ?? 0;
  if (lead >= threshold) return { kind: "majority", party: largestParty, seats: lead };

  // No majority — look for the most natural coalition / arrangement, among
  // partners the largest party could actually govern with.
  const partners = Object.keys(seats)
    .filter((p) => p !== largestParty && !abstainingParties.includes(p) && compatible(largestParty, p))
    .sort((a, b) => (seats[b] ?? 0) - (seats[a] ?? 0));

  // A two-party coalition that clears the bar (lead + the largest willing partner).
  for (const partner of partners) {
    if (lead + (seats[partner] ?? 0) >= threshold) {
      // A small partner = confidence-and-supply; a large one = formal coalition.
      if ((seats[partner] ?? 0) < lead * 0.2) {
        return { kind: "confidence_supply", lead: largestParty, partner, seats: lead + (seats[partner] ?? 0) };
      }
      return { kind: "coalition", parties: [largestParty, partner], seats: lead + (seats[partner] ?? 0) };
    }
  }

  // Largest party short even with a partner — a minority government attempt, or
  // a genuinely hung parliament if it's nowhere close.
  if (lead >= threshold * 0.85) return { kind: "minority", party: largestParty, seats: lead };
  return { kind: "hung", largest: largestParty };
}

// ── Difficulty helpers (shared by the UK and country engines) ──────────────
// Both read only the election's fixed opening data (baselineSeats and
// baselineShare never change during play), so they return the same answer on
// every turn and for a resumed save without storing anything new.

// Opening national strength of each party: real seats summed over regions,
// plus the seat-weighted opening vote share (the tie-break).
function openingStrength(regions: StateContest[]): { seats: Record<PartyId, number>; share: Record<PartyId, number> } {
  const seats: Record<PartyId, number> = {};
  const share: Record<PartyId, number> = {};
  let pool = 0;
  for (const region of regions) {
    const n = region.seats ?? 0;
    pool += n;
    for (const [p, s] of Object.entries(region.baselineSeats ?? {})) seats[p] = (seats[p] ?? 0) + s;
    for (const [p, v] of Object.entries(region.baselineShare ?? {})) share[p] = (share[p] ?? 0) + v * n;
  }
  if (pool > 0) for (const p of Object.keys(share)) share[p] /= pool;
  return { seats, share };
}

// The player's chief rival: the strongest other party at the opening (most
// real seats, then the higher opening vote share, then the earlier id). The
// difficulty setting scales this party's campaigning only, so a harder setting
// never strengthens a third party that splits the front-runner's vote.
export function chiefRival(regions: StateContest[], player: PartyId): PartyId | undefined {
  const { seats, share } = openingStrength(regions);
  let best: PartyId | undefined;
  for (const p of Object.keys(share).sort()) {
    if (p === player) continue;
    if (
      best === undefined ||
      (seats[p] ?? 0) > (seats[best] ?? 0) ||
      ((seats[p] ?? 0) === (seats[best] ?? 0) && share[p] > share[best])
    ) best = p;
  }
  return best;
}

// Units (seats or points) each party would win if `tilt` logits were added to
// the player's appeal in every bloc where the player stands. Pure: reads the
// regions, never writes them.
function unitsWithTilt(regions: StateContest[], player: PartyId, tilt: number): Record<PartyId, number> {
  const units: Record<PartyId, number> = {};
  const national: Record<PartyId, number> = {};
  for (const region of regions) {
    if (!region.seats || region.blocs.length === 0) continue;
    const stands = region.baselineShare?.[player] !== undefined;
    const votes: Record<PartyId, number> = {};
    let total = 0;
    for (const bloc of region.blocs) {
      const weight = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm;
      const appeal = bloc.appeal ?? {};
      const camp = bloc.campaignAppeal ?? {};
      const combined: Record<PartyId, number> = {};
      for (const p of Object.keys(appeal)) combined[p] = appeal[p] + (camp[p] ?? 0) + (stands && p === player ? tilt : 0);
      const shares = softmax(combined);
      for (const p of Object.keys(shares)) votes[p] = (votes[p] ?? 0) + weight * shares[p];
      total += weight;
    }
    const share: Record<PartyId, number> = {};
    for (const p of Object.keys(votes)) share[p] = total > 0 ? votes[p] / total : 0;
    const seats = allocateRegionSeats(region, share);
    for (const p of Object.keys(seats)) units[p] = (units[p] ?? 0) + seats[p];
    for (const p of Object.keys(votes)) national[p] = (national[p] ?? 0) + votes[p];
  }
  if (isPresidency(regions)) presidentialUnits(national, units);
  return units;
}

const leads = (units: Record<PartyId, number>, player: PartyId) =>
  Object.keys(units).every((p) => p === player || (units[p] ?? 0) < (units[player] ?? 0));

// The climate tilt that would make the player the largest party: the smallest
// uniform boost (logits on the player's appeal, wherever the player stands)
// after which the player holds more seats or points than every other party.
// Measured on the real seat curve, so it sees first-past-the-post bias and
// runoff points, not just the vote gap. Zero when the player already leads;
// MAX_LEVELING_TILT when even that would not do it (a regional party that
// cannot win nationally). Bisection with a fixed step count, so the web and
// native engines take identical steps.
export const MAX_LEVELING_TILT = 1.5;
export function levelingTilt(regions: StateContest[], player: PartyId): number {
  if (leads(unitsWithTilt(regions, player, 0), player)) return 0;
  if (!leads(unitsWithTilt(regions, player, MAX_LEVELING_TILT), player)) return MAX_LEVELING_TILT;
  let lo = 0;
  let hi = MAX_LEVELING_TILT;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (leads(unitsWithTilt(regions, player, mid), player)) hi = mid;
    else lo = mid;
  }
  return hi;
}

// The easy-mode climate tilt for a race whose leveling tilt is `level`: close
// `gapShare` of the gap, and never leave more than `gapResidual` for the
// campaign to make up, so a landslide on easy plays like a clear-cut race
// rather than a lost cause. Zero when gapShare is 0 (normal and hard). Shared
// by every engine (the U.S. passes usLevelingTilt).
export function climateTilt(hc: { gapShare: number; gapResidual: number }, level: number): number {
  if (hc.gapShare <= 0 || level <= 0) return 0;
  return Math.max(hc.gapShare * level, level - hc.gapResidual);
}

// Campaign multiplier for `party` under a difficulty handicap: the player's
// `persuasion`, the chief rival's `aiPersuasion`, 1.0 for every other party.
export function handicapMultiplier(
  hc: { persuasion: number; aiPersuasion: number },
  regions: StateContest[],
  player: PartyId,
  party: PartyId,
): number {
  if (party === player) return hc.persuasion;
  return party === chiefRival(regions, player) ? hc.aiPersuasion : 1;
}
