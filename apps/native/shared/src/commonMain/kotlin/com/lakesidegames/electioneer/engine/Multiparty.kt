package com.lakesidegames.electioneer.engine

import kotlin.math.floor
import kotlin.math.max
import kotlinx.serialization.Serializable

// Multiparty vote model + regional seats curve (the UK engine path). Port of
// src/engine/multiparty.ts. Pure + deterministic: no RNG.

// Numerically-stable softmax over an appeal vector → shares summing to 1.
fun softmax(appeals: Map<PartyId, Double>): Map<PartyId, Double> {
    val ids = appeals.keys.toList()
    if (ids.isEmpty()) return emptyMap()
    val max = ids.maxOf { appeals.getValue(it) }
    var sum = 0.0
    val exps = linkedMapOf<PartyId, Double>()
    for (i in ids) {
        val e = kotlin.math.exp(appeals.getValue(i) - max)
        exps[i] = e
        sum += e
    }
    val out = linkedMapOf<PartyId, Double>()
    for (i in ids) out[i] = if (sum > 0) exps.getValue(i) / sum else 1.0 / ids.size
    return out
}

// Live per-party vote shares for a single bloc.
fun blocPartyShares(bloc: StateBloc): Map<PartyId, Double> {
    val appeal = bloc.appeal ?: emptyMap()
    val camp = bloc.campaignAppeal ?: emptyMap()
    val combined = linkedMapOf<PartyId, Double>()
    for (p in appeal.keys) combined[p] = appeal.getValue(p) + (camp[p] ?: 0.0)
    return softmax(combined)
}

@Serializable
data class RegionTally(
    val votesByParty: Map<PartyId, Double>,
    val totalVotes: Double,
    val shareByParty: Map<PartyId, Double>,
)

// Turnout-weighted per-party vote totals for one region.
fun tallyRegion(region: StateContest): RegionTally {
    val votesByParty = linkedMapOf<PartyId, Double>()
    var totalVotes = 0.0
    for (bloc in region.blocs) {
        val weight = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm
        val shares = blocPartyShares(bloc)
        for (p in shares.keys) {
            votesByParty[p] = (votesByParty[p] ?: 0.0) + weight * shares.getValue(p)
        }
        totalVotes += weight
    }
    val shareByParty = linkedMapOf<PartyId, Double>()
    for (p in votesByParty.keys) {
        shareByParty[p] = if (totalVotes > 0) votesByParty.getValue(p) / totalVotes else 0.0
    }
    return RegionTally(votesByParty, totalVotes, shareByParty)
}

// Largest-remainder rounding of fractional seats to integers summing to total.
fun largestRemainder(weights: Map<PartyId, Double>, total: Int): Map<PartyId, Int> {
    val ids = weights.keys.toList()
    val sumW = ids.sumOf { max(0.0, weights.getValue(it)) }
    val out = linkedMapOf<PartyId, Int>()
    if (sumW <= 0 || total <= 0) {
        for (i in ids) out[i] = 0
        return out
    }
    val exact = linkedMapOf<PartyId, Double>()
    var assigned = 0
    for (i in ids) {
        exact[i] = (max(0.0, weights.getValue(i)) / sumW) * total
        out[i] = floor(exact.getValue(i)).toInt()
        assigned += out.getValue(i)
    }
    var remaining = total - assigned
    // Leftover seats to the largest fractional remainders. sortedWith is
    // stable, matching Array.prototype.sort stability.
    val byRemainder = ids
        .map { i -> i to (exact.getValue(i) - floor(exact.getValue(i))) }
        .sortedWith(compareByDescending { it.second })
    for (k in byRemainder.indices) {
        if (remaining <= 0) break
        val id = byRemainder[k].first
        out[id] = out.getValue(id) + 1
        remaining--
    }
    return out
}

// Default FPTP amplification.
const val DEFAULT_SEAT_ELASTICITY = 2.6

