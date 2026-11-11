package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * The Android side of the web design tokens (src/ui/styles/tokens.css,
 * documented in docs/ui-system.md). Screens read colors, spacing, radii and
 * type from here and never hard-code their own.
 */
object Mov {
    // Surfaces stack from dark to light; each step sits visibly above the last.
    val Surface0 = Color(0xFF0A0F14)
    val Sunken = Color(0xFF0D141C)
    val Surface1 = Color(0xFF111B26)
    val Surface2 = Color(0xFF16222E)
    val Surface3 = Color(0xFF1C2A38)
    val Surface4 = Color(0xFF243444)
    val Scrim = Color(0xC704080E)

    val BorderSubtle = Color(0x0FEAF0F6)
    val Border = Color(0x1AEAF0F6)
    val BorderStrong = Color(0x33EAF0F6)

    // Text levels. Text4 is the faintest allowed for real content.
    val Text1 = Color(0xFFEAF0F6)
    val Text2 = Color(0xCCEAF0F6)
    val Text3 = Color(0xA3EAF0F6)
    val Text4 = Color(0x8AEAF0F6)
    val OnAccent = Color(0xFF0A0F14)

    val Accent = Color(0xFFE05C4B)
    val AccentHover = Color(0xFFE97463)
    val AccentText = Color(0xFFF07A6A)
    val AccentSoft = Color(0x24E05C4B)

    val Positive = Color(0xFF34D399)
    val PositiveEdge = Color(0xFF1F5641)
    val PositiveSoft = Color(0x1F34D399)
    val Negative = Color(0xFFF87171)
    val NegativeEdge = Color(0xFF6B2230)
    val NegativeSoft = Color(0x1FF87171)
    val Warning = Color(0xFFF5B942)
    val WarningEdge = Color(0xFF6B5321)
    val WarningSoft = Color(0x1FF5B942)
    val Info = Color(0xFF38BDF8)
    val InfoSoft = Color(0x1F38BDF8)

    val Dem = Color(0xFF2563EB)
    val DemDeep = Color(0xFF1D4ED8)
    val DemText = Color(0xFF6EA8FE)
    val Gop = Color(0xFFDC2626)
    val GopDeep = Color(0xFFB91C1C)
    val GopText = Color(0xFFF87171)
    val Tossup = Color(0xFF2E3F50)

    /** Neutral fill for a region nobody leads yet. */
    val Unclaimed = Color(0xFF283649)
}

/** 4dp grid, named like the web's --space-* tokens. */
object MovSpace {
    val s0_5 = 2.dp
    val s1 = 4.dp
    val s1_5 = 6.dp
    val s2 = 8.dp
    val s2_5 = 10.dp
    val s3 = 12.dp
    val s4 = 16.dp
    val s5 = 20.dp
    val s6 = 24.dp
    val s8 = 32.dp

    /** Horizontal page gutter on phones. */
    val gutter = 16.dp

    /** Android's minimum touch target. */
    val touch = 48.dp
}

object MovRadius {
    val xs = RoundedCornerShape(3.dp)
    val sm = RoundedCornerShape(4.dp)
    val md = RoundedCornerShape(6.dp)
    val lg = RoundedCornerShape(8.dp)
    val xl = RoundedCornerShape(10.dp)
    val pill = RoundedCornerShape(50)
}

private val Sans = FontFamily.SansSerif

/** Type scale mapped from --fs-* (in sp so the player's font size applies). */
private val MovTypography = Typography(
    displayLarge = TextStyle(fontFamily = Sans, fontWeight = FontWeight.ExtraBold, fontSize = 48.sp, lineHeight = 52.sp, letterSpacing = (-0.02).em),
    displayMedium = TextStyle(fontFamily = Sans, fontWeight = FontWeight.ExtraBold, fontSize = 34.sp, lineHeight = 38.sp, letterSpacing = (-0.01).em),
    displaySmall = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Bold, fontSize = 26.sp, lineHeight = 31.sp),
    headlineLarge = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Bold, fontSize = 26.sp, lineHeight = 31.sp),
    headlineMedium = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 27.sp),
    headlineSmall = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 25.sp),
    titleLarge = TextStyle(fontFamily = Sans, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 23.sp),
    titleMedium = TextStyle(fontFamily = Sans, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 21.sp),
    titleSmall = TextStyle(fontFamily = Sans, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 19.sp),
    bodyLarge = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 23.sp),
    bodyMedium = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 17.sp),
    labelLarge = TextStyle(fontFamily = Sans, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp),
    labelSmall = TextStyle(fontFamily = Sans, fontWeight = FontWeight.Bold, fontSize = 11.sp, lineHeight = 14.sp, letterSpacing = 0.08.em),
)

