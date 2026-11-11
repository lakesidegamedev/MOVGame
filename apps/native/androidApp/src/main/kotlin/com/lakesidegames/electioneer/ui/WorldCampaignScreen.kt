package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.*
import java.util.Locale

internal fun number(value: Double): String = String.format(Locale.getDefault(), "%.1f", value)
internal fun percent(share: Double): String = String.format(Locale.getDefault(), "%.1f%%", share * 100)
internal fun signed(value: Double): String = String.format(Locale.getDefault(), "%+.1f", value)

private val ACTION_NAMES = mapOf(
    "broadcast" to "Broadcast", "rally" to "Rally", "surrogate" to "Surrogate", "fundraise" to "Fundraise",
    "ground_game" to "Ground game", "gotv" to "Get out the vote", "canvass" to "Canvass",
    "oppo_research" to "Oppo research", "debate_prep" to "Debate prep", "policy_prep" to "Policy prep",
    "issue_pivot" to "Issue pivot",
)
internal fun actionName(value: String): String = ACTION_NAMES[value] ?: value.replace('_', ' ').replaceFirstChar { it.uppercase() }

/**
 * Country outline map. Every region is tappable; the selected one gets the
 * warning ring. The region list under it offers the same choices to TalkBack.
 */
@Composable
internal fun NativeCountryMap(map: NativeMap, fills: Map<String, Color>, selected: String?, onSelect: ((String) -> Unit)?, description: String, maxHeight: androidx.compose.ui.unit.Dp = 340.dp) {
    val paths = remember(map) { map.shapes.associate { shape ->
        shape.id to Path().apply {
            shape.polygons.forEach { polygon ->
                polygon.points.firstOrNull()?.let { first ->
                    moveTo(first.x.toFloat(), first.y.toFloat())
                    polygon.points.drop(1).forEach { lineTo(it.x.toFloat(), it.y.toFloat()) }
                    close()
                }
            }
        }
    } }
    val hits = remember(map) { map.shapes.associate { shape ->
        val path = android.graphics.Path().apply {
            shape.polygons.forEach { polygon ->
                polygon.points.firstOrNull()?.let { first ->
                    moveTo(first.x.toFloat(), first.y.toFloat())
                    polygon.points.drop(1).forEach { lineTo(it.x.toFloat(), it.y.toFloat()) }
                    close()
                }
            }
        }
        shape.id to android.graphics.Region().apply { setPath(path, android.graphics.Region(0, 0, map.width.toInt() + 1, map.height.toInt() + 1)) }
    } }
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val height = (maxWidth * (map.height / map.width).toFloat()).coerceAtMost(maxHeight)
        var tap = Modifier.fillMaxWidth().height(height).semantics { contentDescription = description }
        if (onSelect != null) tap = tap.pointerInput(map, onSelect) {
            detectTapGestures { point ->
                val factor = minOf(size.width / map.width, size.height / map.height)
                val x = (point.x - (size.width - map.width * factor) / 2) / factor
                val y = (point.y - (size.height - map.height * factor) / 2) / factor
                // Small regions: when the tap misses every shape, take the nearest within a few pixels.
                val hit = hits.entries.firstOrNull { it.value.contains(x.toInt(), y.toInt()) }
                    ?: (-6..6 step 3).flatMap { dx -> (-6..6 step 3).map { dy -> dx to dy } }.firstNotNullOfOrNull { (dx, dy) ->
                        hits.entries.firstOrNull { it.value.contains((x + dx / factor).toInt(), (y + dy / factor).toInt()) } }
                hit?.let { onSelect(it.key) }
            }
        }
        Canvas(tap) {
            val factor = minOf(size.width / map.width, size.height / map.height).toFloat()
            translate((size.width - map.width.toFloat() * factor) / 2, (size.height - map.height.toFloat() * factor) / 2) {
                scale(factor, factor, pivot = androidx.compose.ui.geometry.Offset.Zero) {
                    paths.forEach { (id, path) ->
                        drawPath(path, fills[id] ?: Mov.Unclaimed)
                        drawPath(path, Mov.Surface0, style = Stroke(1.dp.toPx() / factor))
                    }
                    selected?.let { id -> paths[id]?.let { drawPath(it, Mov.Warning, style = Stroke(2.5.dp.toPx() / factor)) } }
                }
            }
        }
    }
}