// THE SEATS CURVE. Neutral reproduces the region's real seats exactly;
// swings gain/shed seats amplified by elasticity, renormalized to the pool.
fun allocateRegionSeats(
    region: StateContest,
    shareByParty: Map<PartyId, Double>,
): Map<PartyId, Int> {
    val seats = region.seats ?: 0
    val baseSeats = region.baselineSeats ?: emptyMap()
    val baseShare = region.baselineShare ?: emptyMap()
    val elasticity = region.seatElasticity ?: DEFAULT_SEAT_ELASTICITY

    val ids = linkedSetOf<PartyId>()
    ids.addAll(baseSeats.keys)
    ids.addAll(shareByParty.keys)
    val raw = linkedMapOf<PartyId, Double>()
    if (region.proportional == true) {
        // Presidential points: a straight proportional split of the pool (web).
        for (p in ids) raw[p] = max(0.0, shareByParty[p] ?: 0.0) * seats
        return largestRemainder(raw, seats)
    }
    for (p in ids) {
        val swing = (shareByParty[p] ?: 0.0) - (baseShare[p] ?: 0.0)
        // Clamp at zero, then renormalize below preserves the pool total.
        raw[p] = max(0.0, (baseSeats[p] ?: 0) + elasticity * swing * seats)
    }
    return largestRemainder(raw, seats)
}

@Serializable
data class SeatsResult(
    val seats: Map<PartyId, Int>,
    val voteShare: Map<PartyId, Double>,
    val seatResults: List<SeatResult>,
    val largestParty: PartyId,
    val hung: Boolean,
    val government: Government,
)

// Every seat-bearing region uses presidential points.
private fun isPresidency(regions: List<StateContest>): Boolean {
    val pools = regions.filter { it.seats != null && it.seats != 0 && it.blocs.isNotEmpty() }
    return pools.isNotEmpty() && pools.all { it.proportional == true }
}

// Replace `units` in place with the national largest-remainder split.
private fun presidentialUnits(nationalVotes: Map<PartyId, Double>, units: MutableMap<PartyId, Int>) {
    val total = units.values.sum()
    val split = largestRemainder(nationalVotes, total)
    for (p in units.keys.toList()) units[p] = split[p] ?: 0
    for (p in split.keys) units[p] = split.getValue(p)
}

// Full multiparty election: vote shares → seats → government call.
fun computeSeatsResult(
    regions: List<StateContest>,
    majority: MajorityRule,
    abstainingParties: List<PartyId> = emptyList(),
    // Optional coalition-compatibility predicate. Omitted: anyone may.
    compatible: ((lead: PartyId, partner: PartyId) -> Boolean)? = null,
): SeatsResult {
    val seats = linkedMapOf<PartyId, Int>()
    val nationalVotes = linkedMapOf<PartyId, Double>()
    var nationalTotal = 0.0
    val seatResults = mutableListOf<SeatResult>()

    for (region in regions) {
        if (region.seats == null || region.blocs.isEmpty()) continue
        val tally = tallyRegion(region)
        val seatsByParty = allocateRegionSeats(region, tally.shareByParty)
        for (p in seatsByParty.keys) seats[p] = (seats[p] ?: 0) + seatsByParty.getValue(p)
        for (p in tally.votesByParty.keys) {
            nationalVotes[p] = (nationalVotes[p] ?: 0.0) + tally.votesByParty.getValue(p)
        }
        nationalTotal += tally.totalVotes

        var winner = ""
        var best = -1
        for (p in seatsByParty.keys) {
            if (seatsByParty.getValue(p) > best) {
                best = seatsByParty.getValue(p)
                winner = p
            }
        }
        seatResults.add(
            SeatResult(
                contestId = region.id,
                name = region.name,
                totalSeats = region.seats,
                seatsByParty = seatsByParty,
                voteShare = tally.shareByParty,
                winner = winner,
            ),
        )
    }

    val voteShare = linkedMapOf<PartyId, Double>()
    for (p in nationalVotes.keys) {
        voteShare[p] = if (nationalTotal > 0) nationalVotes.getValue(p) / nationalTotal else 0.0
    }

    // A presidency's points are the national vote split (web computeSeatsResult).
    if (isPresidency(regions)) presidentialUnits(nationalVotes, seats)

    // Largest party by seats. Under plurality a tie on units goes to the higher
    // national vote share; an exact tie on both keeps the earlier party.
    var largestParty = ""
    var mostSeats = -1
    for (p in seats.keys) {
        if (seats.getValue(p) > mostSeats) {
            mostSeats = seats.getValue(p)
            largestParty = p
        } else if (majority.plurality == true && seats.getValue(p) == mostSeats &&
            (voteShare[p] ?: 0.0) > (voteShare[largestParty] ?: 0.0)
        ) {
            largestParty = p
        }
    }

    val government = formGovernment(seats, majority, abstainingParties, largestParty, compatible)
    val hung = government is Government.Hung || government is Government.Minority ||
        government is Government.Coalition || government is Government.ConfidenceSupply

    return SeatsResult(seats, voteShare, seatResults, largestParty, hung, government)
}

