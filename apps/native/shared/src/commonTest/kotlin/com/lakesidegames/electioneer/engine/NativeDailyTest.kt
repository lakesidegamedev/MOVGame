package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class NativeDailyTest {
    @Test
    fun utcAssignmentsMatchWebAcrossEveryCountry() {
        // Two years of dates evaluated by src/lib/daily.ts (export-daily-percentiles.ts).
        val vectors = EngineJson.decodeFromString<List<List<String>>>(DAILY_ASSIGNMENT_WEB_VECTORS)
        assertEquals(730, vectors.size)
        for ((date, scenario, role) in vectors) {
            val assignment = NativeDaily.assignment(date)
            assertEquals(scenario, assignment.scenarioId, date)
            assertEquals(role, assignment.role, date)
            assertEquals("daily-$date", assignment.seed)
            assertTrue(NativeDaily.matches(date, scenario, Rng.hashSeed(assignment.seed), role))
            assertFalse(NativeDaily.matches(date, scenario, Rng.hashSeed("other-seed"), role))
            assertFalse(NativeDaily.matches(date, scenario, Rng.hashSeed(assignment.seed), "other-party"))
        }
        // Every registered country comes up in the rotation.
        assertEquals(MobileCampaign.countries().map { it.id }.toSet(),
            vectors.map { v -> nativeElections.first { it.scenarioId == v[1] }.country }.toSet())
    }

    @Test
    fun classicDaysKeepTheirOriginalScenario() {
        // Pinned before New Zealand joined: these dates are classic days and
        // must keep the scenario they always had.
        val pinned = listOf(
            Triple("2026-01-01", "us-1968", "dem"), Triple("2026-01-02", "fr-2017", "rn"),
            Triple("2026-01-03", "uk-1992", "con"), Triple("2026-01-05", "de-2017", "spd"),
            Triple("2026-01-08", "ca-2015", "cpc"), Triple("2026-01-14", "au-2022", "alp"),
            Triple("2026-09-30", "us-2008", "dem"), Triple("2026-10-01", "uk-2005", "con"),
            Triple("2025-12-31", "fr-2027", "rn"),
        )
        for ((date, scenario, role) in pinned) {
            if (NativeDaily.isAddedDay(date, nativeElections.size, nativeElections.size - NativeDaily.CLASSIC_POOL_SIZE)) continue
            val assignment = NativeDaily.assignment(date)
            assertEquals(scenario, assignment.scenarioId, date)
            assertEquals(role, assignment.role, date)
        }
    }

    @Test
    fun dailyIdentitySurvivesRestoringBothCampaignTypes() {
        val added = EngineJson.decodeFromString<List<List<String>>>(DAILY_ASSIGNMENT_WEB_VECTORS)
            .first { v -> nativeElections.indexOfFirst { it.scenarioId == v[1] } >= NativeDaily.CLASSIC_POOL_SIZE }[0]
        for (date in listOf("2026-09-30", "2026-01-02", "2026-01-03", "2026-01-05", "2026-01-08", "2026-01-14", added)) {
            val day = NativeDaily.assignment(date)
            if (day.countryId == "US") {
                val mate = MobileGame.mates(day.electionId, day.role).first { it.historical }
                val game = MobileGame.startConfiguredGame(day.electionId, day.role, mate.id, emptyList(), "normal",
                    "historical", 9, day.seed, "", false, false)
                assertTrue(MobileGame.restore(game.saveSnapshot())!!.isDaily(date))
            } else {
                val game = MobileCampaign.start(day.countryId, day.electionId, day.role, "normal", day.seed)
                assertTrue(MobileCampaign.restore(game.saveSnapshot())!!.isDaily(date))
            }
        }
    }

    @Test
    fun completedScoresCarryTheRawFactsRequiredByServerValidation() {
        val us = createGame(NewGameOptions(seed = 1))
        us.result = computeResult(us); us.phase = GamePhase.RESULT; us.turn = us.totalTurns
        val raw = assertNotNull(NativeResults.submission(us, "hard"))
        val submission = EngineJson.decodeFromString<NativeScoreSubmission>(raw)
        assertEquals("us-2020", submission.scenarioId)
        assertEquals(538, submission.electoralVotes!!.values.sum())
        assertNotNull(submission.popularShare)
        assertEquals("hard", submission.difficulty)
        assertEquals(computeScoreFromFacts(submission.facts), submission.score)
        assertNull(NativeResults.submission(us, null))
        assertNull(NativeResults.submission(us.copy(totalTurns = 5), "normal"))
        for (country in MobileCampaign.countries().map { it.id }.filter { it != "US" }) {
            val election = MobileCampaign.elections(country).first().nativeId
            val party = MobileCampaign.parties(country, election).first().id
            val game = MobileCampaign.start(country, election, party, "normal", "score-contract")
            assertNull(game.scoreSubmission())
            while (!game.isOver()) {
                if (game.hasPendingEvent()) game.answerEvent(game.eventChoices().first().id)
                else game.endWeek()
            }
            val score = EngineJson.decodeFromString<NativeScoreSubmission>(game.scoreSubmission()!!)
            assertEquals(game.totalUnits(), score.seats!!.values.sum())
            assertNotNull(score.voteShare)
            assertEquals(game.totalUnits(), score.facts.chamberSize)
            assertEquals(computeScoreFromFacts(score.facts), score.score)
        }
    }

    @Test
    fun streaksCountFinishedUtcDaysOnce() {
        assertEquals(4, NativeDaily.nextStreak("2026-10-01", "2026-09-30", "2026-09-30", 3))
        assertEquals(4, NativeDaily.nextStreak("2026-10-01", "2026-09-30", "2026-10-01", 4))
        assertEquals(1, NativeDaily.nextStreak("2026-10-01", "2026-09-30", "2026-09-29", 3))
    }
}
