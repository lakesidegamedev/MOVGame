package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.CONTENT_CATALOG
import kotlinx.serialization.Serializable

data class NativeDailyAssignment(val date: String, val scenarioId: String, val seed: String, val role: String,
    val countryId: String, val electionId: String, val label: String, val flag: String, val roleName: String)

class NativeDaily private constructor() {
    companion object {
        // Each country module's daily pairing, from the exported catalog.
        private val pairs: Map<String, List<String>> by lazy { CONTENT_CATALOG.countries.associate { it.id to it.dailyPair } }
        // Role ids are shared across countries; the first registered name wins (web lib/daily.ts).
        private val names: Map<String, String> by lazy {
            val out = linkedMapOf<String, String>()
            for (c in CONTENT_CATALOG.countries) for ((role, name) in c.roleNames) out.getOrPut(role) { name }
            out
        }

        fun roleName(role: String): String = names[role] ?: role.uppercase()

        fun assignment(dateUTC: String): NativeDailyAssignment {
            require(Regex("\\d{4}-\\d{2}-\\d{2}").matches(dateUTC))
            // Use the exported registry's order, exactly as web and server do.
            val meta = nativeElections[(Rng.hashSeed("daily:$dateUTC") % nativeElections.size).toInt()]
            val role = pairs.getValue(meta.country)[(Rng.hashSeed("role:$dateUTC:${meta.scenarioId}") % 2).toInt()]
            return NativeDailyAssignment(dateUTC, meta.scenarioId, "daily-$dateUTC", role,
                meta.country, meta.nativeId, meta.label, meta.flag, names.getValue(role))
        }

        fun matches(dateUTC: String, scenarioId: String, seed: Long, role: String): Boolean {
            val today = assignment(dateUTC)
            return today.scenarioId == scenarioId && seed == Rng.hashSeed(today.seed) && role == today.role
        }

        fun matchesUs(dateUTC: String, game: GameState): Boolean = matches(dateUTC,
            nativeElections.firstOrNull { it.country == "US" && it.nativeId == game.scenarioId }?.scenarioId ?: "",
            game.seed, game.playerCandidate.serial)

        fun nextStreak(dateUTC: String, yesterdayUTC: String, lastPlayed: String?, streak: Int): Int =
            when (lastPlayed) { dateUTC -> streak; yesterdayUTC -> streak + 1; else -> 1 }
    }
}

@Serializable
data class NativeScoreSubmission(val scenarioId: String, val difficulty: String, val score: Int,
    val facts: ScoreFacts, val playerSide: String, val electoralVotes: Map<String, Int>? = null,
    val popularShare: Map<String, Double>? = null, val seats: Map<String, Int>? = null,
    val voteShare: Map<String, Double>? = null, val evMargin: Int, val popularVoteMargin: Double,
    val turnsPlayed: Int)
