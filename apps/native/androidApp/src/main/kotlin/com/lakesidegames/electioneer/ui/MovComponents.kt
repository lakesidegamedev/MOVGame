package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// Shared building blocks for every Android screen. They mirror the web's
// component classes (card, eyebrow, button variants, chip, tag, metric,
// meter, swatch) so both games read as one product.

/** Uppercase section label (the web's .eyebrow). */
@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier, color: Color = Mov.Text3) {
    Text(text.uppercase(), modifier.semantics { heading() }, color = color, style = MaterialTheme.typography.labelSmall)
}

/** Screen title block: eyebrow, title, optional note. One per screen. */
@Composable
fun ScreenHeader(eyebrow: String?, title: String, note: String? = null, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
        eyebrow?.let { Eyebrow(it, color = Mov.AccentText) }
        Text(title, Modifier.semantics { heading() }, style = MaterialTheme.typography.headlineLarge, color = Mov.Text1)
        note?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = Mov.Text3) }
    }
}

/** Card head row: title on the left, an optional action on the right. */
@Composable
fun CardHead(title: String, modifier: Modifier = Modifier, trailing: (@Composable RowScope.() -> Unit)? = null) {
    Row(modifier.fillMaxWidth().heightIn(min = 28.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f).semantics { heading() }, style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
        trailing?.invoke(this)
    }
}

/**
 * Panel on Surface1 with a hairline edge (the web's .card). [selected] draws
 * the warning selection ring; [accent] the accent ring for a chosen election.
 */
@Composable
fun MovCard(
    modifier: Modifier = Modifier,
    tight: Boolean = false,
    selected: Boolean = false,
    accent: Boolean = false,
    color: Color = Mov.Surface1,
    onClick: (() -> Unit)? = null,
    onClickLabel: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val edge = when {
        selected -> BorderStroke(1.5.dp, Mov.Warning)
        accent -> BorderStroke(1.5.dp, Mov.Accent)
        else -> BorderStroke(1.dp, Mov.Border)
    }
    val padding = if (tight) MovSpace.s3 else MovSpace.s4
    val inner: @Composable () -> Unit = {
        Column(Modifier.padding(padding), verticalArrangement = Arrangement.spacedBy(if (tight) MovSpace.s1_5 else MovSpace.s2_5), content = content)
    }
    val base = modifier.fillMaxWidth().semantics { if (onClick != null) this.selected = selected || accent }
    if (onClick != null) Surface(onClick = onClick, modifier = base, shape = MovRadius.lg, color = color, border = edge,
        shadowElevation = 1.dp) { inner() }
    else Surface(modifier = base, shape = MovRadius.lg, color = color, border = edge, shadowElevation = 1.dp) { inner() }
}

/** Sunken block inside a card (the web's .inset). */
@Composable
fun Inset(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxWidth().clip(MovRadius.md).background(Mov.Sunken).border(1.dp, Mov.BorderSubtle, MovRadius.md)
        .padding(MovSpace.s3), verticalArrangement = Arrangement.spacedBy(MovSpace.s1_5), content = content)
}

private val buttonPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)

/** The one main action on a screen. */
@Composable
fun PrimaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, large: Boolean = false) {
    Button(onClick = onClick, enabled = enabled, modifier = modifier.heightIn(min = if (large) 52.dp else MovSpace.touch),
        shape = MovRadius.md, contentPadding = buttonPadding,
        colors = ButtonDefaults.buttonColors(containerColor = Mov.Accent, contentColor = Mov.OnAccent,
            disabledContainerColor = Mov.Surface3, disabledContentColor = Mov.Text4)) {
        Text(text, style = if (large) MaterialTheme.typography.titleMedium else MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold,
            maxLines = 2, overflow = TextOverflow.Ellipsis, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}

/** Default button: raised surface with an edge. */
@Composable
fun SecondaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    OutlinedButton(onClick = onClick, enabled = enabled, modifier = modifier.heightIn(min = MovSpace.touch), shape = MovRadius.md,
        contentPadding = buttonPadding, border = BorderStroke(1.dp, if (enabled) Mov.BorderStrong else Mov.Border),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = Mov.Surface2, contentColor = Mov.Text1,
            disabledContainerColor = Mov.Surface1, disabledContentColor = Mov.Text4)) {
        Text(text, style = MaterialTheme.typography.labelLarge, maxLines = 2, overflow = TextOverflow.Ellipsis,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}

/** Borderless text action for toolbars and secondary links. */
@Composable
fun GhostButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, color: Color = Mov.AccentText) {
    TextButton(onClick = onClick, enabled = enabled, modifier = modifier.heightIn(min = MovSpace.touch), shape = MovRadius.md,
        colors = ButtonDefaults.textButtonColors(contentColor = color, disabledContentColor = Mov.Text4)) {
        Text(text, style = MaterialTheme.typography.labelLarge, maxLines = 2, overflow = TextOverflow.Ellipsis)
    }
}

/** Destructive action. */
@Composable
fun DangerButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    OutlinedButton(onClick = onClick, enabled = enabled, modifier = modifier.heightIn(min = MovSpace.touch), shape = MovRadius.md,
        contentPadding = buttonPadding, border = BorderStroke(1.dp, Mov.NegativeEdge),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = Mov.NegativeSoft, contentColor = Mov.Negative)) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

