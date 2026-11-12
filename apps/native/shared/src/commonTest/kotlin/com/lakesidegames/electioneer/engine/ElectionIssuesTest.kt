package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

// Per-election issues reach the native engine: a game shows only its own
// election's issues, under that year's names (web electionIssues tests).
class ElectionIssuesTest {
    @Test
    fun usGameCarriesOnlyItsElectionsIssues() {
        val game = createGame(NewGameOptions(seed = "issues-1932", scenario = "1932"))
        assertFalse(IssueId.COVID_RESPONSE.serial in game.issues)
        assertEquals(0.0, game.salience.getValue(IssueId.COVID_RESPONSE.serial))
        assertEquals("The Depression", game.issues.getValue("economy").name)
        assertEquals(game.issues.keys.toList(), game.liveIssueIds().map { it.serial })
    }

    @Test
    fun pandemicModeAddsAYearNeutralIssue() {
        val game = createGame(NewGameOptions(seed = "issues-1932p", scenario = "1932", modifiers = GameModifiers(pandemic = true)))
        assertEquals("Pandemic Response", game.issues.getValue(IssueId.COVID_RESPONSE.serial).name)
        assertEquals(0.85, game.salience.getValue(IssueId.COVID_RESPONSE.serial))
    }

    @Test
    fun countryAndUkCampaignsListTheirElectionsIssues() {
        val de = MobileCampaign.start("DE", "1990", "cdu", "normal", "issues-de").issues()
        assertTrue(de.any { it.id == "unity" })
        assertTrue(de.none { it.blurb.contains("Ukraine") })
        val uk = MobileCampaign.start("UK", "1951", "lab", "normal", "issues-uk").issues()
        assertTrue(uk.any { it.id == "nationalisation" })
        assertTrue(uk.none { it.id == "climate" || it.id == "europe" })
    }
}