// The government-formation call. Effective threshold accounts for abstaining
// parties + the Speaker.
fun formGovernment(
    seats: Map<PartyId, Int>,
    majority: MajorityRule,
    abstainingParties: List<PartyId>,
    largestParty: PartyId,
    compatible: ((lead: PartyId, partner: PartyId) -> Boolean)? = null,
): Government {
    // Plurality: the largest party wins outright, whatever its share.
    if (majority.plurality == true) {
        val top = seats[largestParty] ?: 0
        return if (top > 0) Government.Majority(party = largestParty, seats = top) else Government.Hung(largest = largestParty)
    }

    val abstainSeats = abstainingParties.sumOf { seats[it] ?: 0 }
    // Effective Commons size after abstentions; majority is half of that + 1.
    val effectiveTotal = majority.total - abstainSeats
    val threshold = majority.effectiveThreshold ?: (floor(effectiveTotal / 2.0).toInt() + 1)

    val lead = seats[largestParty] ?: 0
    if (lead >= threshold) return Government.Majority(party = largestParty, seats = lead)

    // Most natural coalition among willing partners, biggest first. sortedWith
    // is stable, matching Array.prototype.sort stability.
    val partners = seats.keys
        .filter { it != largestParty && !abstainingParties.contains(it) && (compatible?.invoke(largestParty, it) ?: true) }
        .sortedWith(compareByDescending { seats[it] ?: 0 })

    // A two-party coalition that clears the bar.
    for (partner in partners) {
        if (lead + (seats[partner] ?: 0) >= threshold) {
            // A small partner = confidence-and-supply; a large one = coalition.
            return if ((seats[partner] ?: 0) < lead * 0.2) {
                Government.ConfidenceSupply(
                    lead = largestParty, partner = partner,
                    seats = lead + (seats[partner] ?: 0),
                )
            } else {
                Government.Coalition(
                    parties = listOf(largestParty, partner),
                    seats = lead + (seats[partner] ?: 0),
                )
            }
        }
    }

    // Short even with a partner: minority attempt, or genuinely hung.
    if (lead >= threshold * 0.85) return Government.Minority(party = largestParty, seats = lead)
    return Government.Hung(largest = largestParty)
}

// ── Difficulty helpers (web src/engine/multiparty.ts) ─────────────────────

private class OpeningStrength(val seats: Map<PartyId, Int>, val share: Map<PartyId, Double>)

private fun openingStrength(regions: List<StateContest>): OpeningStrength {
    val seats = linkedMapOf<PartyId, Int>()
    val share = linkedMapOf<PartyId, Double>()
    var pool = 0
    for (region in regions) {
        val n = region.seats ?: 0
        pool += n
        for ((p, s) in region.baselineSeats ?: emptyMap()) seats[p] = (seats[p] ?: 0) + s
        for ((p, v) in region.baselineShare ?: emptyMap()) share[p] = (share[p] ?: 0.0) + v * n
    }
    if (pool > 0) for (p in share.keys.toList()) share[p] = share.getValue(p) / pool
    return OpeningStrength(seats, share)
}