/** Labelled dropdown that looks like a form field. */
@Composable
internal fun ChoicePicker(label: String, selected: String, choices: List<Pair<String, String>>, modifier: Modifier = Modifier, onSelect: (String) -> Unit) {
    var open by remember { mutableStateOf(false) }
    val current = choices.firstOrNull { it.first == selected }?.second ?: "Choose"
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
        Eyebrow(label)
        Box {
            Row(Modifier.fillMaxWidth().heightIn(min = MovSpace.touch).clip(MovRadius.md).background(Mov.Sunken)
                .border(1.dp, Mov.Border, MovRadius.md).clickable(onClickLabel = "Change $label") { open = true }
                .semantics { contentDescription = "$label: $current" }
                .padding(horizontal = MovSpace.s3), verticalAlignment = Alignment.CenterVertically) {
                Text(current, Modifier.weight(1f), color = Mov.Text1, style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = Mov.Text3)
            }
            DropdownMenu(expanded = open, onDismissRequest = { open = false }, containerColor = Mov.Surface2) {
                choices.forEach { (id, title) -> DropdownMenuItem(text = { Text(title, fontWeight = if (id == selected) FontWeight.Bold else FontWeight.Normal) },
                    onClick = { onSelect(id); open = false }) }
            }
        }
    }
}

/** Standings table with a seat bar: the same block on the desk, results and analysis. */
@Composable
internal fun StandingsTable(rows: List<NativeStanding>, unit: String, total: Int, majority: Int, player: String?) {
    SeatBar(rows.map { partyFill(it.color) to it.units }, total, majority,
        description = rows.joinToString("; ") { "${it.name} ${it.units} $unit" } + ". $majority needed for a majority.")
    Row(Modifier.fillMaxWidth().padding(horizontal = MovSpace.s1_5)) {
        Text("PARTY", Modifier.weight(1f), color = Mov.Text4, style = MaterialTheme.typography.labelSmall)
        Text(unit.uppercase(), Modifier.widthIn(min = 40.dp), color = Mov.Text4, style = MaterialTheme.typography.labelSmall, textAlign = androidx.compose.ui.text.style.TextAlign.End)
        Text("VOTE", Modifier.padding(start = MovSpace.s2).widthIn(min = 52.dp), color = Mov.Text4, style = MaterialTheme.typography.labelSmall, textAlign = androidx.compose.ui.text.style.TextAlign.End)
    }
    rows.forEach { row ->
        PartyRow(row.color, row.name, listOf("${row.units}", percent(row.voteShare)), highlight = row.partyId == player, tag = if (row.partyId == player) "You" else null)
    }
}

