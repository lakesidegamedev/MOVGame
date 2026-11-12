package com.lakesidegames.electioneer.billing

import com.lakesidegames.electioneer.engine.MobileCampaign
import com.lakesidegames.electioneer.engine.NativeCatalog
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PlayGateTest {
    private val countryPacks = NativeCatalog.packs().filter { !it.legacy && it.id != "complete" }.map { it.id }
    private val allSellable = PlayGate(true, (countryPacks + "complete").toSet())

    private fun catalog(gating: Boolean?, google: Boolean?, purchasesEnabled: Boolean = true, products: String? = null): String {
        val rows = products ?: (countryPacks + "complete").joinToString(",") {
            """{"packId":"$it","appleSku":"apple.$it","googleSku":"play.$it","purchasable":{"apple":true,"google":true}}"""
        }
        val stores = google?.let { ""","stores":{"apple":true,"google":$it}""" } ?: ""
        val flag = gating?.let { ""","nativeGating":$it""" } ?: ""
        return """{"sharedOwnership":true,"purchasesEnabled":$purchasesEnabled$stores$flag,"products":[$rows]}"""
    }

    private fun PlayGate.lock(country: String, id: String, packs: Set<String> = emptySet(), scenarios: Set<String> = emptySet(), daily: String? = null) =
        lockedPack(country, id, packs, scenarios, daily)

    @Test fun gatingOffOrMissingLocksNothing() {
        for (json in listOf(catalog(false, true), catalog(null, true), catalog(null, null))) {
            val server = PlayGate.fromServer(json)
            assertEquals(PlayGate.OPEN, server.gate, json)
            assertNull(server.gate.lock("US", "2016"))
            assertNull(server.gate.lock("UK", "1997"))
        }
        assertNull(PlayGate.OPEN.lock("CA", "2021"))
    }

    @Test fun gatingOnWithoutAReadyPlayStoreLocksNothing() {
        assertEquals(PlayGate.OPEN, PlayGate.fromServer(catalog(true, false)).gate)
        // An older server without per-store flags falls back to purchasesEnabled.
        assertEquals(PlayGate.OPEN, PlayGate.fromServer(catalog(true, null, purchasesEnabled = false)).gate)
        assertTrue(PlayGate.fromServer(catalog(true, null, purchasesEnabled = true)).gate.gating)
        // No Play SKUs at all, or an unreadable answer, keeps everything open.
        assertEquals(PlayGate.OPEN, PlayGate.fromServer(catalog(true, true, products = """{"packId":"canada","appleSku":"a","googleSku":null}""")).gate)
        assertEquals(PlayGate.OPEN, PlayGate.fromServer("not json").gate)
        assertEquals(PlayGate.OPEN, PlayGate.fromServer("[]").gate)
        assertEquals(PlayGate.OPEN, PlayGate.fromServer("""{"nativeGating":"true","stores":{"google":"true"}}""").gate)
    }

    @Test fun gatingOnLocksOnlyPacksPlayCanSell() {
        val server = PlayGate.fromServer(catalog(true, true, products = listOf(
            """{"packId":"uk-elections","googleSku":"play.uk","purchasable":{"apple":true,"google":true}}""",
            """{"packId":"canada","googleSku":"play.ca","purchasable":{"apple":true,"google":false}}""",
            """{"packId":"germany","googleSku":"","purchasable":{"google":true}}""",
            """{"packId":"france","googleSku":"play.fr"}""",
            """{"packId":"not-a-pack","googleSku":"play.x","purchasable":{"google":true}}""",
        ).joinToString(",")))
        assertEquals(mapOf("play.uk" to "uk-elections", "play.fr" to "france"), server.skus)
        val gate = server.gate
        assertTrue(gate.gating)
        assertEquals("uk-elections", gate.lock("UK", "1997"))
        assertEquals("france", gate.lock("FR", "2017"))
        assertNull(gate.lock("CA", "2021"), "Play cannot sell Canada yet")
        assertNull(gate.lock("DE", "2021"), "Germany has no Play SKU")
        assertNull(gate.lock("US", "2016"), "The United States pack is not on Play")
    }

    @Test fun aPackWhoseProductDidNotLoadOnThisDeviceStaysOpen() {
        val gate = PlayGate.fromServer(catalog(true, true)).gate
        assertEquals("us-historical", gate.lock("US", "2016"))
        val device = gate.onDevice(setOf("uk-elections"))
        assertEquals("uk-elections", device.lock("UK", "1997"))
        assertNull(device.lock("US", "2016"))
        assertEquals(PlayGate.OPEN, gate.onDevice(emptySet()), "Play unavailable on this device")
    }

    @Test fun theFreeElectionOfEveryCountryAndTheDailyAlwaysOpen() {
        for (country in NativeCatalog.countryIds()) {
            val elections = MobileCampaign.elections(country)
            val free = elections.filter { it.free }
            assertTrue(free.isNotEmpty(), "$country has a free election")
            free.forEach { assertNull(allSellable.lock(country, it.nativeId), it.scenarioId) }
            val paid = elections.filter { !it.free }
            assertTrue(paid.isNotEmpty(), "$country sells something")
            paid.forEach { assertEquals(it.packId, allSellable.lock(country, it.nativeId), it.scenarioId) }
        }
        assertNull(allSellable.lock("UK", "1997", daily = "uk-1997"))
        assertNull(allSellable.lock("UK", "unknown-election"))
    }

    @Test fun ownershipThroughEveryRouteOpens() {
        // Lakeside account, Google Play, App Store and the Supporter perk all
        // arrive as owned pack ids in the shared wallet.
        assertNull(allSellable.lock("US", "2016", packs = setOf("us-historical")))
        assertNull(allSellable.lock("UK", "1997", packs = setOf("uk-elections")))
        assertEquals("canada", allSellable.lock("CA", "2021", packs = setOf("uk-elections")))
        // Complete Collection opens every paid election in every country.
        for (country in NativeCatalog.countryIds()) MobileCampaign.elections(country).forEach {
            assertNull(allSellable.lock(country, it.nativeId, packs = setOf("complete")), it.scenarioId)
        }
        // The retired Global pack opens its frozen list and nothing else.
        assertNull(allSellable.lock("AU", "2019", packs = setOf("global")))
        assertEquals("us-historical", allSellable.lock("US", "1980", packs = setOf("global")))
        // Scenario unlocks on the account (codes, web purchases) open too.
        assertNull(allSellable.lock("US", "2016", scenarios = setOf("us-2016")))
        assertEquals("us-historical", allSellable.lock("US", "2012", scenarios = setOf("us-2016")))
    }

    @Test fun countryCodesMatchWhateverTheCase() {
        assertEquals("uk-elections", allSellable.lock("uk", "1997"))
        assertNull(allSellable.lock("uk", "1997", scenarios = setOf("uk-1997")))
        assertFalse(PlayGate.OPEN.gating)
    }
}
