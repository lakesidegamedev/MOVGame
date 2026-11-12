package com.lakesidegames.electioneer.engine

import kotlin.test.*

// Read-only accessors the iOS library, setup and results screens use.
class NativeReadAccessorsTest {
    @Test fun electionsCarryRegistryDifficulty() {
        val all = MobileCampaign.countries().flatMap { MobileCampaign.elections(it.id) }
        assertTrue(all.all { it.difficulty in setOf("easy", "medium", "hard") })
        assertTrue(all.map { it.difficulty }.toSet().size > 1)
    }

    @Test fun usElectoralRuleFollowsTheScenario() {
        assertEquals(ElectoralRule(538, 270), MobileGame.electoralRule("2024"))
        assertEquals(ElectoralRule(531, 266), MobileGame.electoralRule("1948"))
        val game = MobileGame.startConfiguredGame("1948", "dem", MobileGame.mates("1948", "dem").first().id,
            emptyList(), "normal", "historical", 9, "accessor", "", false, false)
        assertEquals(MobileGame.electoralRule("1948"), ElectoralRule(game.evTotal(), game.evMajority()))
    }

    @Test fun pregameGoalLineMatchesTheStartedCampaign() {
        for (country in MobileCampaign.countries().filter { it.id != "US" }) {
            for (election in MobileCampaign.elections(country.id)) {
                val party = MobileCampaign.parties(country.id, election.nativeId).first()
                val game = MobileCampaign.start(country.id, election.nativeId, party.id, "normal", "accessor")
                assertEquals(game.goalLine(), MobileCampaign.goalLine(country.id, election.nativeId), election.scenarioId)
            }
        }
        assertEquals("Most points wins: finish ahead of every rival", MobileCampaign.goalLine("MX", "2024"))
    }

    @Test fun regionalReachMatchesTheWebForSpain() {
        assertEquals(NativeRegionalReach(listOf("Catalonia"), 48, 350, 15), MobileCampaign.regionalReach("ES", "2019", "erc"))
        assertEquals(NativeRegionalReach(listOf("Basque Country", "Navarre & La Rioja"), 27, 350, 4),
            MobileCampaign.regionalReach("ES", "2019", "bil"))
        assertNull(MobileCampaign.regionalReach("ES", "2019", "psoe"))
        assertNull(MobileCampaign.regionalReach("UK", "2024", "snp"))
        val party = MobileCampaign.parties("ES", "2019").first { it.id == "pnv" }
        val game = MobileCampaign.start("ES", "2019", party.id, "normal", "accessor")
        assertEquals(MobileCampaign.regionalReach("ES", "2019", "pnv"), game.regionalReach())
        assertNull(MobileCampaign.start("ES", "2019", "pp", "normal", "accessor").regionalReach())
    }
}
