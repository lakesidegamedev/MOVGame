package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.SCENARIOS
import com.lakesidegames.electioneer.content.SCENARIO_IDS
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

// Mirror of src/engine/__tests__/electoral-college.test.ts.
class ElectoralCollegeTest {
    // A 48-state college, as in 1912 to 1956: 1960's map without Alaska and Hawaii.
    private fun college531(seed: String = "ec531"): GameState {
        val game = createGame(NewGameOptions(seed = seed, scenario = "1960"))
        return game.copy(states = game.states.filter { it.id != "AK" && it.id != "HI" })
    }

    private fun forceMap(game: GameState, demIds: Set<String>) {
        for (st in game.states) {
            val dem = st.id in demIds || st.aggregateOf.orEmpty().any { it in demIds }
            for (b in st.blocs) b.campaignMargin = if (dem) 6.0 else -6.0
        }
    }

    @Test
    fun majorityIsDerivedFromTheTotal() {
        assertEquals(270, evMajority(538))
        assertEquals(269, evMajority(537))
        assertEquals(266, evMajority(531))
        assertEquals(538, evTotalOf(emptyList()))
    }

    @Test
    fun in531A266IsAWinAnd265To265GoesToTheHouse() {
        assertEquals("dem", electoralWinner(mapOf("dem" to 266, "rep" to 265), 531))
        assertEquals("rep", electoralWinner(mapOf("dem" to 265, "rep" to 266), 531))
        assertEquals("tie", electoralWinner(mapOf("dem" to 265, "rep" to 265), 531))
        assertEquals("265-265", noMajorityTally(mapOf("dem" to 265, "rep" to 265)))
        assertEquals("dem", electoralWinner(mapOf("dem" to 270, "rep" to 268), 538))
        assertEquals("tie", electoralWinner(mapOf("dem" to 269, "rep" to 269), 538))
        val facts = usScoreFacts(mapOf("dem" to 265, "rep" to 265), mapOf("dem" to 0.5, "rep" to 0.5), CandidateId.DEM, "normal", 531)
        assertEquals(-1.0, facts.unitMargin)
        assertEquals(531, facts.chamberSize)
    }

    @Test
    fun everyScenarioDeclaresItsCollegeAndTheMapMatches() {
        for (id in SCENARIO_IDS) {
            val college = assertNotNull(SCENARIOS.getValue(id).electoralCollege, "$id declares electoralCollege")
            val game = createGame(NewGameOptions(seed = "ec", scenario = id))
            val ids = game.states.map { it.id }.toSet()
            for (absent in college.absent.orEmpty()) assertFalse(absent in ids, "$id leaves out $absent")
            assertEquals(college.total, game.electoralRule().total, "$id total")
        }
    }

    @Test
    fun nineteenSixtyIs537WithNoDc() {
        val game = createGame(NewGameOptions(seed = "1960", scenario = "1960"))
        fun ev(id: String) = game.states.first { it.id == id }.electoralVotes
        assertFalse(game.states.any { it.id == "DC" })
        assertEquals(5, ev("ME-1") + ev("ME-2") + ev("ME-AL"))
        assertEquals(6, ev("NE-1") + ev("NE-2") + ev("NE-3") + ev("NE-AL"))
        assertEquals(3, ev("AK"))
        assertEquals(3, ev("HI"))
        assertEquals(ElectoralRule(537, 269), game.electoralRule())
        val r = computeResult(game)
        assertEquals(537, r.electoralVotes.values.sum())
        assertEquals("dem", r.winner)
    }

    @Test
    fun a266WinIsAWinEndToEnd() {
        val game = college531()
        assertEquals(ElectoralRule(531, 266), game.electoralRule())
        forceMap(game, setOf("CA", "NY", "PA", "IL", "OH", "TX", "MI", "MA", "NJ", "NC", "GA", "NV"))
        val r = computeResult(game)
        assertEquals(531, r.electoralVotes.values.sum())
        assertEquals(266, r.electoralVotes.getValue("dem"))
        assertEquals("dem", r.winner)

        val facts = usScoreFacts(r.electoralVotes, r.popularShare, CandidateId.DEM, "normal")
        assertEquals(0.0, facts.unitMargin)
        assertEquals(531, facts.chamberSize)
        val nailbiter = ACHIEVEMENTS.first { it.id == "nailbiter" }
        assertTrue(nailbiter.check(AchievementContext(r, game, CandidateId.DEM, "normal")))

        game.result = r
        game.phase = GamePhase.RESULT
        val reveal = assertNotNull(NativeReveal.data(saveGame(game, "ec531")))
        assertEquals(531, reveal.totalUnits)
        assertEquals(266, reveal.threshold)
        assertEquals("265-265: ELECTION GOES TO THE HOUSE", reveal.noMajorityLabel)
    }

    @Test
    fun electionsBefore1960ReproduceTheirRealMaps() {
        // Mirror of src/engine/__tests__/us-historical.test.ts.
        val history = listOf(Triple("1956", 74, 457), Triple("1952", 89, 442), Triple("1948", 304, 227))
        for ((id, dem, rep) in history) {
            val game = createGame(NewGameOptions(seed = "calibration", scenario = id))
            assertEquals(ElectoralRule(531, 266), game.electoralRule(), id)
            for (absent in listOf("AK", "HI", "DC")) assertFalse(game.states.any { it.id == absent }, "$id $absent")
            val r = computeResult(game)
            assertEquals(mapOf("dem" to dem, "rep" to rep), r.electoralVotes, id)
        }
        val r48 = computeResult(createGame(NewGameOptions(seed = "dixiecrat", scenario = "1948")))
        for (id in listOf("AL", "LA", "MS", "SC")) assertEquals(CandidateId.REP, r48.stateResults.first { it.stateId == id }.winner, "1948 $id")
        for (id in listOf("TN", "OH", "CA", "IL")) assertEquals(CandidateId.DEM, r48.stateResults.first { it.stateId == id }.winner, "1948 $id")
    }

    @Test
    fun aThirdCandidatesStatesFoldIntoOneTicket() {
        // 1968 handling: Wallace's Deep South folds into the Republican column.
        val r = computeResult(createGame(NewGameOptions(seed = "wallace", scenario = "1968")))
        for (id in listOf("AL", "GA", "LA", "MS")) assertEquals(CandidateId.REP, r.stateResults.first { it.stateId == id }.winner, "1968 $id")
        assertEquals(538, r.electoralVotes.values.sum())
        assertEquals("rep", r.winner)
    }
}
