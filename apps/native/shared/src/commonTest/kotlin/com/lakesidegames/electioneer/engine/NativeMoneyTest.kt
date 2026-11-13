package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals

class NativeMoneyTest {
    @Test
    fun minusSignGoesBeforeTheSymbol() {
        assertEquals("-$8.1M", NativeMoney.millions("$", -8.1))
        assertEquals("-£2.5M", NativeMoney.millions("£", -2.5))
        assertEquals("-R$14M", NativeMoney.millions("R$", -14.0, 0))
        assertEquals("$8.1M", NativeMoney.millions("$", 8.06))
    }

    @Test
    fun amountsThatRoundToZeroHaveNoSign() {
        assertEquals("$0.0M", NativeMoney.millions("$", -0.04))
        assertEquals("$0", NativeMoney.dollars(-0.4))
    }

    @Test
    fun dollarsMatchTheWebFormatter() {
        assertEquals("-$8.1M", NativeMoney.dollars(-8_100_000.0))
        assertEquals("-$1.25B", NativeMoney.dollars(-1_250_000_000.0))
        assertEquals("-$350K", NativeMoney.dollars(-350_000.0))
        assertEquals("$12", NativeMoney.dollars(12.0))
    }
}