@Composable
fun WorldCampaignScreen(session: GameSession) {
    val campaign by session.campaign.collectAsState()
    val version by session.campaignVersion.collectAsState()
    val game = campaign ?: return
    val rows = remember(game, version) { game.standings() }
    val regions = remember(game, version) { game.regions() }
    var regionId by remember(game) { mutableStateOf("") }
    var type by remember(game) { mutableStateOf("broadcast") }
    var mode by remember(game) { mutableStateOf("positive") }
    var spend by remember(game) { mutableFloatStateOf(1.5f) }
    var issueId by remember(game) { mutableStateOf(game.issues().first().id) }
    var rival by remember(game) { mutableStateOf("") }
    var day by remember(game) { mutableIntStateOf(1) }
    var confirmEmptyWeek by remember(game) { mutableStateOf(false) }
    var showRecap by remember(game) { mutableStateOf(false) }
    var notice by remember(game) { mutableStateOf<String?>(null) }
    var showHistory by remember(game) { mutableStateOf(false) }
    fun requestEndWeek() { if (game.plan().isEmpty()) confirmEmptyWeek = true else if (session.endWorldWeek()) showRecap = game.recap().isNotEmpty() }
    val unit = game.unitName()
    val flag = remember(game) { NativeCatalog.country(game.countryId())?.flag ?: "" }
    val player = game.playerParty()
    val mine = rows.firstOrNull { it.partyId == player }
    var lastShortcut by remember { mutableIntStateOf(session.shortcutSequence) }
    LaunchedEffect(session.shortcutSequence) {
        if (lastShortcut == session.shortcutSequence) return@LaunchedEffect
        lastShortcut = session.shortcutSequence
        if (session.shortcut == "escape") { showRecap = false; regionId = "" }
        if (!game.hasPendingEvent() && !game.isOver() && !showRecap) {
            val index = session.shortcut.toIntOrNull()?.minus(1)
            if (index != null && index in game.actionTypes().indices) type = game.actionTypes()[index]
            if (session.shortcut in listOf("enter", " ")) requestEndWeek()
        }
    }
    if (confirmEmptyWeek) AlertDialog(onDismissRequest = { confirmEmptyWeek = false }, title = { Text("End week without moves?") },
        text = { Text("You have no actions queued this week. Unspent slots win nothing. End the week anyway?") },
        confirmButton = { TextButton(onClick = { confirmEmptyWeek = false; if (session.endWorldWeek()) showRecap = game.recap().isNotEmpty() }) { Text("End week") } },
        dismissButton = { TextButton(onClick = { confirmEmptyWeek = false }) { Text("Keep planning") } },
        containerColor = Mov.Surface2)
    val regional = type in listOf("rally", "surrogate", "ground_game", "gotv", "canvass")
    val selectedRegion = regions.firstOrNull { it.id == regionId }
    Column(Modifier.fillMaxSize()) {
    LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        item { NativeCampaignCoach(session, game.countryId(), game.goalText(), game.turn(), regionId.takeIf { it.isNotEmpty() }, game.plan().size) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                Eyebrow(if (game.isOver()) "Election result" else "Week ${game.turn() + 1} of ${game.totalTurns()}", color = Mov.Warning)
                Text("$flag ${game.label()}".trim(), style = MaterialTheme.typography.headlineSmall, color = Mov.Text1)
                StatRow {
                    Metric("${mine?.units ?: 0}/${game.majority()}", "Your $unit", color = partyInk(mine?.color))
                    Metric("${game.currency()}${number(game.funds())}M", "Cash")
                    if (!game.isOver()) Metric("${game.slotsLeft()}", "Moves left")
                    Metric(percent(mine?.voteShare ?: 0.0), "Vote share")
                }
                Text(game.goalText(), color = Mov.Text3, style = MaterialTheme.typography.bodySmall)
            }
        }
        if (game.hasPendingEvent()) item {
            Callout("Decision required", "${game.eventTitle()}\n${game.eventPrompt()}") {
                game.eventChoices().forEach { choice -> SecondaryButton(choice.text, {
                    if (game.answerEvent(choice.id)) { notice = choice.resultText; session.campaignChanged() }
                }, Modifier.fillMaxWidth()) }
            }
        }
        notice?.let { item { Notice(it) } }
        item {
            MovCard {
                CardHead(if (game.isOver()) game.outcome() else "Projected standings") { Tag("${game.majority()} to win", TagKind.Outline) }
                StandingsTable(rows, unit, game.totalUnits(), game.majority(), player)
                Text("${game.majority()} of ${game.totalUnits()} $unit to win outright", color = Mov.Text4, style = MaterialTheme.typography.bodySmall)
            }
        }
        item {
            MovCard {
                CardHead(if (game.isOver()) "Regional results" else "Regional projections") {
                    if (selectedRegion != null) IconButton(onClick = { regionId = "" }) { Icon(Icons.Filled.Close, contentDescription = "Clear region selection", tint = Mov.Text3) }
                }
                NativeCountryMap(game.map(), regions.associate { it.id to partyFill(it.color) }, regionId.takeIf { it.isNotEmpty() }, { id -> regionId = if (regionId == id) "" else id },
                    "Map of ${regions.size} regions, colored by the leading party. Choose a region from the list below the map.")
                val leaders = regions.groupBy { it.winner }.map { (name, list) -> Triple(name, list.first().color, list.size) }.sortedByDescending { it.third }
                ChipRow { leaders.forEach { (name, color, count) ->
                    Row(Modifier.padding(end = MovSpace.s2, bottom = MovSpace.s1), verticalAlignment = Alignment.CenterVertically) {
                        PartySwatch(partyFill(color), size = 10.dp)
                        Text(" $name $count", color = Mov.Text3, style = MaterialTheme.typography.labelMedium)
                    }
                } }
                if (selectedRegion != null) Inset {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(selectedRegion.name, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
                        Text("${selectedRegion.totalUnits} $unit", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium.num)
                    }
                    game.regionStandings(regionId).filter { it.units > 0 || it.voteShare >= 0.01 }.forEach { row ->
                        PartyRow(row.color, row.name, listOf("${row.units}", percent(row.voteShare)), highlight = row.partyId == player)
                    }
                    if (!game.isOver()) Text("Regional moves in your plan target this region.", color = Mov.Text3, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            MovCard(tight = true) {
                CardHead("Regions") { Text("Leader · $unit · you", color = Mov.Text4, style = MaterialTheme.typography.labelMedium) }
                regions.forEach { region ->
                    val on = region.id == regionId
                    Row(Modifier.fillMaxWidth().heightIn(min = MovSpace.touch).clip(MovRadius.md)
                        .background(if (on) Mov.Surface3 else Color.Transparent)
                        .then(if (on) Modifier.border(1.5.dp, Mov.Warning, MovRadius.md) else Modifier)
                        .clickable(onClickLabel = if (on) "Clear selection" else "Select region") { regionId = if (on) "" else region.id }
                        .semantics { selected = on }
                        .padding(horizontal = MovSpace.s2), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                        PartySwatch(partyFill(region.color))
                        Column(Modifier.weight(1f)) {
                            Text(region.name, color = Mov.Text1, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${region.winner} leads", color = partyInk(region.color), style = MaterialTheme.typography.labelMedium, maxLines = 1)
                        }
                        Text("${region.totalUnits}", Modifier.widthIn(min = 32.dp), color = Mov.Text2, style = MaterialTheme.typography.bodyMedium.num, textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Column(horizontalAlignment = Alignment.End, modifier = Modifier.widthIn(min = 64.dp)) {
                            Text("${region.playerUnits}", color = Mov.Text1, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.Bold)
                            Text(percent(region.playerShare), color = Mov.Text3, style = MaterialTheme.typography.labelMedium.num)
                        }
                    }
                }
            }
        }
        if (!game.isOver()) {
            item { MovCard {
                CardHead("Week plan") { Tag("${game.slotsLeft()} moves left", if (game.slotsLeft() > 0) TagKind.Accent else TagKind.Outline) }
                KeyValue("Cash", "${game.currency()}${number(game.funds())}M")
                KeyValue("Planned spend", "${game.currency()}${number(game.plannedSpend())}M")
                KeyValue("Available", "${game.currency()}${number(game.availableFunds())}M")
                Text("Plan estimate: ${game.previewPlayerUnits()} $unit after your queued actions. Rival moves and events can change the result.", style = MaterialTheme.typography.bodySmall, color = Mov.Info)
                PlanBonusHints(game.planBonuses())
                Eyebrow("Action")
                ChipRow { game.actionTypes().forEach { id -> MovChip(actionName(id), type == id, { type = id; notice = null }) } }
                ChoicePicker("Target", regionId, listOf("" to "National") + regions.map { it.id to "${it.name} · ${it.totalUnits} $unit" }) { regionId = it }
                if (regional && regionId.isEmpty()) Text("Choose a region for this action.", color = Mov.Warning, style = MaterialTheme.typography.bodySmall)
                Eyebrow("Day")
                ChipRow { (1..7).forEach { n -> MovChip("$n", day == n, { day = n }) } }
                if (type == "broadcast") {
                    Eyebrow("Broadcast mode")
                    Segmented(listOf("positive", "contrast", "issue").map { it to actionName(it) }, mode, { mode = it }, label = "Broadcast mode")
                    KeyValue("Spend", "${game.currency()}${number(spend.toDouble())}M")
                    Slider(spend, { spend = it }, valueRange = 0.5f..10f, modifier = Modifier.semantics { contentDescription = "Campaign spend in millions" },
                        colors = SliderDefaults.colors(thumbColor = Mov.Accent, activeTrackColor = Mov.Accent, inactiveTrackColor = Mov.Sunken))
                    Text(if (regionId.isEmpty()) "National reaches every region where your party stands." else "Regional spending concentrates on this target.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                }
                if (type == "issue_pivot" || (type == "broadcast" && mode == "issue")) {
                    ChoicePicker("Issue", issueId, game.issues().map { it.id to "${it.name} · ${number(it.salience * 100)}% salience" }) { issueId = it }
                    Text(game.issues().first { it.id == issueId }.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                }
                if (type == "oppo_research" || (type == "broadcast" && mode == "contrast"))
                    ChoicePicker("Rival", rival, listOf("" to "Leading rival") + game.rivals().map { it.partyId to it.name }) { rival = it }
                SecondaryButton("Add ${actionName(type)} to day $day", {
                    val added = game.queue(type, regionId.ifEmpty { null }, day, if (type == "broadcast") mode else null,
                        if (type == "broadcast") spend.toDouble() else null,
                        if (type == "issue_pivot" || (type == "broadcast" && mode == "issue")) issueId else null,
                        if (type == "oppo_research" || (type == "broadcast" && mode == "contrast")) rival.ifEmpty { null } else null)
                    if (added) { notice = null; session.campaignChanged() } else notice = "Check your target, cash, remaining moves, and the three-move daily limit."
                }, Modifier.fillMaxWidth(), enabled = game.slotsLeft() > 0 && !game.hasPendingEvent() && (!regional || regionId.isNotEmpty()))
                if (game.plan().isNotEmpty()) {
                    Hairline()
                    Eyebrow("${game.plan().size} planned")
                    game.plan().forEach { action ->
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Text("DAY ${action.day}", Modifier.width(48.dp), color = Mov.Warning, style = MaterialTheme.typography.labelSmall)
                            Column(Modifier.weight(1f)) {
                                Text(action.title, color = Mov.Text1, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                Text("${action.detail} · ${game.currency()}${number(action.cost)}M", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                            }
                            IconButton(onClick = { game.removeAction(action.index); session.campaignChanged() }) {
                                Icon(Icons.Filled.Close, contentDescription = "Remove ${action.title} from day ${action.day}", tint = Mov.Text3)
                            }
                        }
                    }
                }
            } }
        } else {
            item { ScorePosting(session) }
            if (game.isCustom()) item { Tag("Custom campaign · casual only", TagKind.Warning) }
            item { game.resultSummary()?.let { summary -> MovCard {
                CardHead("Campaign score") { Text("${summary.score} / 1000", style = MaterialTheme.typography.titleLarge.num, color = Mov.Text1, fontWeight = FontWeight.Bold) }
                KeyValue("Difficulty", summary.difficulty.replaceFirstChar { it.uppercase() })
                KeyValue("${unit.replaceFirstChar { it.uppercase() }} above majority", "${summary.unitMargin}")
                KeyValue("Vote margin vs. leading rival", "${signed(summary.popularMargin)} pts")
            } } }
            item { MovCard {
                CardHead("What decided it")
                game.resultCauses().forEach { Text(it, color = Mov.Text2, style = MaterialTheme.typography.bodyMedium) }
            } }
            item { MovCard {
                CardHead("Compared with history") { GhostButton(if (showHistory) "Hide" else "Show", { showHistory = !showHistory }) }
                if (showHistory) game.historicalRegions().forEach { region ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(region.name, color = Mov.Text1, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Text("${region.units} $unit now · ${region.historicalUnits} historically", color = Mov.Text3, style = MaterialTheme.typography.bodySmall.num)
                        }
                        Text(signed(region.shareSwing), color = if (region.shareSwing >= 0) Mov.Positive else Mov.Negative, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.Bold)
                    }
                }
            } }
            item { SecondaryButton("Choose another campaign", { session.go(Screen.LIBRARY) }, Modifier.fillMaxWidth()) }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                GhostButton("Analysis", { session.go(Screen.ANALYSIS) })
                if (session.canViewReplay()) GhostButton("Replay and report", { session.go(Screen.REPLAY) })
                if (!game.isOver()) GhostButton("Undo week", session::undo, enabled = session.canUndo())
            }
        }
        if (game.news().isNotEmpty()) item { MovCard(tight = true) {
            CardHead("Campaign news")
            game.news().forEach { Row {
                Text("WK ${it.turn + 1}", Modifier.width(44.dp), color = Mov.Text4, style = MaterialTheme.typography.labelSmall)
                Text(it.text, color = Mov.Text2, style = MaterialTheme.typography.bodySmall)
            } }
        } }
    }
    if (!game.isOver()) ActionBar {
        PrimaryButton("End week · ${game.plan().size} planned", { requestEndWeek() }, Modifier.weight(1f), enabled = !game.hasPendingEvent())
    }
    }
    if (showRecap) AlertDialog(onDismissRequest = { showRecap = false }, title = { Text("Week in review") },
        text = { LazyColumn { items(game.recap()) { Text("${it.label}: ${it.detail}", Modifier.padding(vertical = 6.dp), color = Mov.Text2) } } },
        confirmButton = { TextButton(onClick = { showRecap = false }) { Text("Continue") } }, containerColor = Mov.Surface2)
}
