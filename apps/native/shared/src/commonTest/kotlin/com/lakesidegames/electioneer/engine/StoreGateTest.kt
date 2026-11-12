package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class StoreGateTest {
    private val countryPacks = NativeCatalog.packs().filter { !it.legacy && it.id != "complete" }.map { it.id }
    private val allSellable = StoreGate(true, (countryPacks + "complete").toSet())
    private val stores = listOf(StoreGate.GOOGLE, StoreGate.APPLE)
    private fun other(store: String) = if (store == StoreGate.GOOGLE) StoreGate.APPLE else StoreGate.GOOGLE

    /** A catalog where [store]'s readiness is [ready] and the other store is always ready. */
    private fun catalog(store: String, gating: Boolean?, ready: Boolean?, purchasesEnabled: Boolean = true, products: String? = null): String {
        val rows = products ?: (countryPacks + "complete").joinToString(",") {
            """{"packId":"$it","appleSku":"apple.$it","googleSku":"play.$it","purchasable":{"apple":true,"google":true}}"""
        }
        val storeFlags = ready?.let { ""","stores":{"$store":$it,"${other(store)}":true}""" } ?: ""
        val flag = gating?.let { ""","nativeGating":$it""" } ?: ""
        return """{"sharedOwnership":true,"purchasesEnabled":$purchasesEnabled$storeFlags$flag,"products":[$rows]}"""
    }

    private fun StoreGate.lock(country: String, id: String, packs: Set<String> = emptySet(), scenarios: Set<String> = emptySet(), daily: String? = null) =
        lockedPack(country, id, packs, scenarios, daily)

    @Test fun gatingOffOrMissingLocksNothing() {
        for (store in stores) for (json in listOf(catalog(store, false, true), catalog(store, null, true), catalog(store, null, null))) {
            val server = StoreGate.fromServer(json, store)
            assertEquals(StoreGate.OPEN, server.gate, json)
            assertNull(server.gate.lock("US", "2016"))
            assertNull(server.gate.lock("UK", "1997"))
        }
        assertNull(StoreGate.OPEN.lock("CA", "2021"))
    }

    @Test fun gatingOnWithoutAReadyStoreLocksNothing() {
        for (store in stores) {
            assertEquals(StoreGate.OPEN, StoreGate.fromServer(catalog(store, true, false), store).gate, store)
            // An older server without per-store flags falls back to purchasesEnabled.
            assertEquals(StoreGate.OPEN, StoreGate.fromServer(catalog(store, true, null, purchasesEnabled = false), store).gate)
            assertTrue(StoreGate.fromServer(catalog(store, true, null, purchasesEnabled = true), store).gate.gating)
            // No SKUs for this store, or an unreadable answer, keeps everything open.
            val noSku = """{"packId":"canada","${other(store)}Sku":"x","${store}Sku":null}"""
            assertEquals(StoreGate.OPEN, StoreGate.fromServer(catalog(store, true, true, products = noSku), store).gate)
            assertEquals(StoreGate.OPEN, StoreGate.fromServer("not json", store).gate)
            assertEquals(StoreGate.OPEN, StoreGate.fromServer("[]", store).gate)
            assertEquals(StoreGate.OPEN, StoreGate.fromServer("""{"nativeGating":"true","stores":{"$store":"true"}}""", store).gate)
        }
        // An unknown store name never locks.
        assertEquals(StoreGate.OPEN, StoreGate.fromServer(catalog(StoreGate.APPLE, true, true), "steam").gate)
    }

    @Test fun eachStoreReadsOnlyItsOwnReadiness() {
        val appleOnly = """{"purchasesEnabled":true,"nativeGating":true,"stores":{"apple":true,"google":false},"products":[""" +
            """{"packId":"uk-elections","appleSku":"apple.uk","googleSku":"play.uk","purchasable":{"apple":true,"google":true}}]}"""
        assertEquals("uk-elections", StoreGate.fromServer(appleOnly, StoreGate.APPLE).gate.lock("UK", "1997"))
        assertEquals(StoreGate.OPEN, StoreGate.fromServer(appleOnly, StoreGate.GOOGLE).gate)
    }

    @Test fun gatingOnLocksOnlyPacksThePlayStoreCanSell() {
        val server = StoreGate.fromServer(catalog(StoreGate.GOOGLE, true, true, products = listOf(
            """{"packId":"uk-elections","googleSku":"play.uk","purchasable":{"apple":true,"google":true}}""",
            """{"packId":"canada","googleSku":"play.ca","purchasable":{"apple":true,"google":false}}""",
            """{"packId":"germany","googleSku":"","purchasable":{"google":true}}""",
            """{"packId":"france","googleSku":"play.fr"}""",
            """{"packId":"not-a-pack","googleSku":"play.x","purchasable":{"google":true}}""",
        ).joinToString(",")), StoreGate.GOOGLE)
        assertEquals(mapOf("play.uk" to "uk-elections", "play.fr" to "france"), server.skus)
        val gate = server.gate
        assertTrue(gate.gating)
        assertEquals("uk-elections", gate.lock("UK", "1997"))
        assertEquals("france", gate.lock("FR", "2017"))
        assertNull(gate.lock("CA", "2021"), "Play cannot sell Canada yet")
        assertNull(gate.lock("DE", "2021"), "Germany has no Play SKU")
        assertNull(gate.lock("US", "2016"), "The United States pack is not on Play")
    }

    @Test fun gatingOnLocksOnlyPacksTheAppStoreCanSell() {
        // A new country pack stays unlisted on the App Store until it goes on
        // sale. With gating on and the App Store ready, its elections stay open.
        val server = StoreGate.fromServer(catalog(StoreGate.APPLE, true, true, products = listOf(
            """{"packId":"uk-elections","appleSku":"apple.uk","googleSku":"play.uk","purchasable":{"apple":true,"google":true}}""",
            """{"packId":"canada","appleSku":"apple.ca","googleSku":"play.ca","purchasable":{"apple":false,"google":true}}""",
            """{"packId":"germany","appleSku":"","googleSku":"play.de","purchasable":{"apple":true,"google":true}}""",
            """{"packId":"us-historical","googleSku":"play.us","purchasable":{"google":true}}""",
            """{"packId":"france","appleSku":"apple.fr"}""",
        ).joinToString(",")), StoreGate.APPLE)
        assertEquals(mapOf("apple.uk" to "uk-elections", "apple.fr" to "france"), server.skus)
        val gate = server.gate
        assertEquals("uk-elections", gate.lock("UK", "1997"))
        assertEquals("france", gate.lock("FR", "2017"))
        assertNull(gate.lock("CA", "2021"), "Canada is unlisted on the App Store")
        assertNull(gate.lock("DE", "2021"), "Germany has no App Store product")
        assertNull(gate.lock("US", "2016"), "The United States pack has no App Store product")
    }

    @Test fun aPackWhoseProductDidNotLoadOnThisDeviceStaysOpen() {
        for (store in stores) {
            val gate = StoreGate.fromServer(catalog(store, true, true), store).gate
            assertEquals("us-historical", gate.lock("US", "2016"))
            val device = gate.onDevice(setOf("uk-elections"))
            assertEquals("uk-elections", device.lock("UK", "1997"))
            assertNull(device.lock("US", "2016"))
            assertEquals(StoreGate.OPEN, gate.onDevice(emptySet()), "$store unavailable on this device")
        }
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
        // Scenario unlocks on the account (activation codes on an account not
        // linked to Lakeside, web unlocks) open too, on both stores.
        assertNull(allSellable.lock("US", "2016", scenarios = setOf("us-2016")))
        assertEquals("us-historical", allSellable.lock("US", "2012", scenarios = setOf("us-2016")))
    }

    @Test fun countryCodesMatchWhateverTheCase() {
        assertEquals("uk-elections", allSellable.lock("uk", "1997"))
        assertNull(allSellable.lock("uk", "1997", scenarios = setOf("uk-1997")))
        assertFalse(StoreGate.OPEN.gating)
    }
}
