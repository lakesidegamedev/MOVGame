package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.NativeArt
import kotlin.test.*

class NativeArtTest {
    @Test fun portraitsAndLogosFollowTheWebTables() {
        assertEquals("fr-francois-mitterrand.webp", NativeArt.portrait("François Mitterrand"))
        assertNull(NativeArt.portrait("Nobody In Particular"))
        assertNull(NativeArt.portrait(null))
        assertNotNull(NativeArt.logo("US", "dem", "2024"))
        assertNull(NativeArt.logo("US", "dem", "2028"))
        assertTrue(NativeArt.logo("UK", "con", "1974feb")!!.contains("1980s"))
        assertNull(NativeArt.logo("UK", "con", "custom"))
        assertEquals(1974, NativeArt.electionYear("1974oct"))
    }

    @Test fun everyShownImageHasACredit() {
        val credited = NativeArt.portraitCredits().map { it.name }.toSet()
        assertTrue(credited.contains("François Mitterrand"))
        assertTrue(NativeArt.logoCredits().isNotEmpty())
        assertTrue(NativeArt.logoCredits().all { it.source.startsWith("https://commons.wikimedia.org/") && it.license.isNotBlank() })
    }

    @Test fun aCampaignFindsItsLeadersPhotoAndPartyLogo() {
        val uk = MobileCampaign.start("UK", "2024", "lab", "normal", "art")
        assertEquals("Keir Starmer", uk.leaderName("lab"))
        assertNotNull(uk.portrait("lab"))
        assertNotNull(uk.logo("lab"))
    }
}