/** Tabular figures, for every number the player compares. */
val TextStyle.num: TextStyle get() = copy(fontFeatureSettings = "tnum")

private val MovColorScheme = darkColorScheme(
    primary = Mov.Accent,
    onPrimary = Mov.OnAccent,
    primaryContainer = Mov.AccentSoft.compositeOver(Mov.Surface1),
    onPrimaryContainer = Mov.Text1,
    secondary = Mov.Warning,
    onSecondary = Mov.OnAccent,
    secondaryContainer = Mov.Surface3,
    onSecondaryContainer = Mov.Text1,
    tertiary = Mov.Info,
    onTertiary = Mov.OnAccent,
    background = Mov.Surface0,
    onBackground = Mov.Text1,
    surface = Mov.Surface0,
    onSurface = Mov.Text1,
    surfaceVariant = Mov.Surface2,
    onSurfaceVariant = Mov.Text3,
    surfaceTint = Color.Transparent,
    surfaceBright = Mov.Surface3,
    surfaceDim = Mov.Surface0,
    surfaceContainerLowest = Mov.Sunken,
    surfaceContainerLow = Mov.Surface1,
    surfaceContainer = Mov.Surface1,
    surfaceContainerHigh = Mov.Surface2,
    surfaceContainerHighest = Mov.Surface3,
    inverseSurface = Mov.Text1,
    inverseOnSurface = Mov.Surface0,
    outline = Mov.BorderStrong,
    outlineVariant = Mov.Border,
    error = Mov.Negative,
    onError = Mov.OnAccent,
    errorContainer = Mov.NegativeSoft.compositeOver(Mov.Surface1),
    onErrorContainer = Mov.Text1,
    scrim = Mov.Scrim,
)

private val MovShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(6.dp),
    medium = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(10.dp),
    extraLarge = RoundedCornerShape(12.dp),
)

@Composable
fun MovTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = MovColorScheme, typography = MovTypography, shapes = MovShapes, content = content)
}

// ── Party colors ────────────────────────────────────────────────────────
// Same rules as src/ui/colors.ts: raw color for fills, partyInk() for text on
// the dark panels, partyFill() so near-black parties still show as fills.

private fun contrast(a: Color, b: Color): Double {
    val la = a.luminance() + 0.05
    val lb = b.luminance() + 0.05
    return (maxOf(la, lb) / minOf(la, lb)).toDouble()
}

private fun lift(color: Color, t: Float) = Color(
    red = color.red + (1f - color.red) * t,
    green = color.green + (1f - color.green) * t,
    blue = color.blue + (1f - color.blue) * t,
)

private val inkCache = HashMap<String, Color>()
private val fillCache = HashMap<String, Color>()

/** Parses a data color such as "#e4003b"; gray when the data has none. */
fun hexColor(hex: String?): Color = hex?.let {
    runCatching { Color(android.graphics.Color.parseColor(it.trim())) }.getOrNull()
} ?: Color(0xFF6B7C8E)

/** The party color lifted toward white until it passes AA as text on Surface2. */
fun partyInk(hex: String?): Color {
    if (hex == null) return Mov.Text1
    return inkCache.getOrPut(hex) {
        val base = hexColor(hex)
        var t = 0f
        var out = base
        while (t <= 1f && contrast(out, Mov.Surface2) < 4.5) { t += 0.06f; out = lift(base, t.coerceAtMost(1f)) }
        out
    }
}

/** The party color, lifted only when it would vanish against a card (2.2:1). */
fun partyFill(hex: String?): Color {
    if (hex == null) return Color(0xFF4A5B6D)
    return fillCache.getOrPut(hex) {
        val base = hexColor(hex)
        var t = 0f
        var out = base
        while (t <= 1f && contrast(out, Mov.Surface1) < 2.2) { t += 0.04f; out = lift(base, t.coerceAtMost(1f)) }
        out
    }
}

/** Dark or light text, whichever reads better on a filled party color. */
fun textOn(fill: Color): Color = if (contrast(fill, Mov.Surface0) >= contrast(fill, Color.White)) Mov.Surface0 else Color.White