/** Selectable filter or option chip (the web's .chip with aria-pressed). */
@Composable
fun MovChip(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, leading: Color? = null) {
    FilterChip(selected = selected, onClick = onClick, enabled = enabled, modifier = modifier,
        label = { Text(text, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        leadingIcon = leading?.let { color -> { PartySwatch(color, size = 10.dp) } },
        shape = MovRadius.md,
        colors = FilterChipDefaults.filterChipColors(containerColor = Mov.Surface2, labelColor = Mov.Text2,
            selectedContainerColor = Mov.AccentSoft.compositeOverSurface(), selectedLabelColor = Mov.Text1),
        border = FilterChipDefaults.filterChipBorder(enabled = enabled, selected = selected, borderColor = Mov.Border,
            selectedBorderColor = Mov.Accent, borderWidth = 1.dp, selectedBorderWidth = 1.5.dp))
}

private fun Color.compositeOverSurface() = androidx.compose.ui.graphics.Color(
    red = red * alpha + Mov.Surface2.red * (1 - alpha), green = green * alpha + Mov.Surface2.green * (1 - alpha),
    blue = blue * alpha + Mov.Surface2.blue * (1 - alpha))

/** A wrapping row of chips that never scrolls sideways. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChipRow(modifier: Modifier = Modifier, content: @Composable FlowRowScope.() -> Unit) {
    FlowRow(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(MovSpace.s1_5),
        verticalArrangement = Arrangement.spacedBy(0.dp), content = content)
}

enum class TagKind { Neutral, Positive, Negative, Warning, Accent, Info, Outline }

/** Small solid badge (the web's .tag). */
@Composable
fun Tag(text: String, kind: TagKind = TagKind.Neutral, modifier: Modifier = Modifier) {
    val (fill, ink, edge) = when (kind) {
        TagKind.Neutral -> Triple(Mov.Surface3, Mov.Text2, Mov.Border)
        TagKind.Positive -> Triple(Mov.PositiveSoft, Mov.Positive, Mov.PositiveEdge)
        TagKind.Negative -> Triple(Mov.NegativeSoft, Mov.Negative, Mov.NegativeEdge)
        TagKind.Warning -> Triple(Mov.WarningSoft, Mov.Warning, Mov.WarningEdge)
        TagKind.Accent -> Triple(Mov.AccentSoft, Mov.AccentText, Mov.Accent.copy(alpha = 0.5f))
        TagKind.Info -> Triple(Mov.InfoSoft, Mov.Info, Mov.Info.copy(alpha = 0.4f))
        TagKind.Outline -> Triple(Color.Transparent, Mov.Text3, Mov.BorderStrong)
    }
    Text(text.uppercase(), modifier.clip(MovRadius.sm).background(fill).border(1.dp, edge, MovRadius.sm)
        .padding(horizontal = 6.dp, vertical = 2.dp), color = ink, style = MaterialTheme.typography.labelSmall, maxLines = 1)
}

fun difficultyTag(difficulty: String): TagKind = when (difficulty) {
    "easy" -> TagKind.Positive
    "medium", "normal" -> TagKind.Warning
    else -> TagKind.Negative
}

/** Value over label (the web's .metric inside .stat-row). */
@Composable
fun Metric(value: String, label: String, modifier: Modifier = Modifier, color: Color = Mov.Text1, alignEnd: Boolean = false) {
    Column(modifier.semantics(mergeDescendants = true) {}, horizontalAlignment = if (alignEnd) Alignment.End else Alignment.Start) {
        Text(value, color = color, style = MaterialTheme.typography.titleLarge.num, fontWeight = FontWeight.Bold, maxLines = 1)
        Text(label.uppercase(), color = Mov.Text3, style = MaterialTheme.typography.labelSmall, maxLines = 1)
    }
}

/** Row of metrics with even spacing; wraps on narrow phones and large fonts. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StatRow(modifier: Modifier = Modifier, content: @Composable FlowRowScope.() -> Unit) {
    FlowRow(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(MovSpace.s5),
        verticalArrangement = Arrangement.spacedBy(MovSpace.s2), content = content)
}

/** Label and value on one line (the web's .kv). */
@Composable
fun KeyValue(label: String, value: String, modifier: Modifier = Modifier, valueColor: Color = Mov.Text1) {
    Row(modifier.fillMaxWidth().semantics(mergeDescendants = true) {}, verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f), color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
        Text(value, color = valueColor, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.SemiBold)
    }
}

/** Small color key with an inner edge so dark parties stay visible. */
@Composable
fun PartySwatch(color: Color, modifier: Modifier = Modifier, size: Dp = 12.dp) {
    Box(modifier.size(size).clip(MovRadius.xs).background(color).border(1.dp, Color.White.copy(alpha = 0.18f), MovRadius.xs))
}

/** Thin bar with an optional threshold mark (the web's .meter). */
@Composable
fun Meter(fraction: Float, color: Color, modifier: Modifier = Modifier, height: Dp = 6.dp, mark: Float? = null) {
    Canvas(modifier.fillMaxWidth().height(height)) {
        val r = androidx.compose.ui.geometry.CornerRadius(size.height / 2)
        drawRoundRect(Mov.Sunken, cornerRadius = r)
        drawRoundRect(color, size = size.copy(width = size.width * fraction.coerceIn(0f, 1f)), cornerRadius = r)
        mark?.let { val x = size.width * it; drawLine(Mov.Text1, Offset(x, -2f), Offset(x, size.height + 2f), strokeWidth = 2.dp.toPx()) }
    }
}

/**
 * Stacked seat bar for every party with a majority mark when there is one. Parties are drawn
 * in the order given; the remainder (uncalled or tossup) stays sunken.
 */
@Composable
fun SeatBar(segments: List<Pair<Color, Int>>, total: Int, majority: Int?, modifier: Modifier = Modifier, height: Dp = 14.dp, description: String) {
    Canvas(modifier.fillMaxWidth().height(height).semantics { contentDescription = description }) {
        drawRect(Mov.Sunken)
        var x = 0f
        segments.forEach { (color, units) ->
            val w = size.width * units / total.coerceAtLeast(1)
            drawRect(color, topLeft = Offset(x, 0f), size = size.copy(width = w))
            if (w > 2f) drawLine(Mov.Surface1, Offset(x + w, 0f), Offset(x + w, size.height), strokeWidth = 1.dp.toPx())
            x += w
        }
        // Plurality contests have no majority line.
        majority?.let {
            val m = size.width * it / total.coerceAtLeast(1)
            drawLine(Mov.Text1, Offset(m, 0f), Offset(m, size.height), strokeWidth = 2.dp.toPx())
        }
    }
}

/**
 * One party row for standings tables: swatch, party name in readable ink,
 * then right-aligned tabular numbers. [highlight] marks the player's party.
 */
@Composable
fun PartyRow(
    color: String?,
    name: String,
    values: List<String>,
    modifier: Modifier = Modifier,
    highlight: Boolean = false,
    tag: String? = null,
) {
    Row(modifier.fillMaxWidth().clip(MovRadius.sm).background(if (highlight) Mov.Surface2 else Color.Transparent)
        .heightIn(min = 32.dp).padding(horizontal = MovSpace.s1_5, vertical = MovSpace.s1).semantics(mergeDescendants = true) {},
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
        PartySwatch(partyFill(color))
        Text(name, Modifier.weight(1f), color = partyInk(color), style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (highlight) FontWeight.Bold else FontWeight.Medium, maxLines = 2, overflow = TextOverflow.Ellipsis)
        tag?.let { Tag(it, TagKind.Accent) }
        values.forEachIndexed { i, value ->
            Text(value, Modifier.widthIn(min = if (i == 0) 40.dp else 52.dp), color = if (i == 0) Mov.Text1 else Mov.Text3,
                style = MaterialTheme.typography.bodyMedium.num, fontWeight = if (i == 0) FontWeight.Bold else FontWeight.Normal,
                textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1)
        }
    }
}

enum class NoticeKind { Info, Positive, Warning, Negative }

/** Short status line after an action (saved, failed, synced). */
@Composable
fun Notice(text: String, kind: NoticeKind = NoticeKind.Info, modifier: Modifier = Modifier) {
    val (fill, ink) = when (kind) {
        NoticeKind.Info -> Mov.InfoSoft to Mov.Text1
        NoticeKind.Positive -> Mov.PositiveSoft to Mov.Text1
        NoticeKind.Warning -> Mov.WarningSoft to Mov.Text1
        NoticeKind.Negative -> Mov.NegativeSoft to Mov.Text1
    }
    val edge = when (kind) { NoticeKind.Info -> Mov.Info; NoticeKind.Positive -> Mov.Positive; NoticeKind.Warning -> Mov.Warning; NoticeKind.Negative -> Mov.Negative }
    Row(modifier.fillMaxWidth().clip(MovRadius.md).background(fill).semantics(mergeDescendants = true) {}) {
        Box(Modifier.width(3.dp).heightIn(min = 36.dp).background(edge))
        Text(text, Modifier.padding(horizontal = MovSpace.s3, vertical = MovSpace.s2), color = ink, style = MaterialTheme.typography.bodyMedium)
    }
}

/** Tinted note about a choice the player is making (the web's .callout). */
@Composable
fun Callout(title: String, body: String?, modifier: Modifier = Modifier, kind: NoticeKind = NoticeKind.Warning, content: (@Composable ColumnScope.() -> Unit)? = null) {
    val (fill, edge, ink) = when (kind) {
        NoticeKind.Warning -> Triple(Mov.WarningSoft, Mov.WarningEdge, Mov.Warning)
        NoticeKind.Negative -> Triple(Mov.NegativeSoft, Mov.NegativeEdge, Mov.Negative)
        NoticeKind.Positive -> Triple(Mov.PositiveSoft, Mov.PositiveEdge, Mov.Positive)
        NoticeKind.Info -> Triple(Mov.InfoSoft, Mov.Info.copy(alpha = 0.4f), Mov.Info)
    }
    Column(modifier.fillMaxWidth().clip(MovRadius.lg).background(fill.compositeOverCard()).border(1.dp, edge, MovRadius.lg)
        .padding(MovSpace.s4), verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
        Text(title.uppercase(), color = ink, style = MaterialTheme.typography.labelSmall, modifier = Modifier.semantics { heading() })
        body?.let { Text(it, color = Mov.Text1, style = MaterialTheme.typography.bodyMedium) }
        content?.invoke(this)
    }
}

private fun Color.compositeOverCard() = Color(
    red = red * alpha + Mov.Surface1.red * (1 - alpha), green = green * alpha + Mov.Surface1.green * (1 - alpha),
    blue = blue * alpha + Mov.Surface1.blue * (1 - alpha))

/** Search input with a leading icon (the web's .search-box). */
@Composable
fun SearchField(value: String, onChange: (String) -> Unit, label: String, modifier: Modifier = Modifier) {
    OutlinedTextField(value, onChange, modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text(label, color = Mov.Text4) },
        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Mov.Text3) },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        shape = MovRadius.md, colors = movFieldColors(),
        textStyle = MaterialTheme.typography.bodyMedium)
}

