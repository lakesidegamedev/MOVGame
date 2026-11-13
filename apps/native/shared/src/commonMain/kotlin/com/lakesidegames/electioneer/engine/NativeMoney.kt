package com.lakesidegames.electioneer.engine

import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.floor

/**
 * Money as the web game writes it (src/ui/format.ts): the minus sign goes
 * before the currency symbol ("-$8.1M", never "$-8.1M"), and an amount that
 * rounds to zero has no sign. Decimal point is always ".", whatever the
 * device locale, so every platform reads the same.
 */
object NativeMoney {
    /** An amount already in millions, in a campaign's currency: "£12M", "-R$2.5M". */
    fun millions(symbol: String, millions: Double, digits: Int = 1): String {
        val body = fixed(abs(millions), digits)
        return "${sign(millions, body)}$symbol${body}M"
    }

    /** Dollars, short, like the web's money(): "$8.1M", "-$350K", "$1.25B". */
    fun dollars(n: Double): String {
        val a = abs(n)
        val (body, unit) = when {
            a >= 1_000_000_000 -> fixed(a / 1_000_000_000, 2) to "B"
            a >= 1_000_000 -> fixed(a / 1_000_000, 1) to "M"
            a >= 1_000 -> fixed(a / 1_000, 0) to "K"
            else -> fixed(a, 0) to ""
        }
        return "${sign(n, body)}\$$body$unit"
    }

    private fun sign(n: Double, body: String): String = if (n < 0 && body.any { it in '1'..'9' }) "-" else ""

    /** JS Number.toFixed for a non-negative value: half up, always [digits] decimals. */
    internal fun fixed(x: Double, digits: Int): String {
        if (digits <= 0) return floor(x + 0.5).toLong().toString()
        val scale = 10.0.pow(digits).toLong()
        val scaled = floor(x * scale + 0.5).toLong()
        val frac = (scaled % scale).toString().padStart(digits, '0')
        return "${scaled / scale}.$frac"
    }
}
