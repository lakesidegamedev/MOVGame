package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

// The web map contract's inert land and inset boxes reach the native map.
class MapExtrasTest {
    @Test
    fun northernIrelandIsInertLandNotARegion() {
        val ie = nativeMaps.getValue("IE")
        assertTrue(ie.inert.isNotEmpty())
        assertTrue(ie.inert.all { it.points.size >= 3 })
        assertTrue(ie.shapes.none { it.id == "NI" })
        assertTrue(nativeMaps.filterKeys { it != "IE" }.values.all { it.inert.isEmpty() })
    }

    @Test
    fun boxesThatStandForVotersAreInsets() {
        val insets = nativeMaps.mapValues { (_, map) -> map.shapes.filter { it.inset }.map { it.id } }.filterValues { it.isNotEmpty() }
        assertEquals(mapOf("IT" to listOf("EST"), "NZ" to listOf("MAO")), insets)
    }
}
