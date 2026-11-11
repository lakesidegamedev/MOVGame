package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.COUNTRIES
import com.lakesidegames.electioneer.content.CONTENT_CATALOG
import com.lakesidegames.electioneer.content.compatible
import com.lakesidegames.electioneer.content.countryGovernmentText
import com.lakesidegames.electioneer.content.getCountry
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

// Country rules used to be hand-ported Kotlin functions. They are now bundle
// data. These are the retired functions, kept verbatim as fixtures, to prove
// the data reproduces them for every party pair and every government kind.
private fun legacyCompatible(country: String, lead: PartyId, partner: PartyId): Boolean = when (country) {
    "AU" -> {
        val rivals = setOf("alp", "lnp")
        if (rivals.contains(lead) && rivals.contains(partner)) false
        else if (lead == "grn" || partner == "grn") lead == "alp" || partner == "alp"
        else if (lead == "ind" || partner == "ind") false
        else !(lead == "onp" || partner == "onp")
    }
    "CA" -> {
        val rivals = setOf("lpc", "cpc")
        if (rivals.contains(lead) && rivals.contains(partner)) false
        else !(partner == "bq" || lead == "bq")
    }
    "DE" -> {
        val pair = setOf(lead, partner)
        !(lead == "afd" || partner == "afd") && !(pair.contains("cdu") && pair.contains("lnk"))
    }
    "FR" -> false
    else -> true
}

private fun legacyGovernmentText(country: String, g: Government, partyName: (PartyId) -> String): String? = when (country) {
    "AU" -> when (g) {
        is Government.Majority -> "${partyName(g.party)} forms majority government with ${g.seats} seats."
        is Government.Coalition -> "${g.parties.map(partyName).joinToString(" and ")} strike a governing agreement (${g.seats} seats)."
        is Government.ConfidenceSupply -> "${partyName(g.lead)} governs with confidence and supply from ${partyName(g.partner)}."
        is Government.Minority -> "${partyName(g.party)} forms minority government, and the crossbench holds the balance of power."
        is Government.Hung -> "Hung parliament: the crossbench decides who governs."
    }
    "FR" -> when (g) {
        is Government.Majority -> "${partyName(g.party)} wins the presidency with ${g.seats} points."
        is Government.Minority -> "${partyName(g.party)} scrapes the narrowest of wins: ${g.seats} points."
        is Government.Hung -> "Dead heat. France recounts through the night; the Republic holds its breath."
        else -> null
    }
    else -> null
}

class CountryRulesTest {
    @Test fun coalitionDataReproducesTheRetiredPredicates() {
        for (code in listOf("AU", "CA", "DE", "FR")) {
            val country = getCountry(code)!!
            val predicate = assertNotNull(country.compatible, code)
            val parties = country.system.parties.map { it.id } + "zzz"
            for (a in parties) for (b in parties) if (a != b) {
                assertEquals(legacyCompatible(code, a, b), predicate(a, b), "$code $a+$b")
            }
        }
    }

    @Test fun governmentTextDataReproducesTheRetiredFunctions() {
        val name = { p: PartyId -> "<$p>" }
        val kinds = listOf(Government.Majority("a", 80), Government.Minority("a", 70),
            Government.Coalition(listOf("a", "b", "c"), 90), Government.ConfidenceSupply("a", "b", 77), Government.Hung("a"))
        for ((code, country) in COUNTRIES) for (g in kinds) {
            assertEquals(legacyGovernmentText(code, g, name), countryGovernmentText(country, g, name), "$code $g")
        }
    }

    @Test fun goalHintsKeepTheirPlaceholdersAndTheDefaultStaysGeneric() {
        val fr = MobileCampaign.start("FR", "2022", "ens", "normal", "goal")
        assertTrue(fr.goalText().startsWith("Win 51 of 100 presidency points."))
        val de = MobileCampaign.start("DE", "2025", "cdu", "normal", "goal")
        assertTrue(de.goalText().startsWith("Reach 316 of 630 seats, alone or in a compatible coalition."))
        val ca = MobileCampaign.start("CA", "2025", "lpc", "normal", "goal")
        assertEquals("Reach 172 of 343 seats. A hung parliament can produce a coalition, confidence and supply, or minority government.", ca.goalText())
    }

    @Test fun everyCatalogCountryLoadsAndCountryBundlesMatchTheCatalog() {
        val multiparty = CONTENT_CATALOG.countries.filter { it.engine == "country" }.map { it.id }
        assertEquals(multiparty, COUNTRIES.keys.toList())
        for (c in CONTENT_CATALOG.countries) {
            assertEquals(2, c.dailyPair.size, c.id)
            assertTrue(c.dailyPair.all { it in c.roleNames }, c.id)
            assertNotNull(NativeCatalog.pack(c.packId), c.id)
            assertTrue(nativeElections.any { it.country == c.id }, c.id)
        }
        assertNull(getCountry("US"))
    }
}
