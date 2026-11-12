package com.lakesidegames.electioneer.ui

import com.lakesidegames.electioneer.engine.StoreGate
import com.lakesidegames.electioneer.engine.CandidateId
import com.lakesidegames.electioneer.engine.EventMode
import com.lakesidegames.electioneer.engine.NativeCatalog
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class GameSessionGateTest {
    @Test fun withTheGateOpenNothingIsLocked() {
        val session = GameSession()
        assertNull(session.lockedPack("UK", "1997"))
        assertNull(session.lockedPack("US", "2016"))
    }

    @Test fun aLockedLaunchOpensItsPackInTheStoreInsteadOfStarting() {
        val session = GameSession()
        session.pinGateForCapture(StoreGate(true, NativeCatalog.packIds()))
        val daily = session.dailyAssignment().scenarioId
        if (daily != "uk-1997") {
            session.startCampaign("UK", "1997", "lab", "normal", "seed")
            assertEquals(Screen.STORE, session.screen.value)
            assertEquals("uk-elections", session.storeFocus)
        }
        session.storeFocus = null
        session.go(Screen.HOME)
        if (daily != "us-2016") {
            session.newGame("2016", CandidateId.DEM, "", emptyList(), "normal", EventMode.HISTORICAL, 9, "seed", "", false, false)
            assertEquals(Screen.STORE, session.screen.value)
            assertEquals("us-historical", session.storeFocus)
        }
        // Free elections never lock.
        assertNull(session.lockedPack("US", "2024"))
        assertNull(session.lockedPack("UK", "2024"))
    }

    @Test fun anElectionPlayCannotSellStaysPlayable() {
        val session = GameSession()
        session.pinGateForCapture(StoreGate(true, setOf("canada")))
        assertNull(session.lockedPack("UK", "1997"))
        if (session.dailyAssignment().scenarioId != "ca-2021") assertEquals("canada", session.lockedPack("CA", "2021"))
    }
}
