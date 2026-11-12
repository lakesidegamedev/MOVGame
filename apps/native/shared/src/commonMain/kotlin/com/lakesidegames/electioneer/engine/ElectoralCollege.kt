package com.lakesidegames.electioneer.engine

import kotlinx.serialization.Serializable

// Electoral college: per-election size and majority. Port of
// src/engine/electoralCollege.ts. The college was 531 from 1912 to 1956 and
// 537 in 1960. A scenario declares its total and the contests that cast no
// electoral votes; those are left out of the game, so the total is the sum of
// the contests that remain and the majority is floor(total / 2) + 1.

// The modern map: 50 states plus DC.
const val STANDARD_EV_TOTAL = 538

@Serializable
data class ElectoralCollege(
    // The year's real electoral vote total (538, 537, 531, ...).
    val total: Int,
    // Contest ids that cast no electoral votes that year.
    val absent: List<String>? = null,
)

data class ElectoralRule(val total: Int, val majority: Int)

fun evMajority(total: Int): Int = total / 2 + 1

// The college a list of vote totals forms; the modern map when empty.
fun evTotalOf(votes: Iterable<Int>): Int {
    val total = votes.sum()
    return if (total > 0) total else STANDARD_EV_TOTAL
}

fun electoralRuleOf(votes: Iterable<Int>): ElectoralRule {
    val total = evTotalOf(votes)
    return ElectoralRule(total, evMajority(total))
}

fun GameState.electoralRule(): ElectoralRule = electoralRuleOf(states.map { it.electoralVotes })

// Majority for a game's college, callable without an extension import.
fun evMajorityOf(game: GameState): Int = game.electoralRule().majority

fun GameResult.electoralRule(): ElectoralRule = electoralRuleOf(stateResults.map { it.electoralVotes })

// Winner of the college: whoever reaches the majority. Short of it (269 to
// 269, or 265 to 265 with an elector unpledged) the House decides: "tie".
fun electoralWinner(ev: Map<String, Int>, total: Int): String {
    val majority = evMajority(total)
    return when {
        (ev[CandidateId.DEM.serial] ?: 0) >= majority -> CandidateId.DEM.serial
        (ev[CandidateId.REP.serial] ?: 0) >= majority -> CandidateId.REP.serial
        else -> "tie"
    }
}

// Display line for a college with no majority, e.g. "269-269" or "265-265".
fun noMajorityTally(ev: Map<String, Int>): String =
    "${ev[CandidateId.DEM.serial] ?: 0}-${ev[CandidateId.REP.serial] ?: 0}"
