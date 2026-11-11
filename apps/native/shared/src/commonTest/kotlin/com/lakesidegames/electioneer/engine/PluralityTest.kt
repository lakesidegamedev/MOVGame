package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.getCountry
import kotlinx.serialization.Serializable
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@Serializable private data class PluralityOutcome(val seats: Map<String, Int>, val voteShare: Map<String, Double>,
    val largestParty: String, val hung: Boolean, val government: Government)
@Serializable private data class StrictOutcome(val largestParty: String, val hung: Boolean, val government: Government)
@Serializable private data class PluralitySeatCase(val name: String, val regions: List<StateContest>, val majority: MajorityRule,
    val plurality: PluralityOutcome, val majorityRule: StrictOutcome, val facts: Map<String, ScoreFacts>,
    val reveal: NativeRevealData, val schedule: NativeRevealSchedule)
@Serializable private data class PluralityGame(val country: String, val election: String, val party: String, val seed: String,
    val seats: Map<String, Int>, val voteShare: Map<String, Double>, val largestParty: String, val hung: Boolean,
    val government: Government, val facts: ScoreFacts)
@Serializable private data class PluralityVectors(val seatCases: List<PluralitySeatCase>, val games: List<PluralityGame>)

private fun assertShares(expected: Map<String, Double>, actual: Map<String, Double>, where: String) {
    assertEquals(expected.keys, actual.keys, where)
    for ((p, v) in expected) assertTrue(abs(v - actual.getValue(p)) < 1e-9, "$where $p: $v != ${actual[p]}")
}

private fun assertFacts(expected: ScoreFacts, actual: ScoreFacts, where: String) {
    assertEquals(expected.unitMargin, actual.unitMargin, where)
    assertEquals(expected.chamberSize, actual.chamberSize, where)
    assertTrue(abs(expected.popularMargin - actual.popularMargin) < 1e-9, "$where popular margin")
    assertEquals(computeScoreFromFacts(expected), computeScoreFromFacts(actual), "$where score")
}

// The plurality win rule (most units wins, no threshold, no coalition step)
// must give the same winner, margin, score and election-night call as the web.
class PluralityTest {
    private val vectors = EngineJson.decodeFromString<PluralityVectors>(PLURALITY_WEB_VECTORS)

    @Test fun seatCasesMatchTheWeb() {
        assertEquals(4, vectors.seatCases.size)
        for (case in vectors.seatCases) {
            val plural = computeSeatsResult(case.regions, case.majority.copy(plurality = true))
            assertEquals(case.plurality.seats, plural.seats, case.name)
            assertShares(case.plurality.voteShare, plural.voteShare, case.name)
            assertEquals(case.plurality.largestParty, plural.largestParty, case.name)
            assertEquals(case.plurality.government, plural.government, case.name)
            assertEquals(case.plurality.hung, plural.hung, case.name)
            // Same inputs under the strict majority rule: nobody reaches 51.
            val strict = computeSeatsResult(case.regions, case.majority)
            assertEquals(case.majorityRule.government, strict.government, case.name)
            assertEquals(case.majorityRule.hung, strict.hung, case.name)
            for ((party, facts) in case.facts) {
                assertFacts(facts, multipartyScoreFacts(plural.seats, plural.voteShare, party, case.majority.threshold,
                    case.majority.total, "normal", true), "${case.name} $party")
            }
            assertEquals(case.schedule, NativeReveal.schedule(case.reveal), case.name)
            assertEquals(plural.largestParty, NativeReveal.schedule(case.reveal).projectedId, case.name)
        }
    }

    @Test fun nearTieAndTieBreaksAreDeterministic() {
        val byName = vectors.seatCases.associateBy { it.name }
        // 36 to 35: the winner is far below half and still wins outright.
        val near = byName.getValue("near tie").plurality
        assertEquals("pan", near.largestParty)
        assertEquals(Government.Majority("pan", 36), near.government)
        assertTrue((near.voteShare.getValue("pan") - near.voteShare.getValue("prd")) * 100 < 1.0)
        // Tie on units: the larger national vote wins.
        assertEquals("prd", byName.getValue("units tie broken by vote share").plurality.largestParty)
        // Tie on units and votes: the earlier party in result order wins.
        assertEquals("prd", byName.getValue("exact tie broken by result order").plurality.largestParty)
        // The margin is the lead over the strongest rival, so a tie scores zero.
        assertEquals(0.0, byName.getValue("units tie broken by vote share").facts.getValue("pan").unitMargin)
    }

    @Test fun fullCampaignsUnderTheFlagMatchTheWeb() {
        assertEquals(3, vectors.games.size)
        for (v in vectors.games) {
            val bundle = getCountry(v.country)!!.copy(plurality = true)
            var g = createCountryGame(bundle, NewCountryGameOptions(seed = v.seed, election = v.election, playerParty = v.party,
                difficulty = "normal"))
            var guard = 0
            while (g.phase != "result" && guard++ < 12) g = countryAdvanceTurn(g, bundle, CountryAdvanceOptions(autoResolvePlayerEvents = true))
            val r = g.result!!
            assertEquals(v.seats, r.seats, v.party)
            assertShares(v.voteShare, r.voteShare, v.party)
            assertEquals(v.largestParty, r.largestParty, v.party)
            assertEquals(v.government, r.government, v.party)
            assertEquals(v.hung, r.hung, v.party)
            val maj = majorityFor(g, bundle)
            assertEquals(true, maj.plurality)
            assertFacts(v.facts, multipartyScoreFacts(r.seats, r.voteShare, v.party, maj.threshold, maj.total, "normal", true), v.party)
        }
    }

    @Test fun majorityCountriesNeverCarryTheFlag() {
        for (code in listOf("CA", "DE", "FR", "AU")) {
            val bundle = getCountry(code)!!
            assertEquals(false, bundle.plurality, code)
            val g = createCountryGame(bundle, NewCountryGameOptions(seed = 7))
            assertEquals(null, majorityFor(g, bundle).plurality, code)
        }
    }
}