@Composable
fun movFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Mov.Sunken, unfocusedContainerColor = Mov.Sunken, disabledContainerColor = Mov.Sunken,
    focusedBorderColor = Mov.Info, unfocusedBorderColor = Mov.Border, focusedLabelColor = Mov.Info, unfocusedLabelColor = Mov.Text3,
    cursorColor = Mov.Info, focusedTextColor = Mov.Text1, unfocusedTextColor = Mov.Text1)

/** Segmented control: one choice of a few, full width. */
@Composable
fun Segmented(options: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier, label: String) {
    Row(modifier.fillMaxWidth().clip(MovRadius.md).background(Mov.Sunken).border(1.dp, Mov.Border, MovRadius.md).padding(2.dp)
        .semantics { contentDescription = label }, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        options.forEach { (id, title) ->
            val on = id == selected
            Box(Modifier.weight(1f).heightIn(min = 44.dp).clip(MovRadius.sm).background(if (on) Mov.Surface4 else Color.Transparent)
                .clickable(role = Role.Tab, onClickLabel = title) { onSelect(id) }.semantics { this.selected = on; role = Role.Tab },
                contentAlignment = Alignment.Center) {
                Text(title, color = if (on) Mov.Text1 else Mov.Text3, style = MaterialTheme.typography.labelLarge,
                    fontWeight = if (on) FontWeight.Bold else FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** Hairline between rows. */
@Composable
fun Hairline(modifier: Modifier = Modifier) { HorizontalDivider(modifier, thickness = 1.dp, color = Mov.BorderSubtle) }

/** Bottom action bar that keeps the main action reachable on phones. */
@Composable
fun ActionBar(content: @Composable RowScope.() -> Unit) {
    Surface(color = Mov.Surface1, shadowElevation = 8.dp, border = BorderStroke(1.dp, Mov.Border), shape = androidx.compose.ui.graphics.RectangleShape) {
        Row(Modifier.fillMaxWidth().padding(horizontal = MovSpace.gutter, vertical = MovSpace.s2), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MovSpace.s2), content = content)
    }
}