// The player's chief rival: most opening seats, then opening share, then id.
fun chiefRival(regions: List<StateContest>, player: PartyId): PartyId? {
    val o = openingStrength(regions)
    var best: PartyId? = null
    for (p in o.share.keys.sorted()) {
        if (p == player) continue
        val b = best
        if (b == null ||
            (o.seats[p] ?: 0) > (o.seats[b] ?: 0) ||
            ((o.seats[p] ?: 0) == (o.seats[b] ?: 0) && o.share.getValue(p) > o.share.getValue(b))
        ) best = p
    }
    return best
}

// Units each party would win with `tilt` logits added to the player's appeal
// wherever the player stands. Reads the regions, never writes them.
private fun unitsWithTilt(regions: List<StateContest>, player: PartyId, tilt: Double): Map<PartyId, Int> {
    val units = linkedMapOf<PartyId, Int>()
    val national = linkedMapOf<PartyId, Double>()
    for (region in regions) {
        if (region.seats == null || region.seats == 0 || region.blocs.isEmpty()) continue
        val stands = region.baselineShare?.containsKey(player) == true
        val votes = linkedMapOf<PartyId, Double>()
        var total = 0.0
        for (bloc in region.blocs) {
            val weight = bloc.size * bloc.turnoutPropensity * bloc.enthusiasm
            val appeal = bloc.appeal ?: emptyMap()
            val camp = bloc.campaignAppeal ?: emptyMap()
            val combined = linkedMapOf<PartyId, Double>()
            for (p in appeal.keys) {
                combined[p] = appeal.getValue(p) + (camp[p] ?: 0.0) + (if (stands && p == player) tilt else 0.0)
            }
            val shares = softmax(combined)
            for (p in shares.keys) votes[p] = (votes[p] ?: 0.0) + weight * shares.getValue(p)
            total += weight
        }
        val share = linkedMapOf<PartyId, Double>()
        for (p in votes.keys) share[p] = if (total > 0) votes.getValue(p) / total else 0.0
        val seats = allocateRegionSeats(region, share)
        for (p in seats.keys) units[p] = (units[p] ?: 0) + seats.getValue(p)
        for (p in votes.keys) national[p] = (national[p] ?: 0.0) + votes.getValue(p)
    }
    if (isPresidency(regions)) presidentialUnits(national, units)
    return units
}

private fun leads(units: Map<PartyId, Int>, player: PartyId): Boolean =
    units.keys.all { it == player || (units[it] ?: 0) < (units[player] ?: 0) }

// The climate tilt that would make the player the largest party (web levelingTilt).
const val MAX_LEVELING_TILT = 1.5
fun levelingTilt(regions: List<StateContest>, player: PartyId): Double {
    if (leads(unitsWithTilt(regions, player, 0.0), player)) return 0.0
    if (!leads(unitsWithTilt(regions, player, MAX_LEVELING_TILT), player)) return MAX_LEVELING_TILT
    var lo = 0.0
    var hi = MAX_LEVELING_TILT
    repeat(20) {
        val mid = (lo + hi) / 2
        if (leads(unitsWithTilt(regions, player, mid), player)) hi = mid else lo = mid
    }
    return hi
}

// Easy-mode climate tilt for a race whose leveling tilt is `level` (web climateTilt).
fun climateTilt(gapShare: Double, gapResidual: Double, level: Double): Double {
    if (gapShare <= 0 || level <= 0) return 0.0
    return max(gapShare * level, level - gapResidual)
}

// Campaign multiplier for `party`: player persuasion, chief rival aiPersuasion, else 1.
fun handicapMultiplier(
    persuasion: Double,
    aiPersuasion: Double,
    regions: List<StateContest>,
    player: PartyId,
    party: PartyId,
): Double {
    if (party == player) return persuasion
    return if (party == chiefRival(regions, player)) aiPersuasion else 1.0
}
