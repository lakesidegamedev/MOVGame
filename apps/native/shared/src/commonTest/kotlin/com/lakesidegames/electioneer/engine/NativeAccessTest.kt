package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

// Ids never change. ca-2025, de-2025, fr-2022, au-2025, uk-2024 and the newest
// election of every later country became free and left their pack's paid list;
// us-2024 and us-2020 were already free. Mirrors PINNED_FREE in catalog-pins.test.ts.
private val PINNED_FREE = listOf(
    "us-2024", "us-2020", "uk-2024", "ca-2025", "de-2025", "fr-2022", "au-2025",
    "nz-2023", "br-2022", "in-2024", "es-2023", "ie-2024", "jp-2024",
)

class NativeAccessTest {
    @Test fun gatingOffKeepsEveryElectionPlayable() {
        assertNull(NativeAccess.lockedPack("US", "2016", emptyList(), gating = false, dailyScenarioId = null))
        assertNull(NativeAccess.lockedPack("UK", "1997", emptyList(), gating = false, dailyScenarioId = null))
    }
    @Test fun freeElectionsAndTheDailyChallengeStayOpen() {
        assertNull(NativeAccess.lockedPack("US", "2024", emptyList(), gating = true, dailyScenarioId = null))
        assertNull(NativeAccess.lockedPack("US", "2020", emptyList(), gating = true, dailyScenarioId = null))
        assertNull(NativeAccess.lockedPack("UK", "1997", emptyList(), gating = true, dailyScenarioId = "uk-1997"))
        // One free election per country, read from the exported registry.
        for (id in PINNED_FREE) {
            val e = nativeElections.first { it.scenarioId == id }
            assertTrue(e.free, id)
            assertNull(e.packId, id)
            assertNull(NativeAccess.lockedPack(e.country, e.nativeId, emptyList(), gating = true, dailyScenarioId = null), id)
        }
    }
    @Test fun everyCountryHasAFreeElectionAndSomethingToSell() {
        for (country in nativeElections.map { it.country }.distinct()) {
            val rows = nativeElections.filter { it.country == country }
            assertTrue(rows.any { it.free }, "$country free")
            assertTrue(rows.any { !it.free }, "$country paid")
        }
        // Exactly the pinned set is free among the countries it covers.
        val pinnedCountries = PINNED_FREE.map { id -> nativeElections.first { it.scenarioId == id }.country }.toSet()
        assertEquals(PINNED_FREE.toSet(), nativeElections.filter { it.country in pinnedCountries && it.free }.map { it.scenarioId }.toSet())
    }
    @Test fun paidElectionsNeedTheirCountryBundle() {
        assertEquals("us-historical", NativeAccess.lockedPack("US", "2016", emptyList(), true, null))
        assertEquals("uk-elections", NativeAccess.lockedPack("UK", "1997", emptyList(), true, null))
        assertEquals("canada", NativeAccess.lockedPack("CA", "2021", emptyList(), true, null))
        assertEquals("germany", NativeAccess.lockedPack("DE", "2021", listOf("france"), true, null))
    }
    @Test fun ownedBundlesCompleteAndLegacyGlobalUnlock() {
        assertNull(NativeAccess.lockedPack("US", "2016", listOf("us-historical"), true, null))
        assertNull(NativeAccess.lockedPack("UK", "1997", listOf("complete"), true, null))
        assertNull(NativeAccess.lockedPack("AU", "2019", listOf("global"), true, null))
        assertEquals("us-historical", NativeAccess.lockedPack("US", "1980", listOf("global"), true, null))
    }
    @Test fun everyPaidRegistryElectionMapsToASellableBundle() {
        val sellable = NativeCatalog.packs().filter { !it.legacy && it.id != "complete" }.map { it.id }.toSet()
        assertTrue(sellable.containsAll(setOf("us-historical", "uk-elections", "canada", "germany", "france", "australia")))
        val paid = nativeElections.filter { !it.free }
        assertTrue(paid.size >= 47)
        paid.forEach { assertEquals(true, it.packId in sellable, it.scenarioId) }
        assertEquals(paid.map { it.scenarioId }.toSet(), NativeCatalog.pack("complete")!!.scenarios.toSet())
        // The free elections are no pack's paid list, not even Complete's.
        nativeElections.filter { it.free }.forEach { e ->
            NativeCatalog.packs().filter { !it.legacy }.forEach { p -> assertTrue(e.scenarioId !in p.scenarios, "${p.id} sells ${e.scenarioId}") }
        }
    }
    @Test fun theRetiredGlobalPackStaysFrozen() {
        val global = NativeCatalog.pack("global")!!
        assertTrue(global.legacy)
        assertEquals(listOf("ca-2025", "ca-2021", "ca-2019", "ca-2015", "de-2025", "de-2021", "de-2017",
            "fr-2027", "fr-2022", "fr-2017", "fr-2012", "au-2025", "au-2022", "au-2019"), global.scenarios)
        // Global owners own those scenarios through the country packs, but a
        // pack is only "covered" while every one of its scenarios is.
        assertTrue(NativeAccess.covers("canada", listOf("global")) == NativeCatalog.pack("canada")!!.scenarios.all { it in global.scenarios })
        assertTrue(NativeAccess.covers("canada", listOf("complete")))
        assertEquals(false, NativeAccess.covers("us-historical", listOf("global")))
        assertEquals("Complete Collection", NativeCatalog.packName("complete"))
        assertEquals("country", NativeCatalog.packName(null))
    }
}
