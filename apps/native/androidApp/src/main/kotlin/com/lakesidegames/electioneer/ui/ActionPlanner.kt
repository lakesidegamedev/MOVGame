package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.SliderDefaults
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.ActionType
import com.lakesidegames.electioneer.engine.AdMode
import com.lakesidegames.electioneer.engine.GameState
import com.lakesidegames.electioneer.engine.IssueId
import com.lakesidegames.electioneer.engine.liveIssueIds
import com.lakesidegames.electioneer.engine.plannedActionRows
import com.lakesidegames.electioneer.engine.plannedBonuses
import com.lakesidegames.electioneer.engine.PlanBonus
import com.lakesidegames.electioneer.engine.PLAN_BONUSES
import com.lakesidegames.electioneer.engine.projectPlannedElection

private val ACTIONS = listOf(
    ActionType.ADVERTISE to "Advertising", ActionType.RALLY to "Rally",
    ActionType.SURROGATE to "Surrogate", ActionType.FUNDRAISE to "Fundraise",
    ActionType.GROUND_GAME to "Field offices", ActionType.GOTV to "GOTV",
    ActionType.OPPO_RESEARCH to "Oppo research", ActionType.DEBATE_PREP to "Debate prep",
    ActionType.POLICY_PREP to "Policy prep", ActionType.ISSUE_PIVOT to "Issue pivot",
)

@Composable
fun ActionPlanner(session: GameSession, game: GameState, selectedId: String?) {
    var type by remember { mutableStateOf(ActionType.ADVERTISE) }
    var target by remember { mutableStateOf("PA") }
    var day by remember { mutableIntStateOf(1) }
    var adMode by remember { mutableStateOf(AdMode.POSITIVE) }
    var spend by remember { mutableFloatStateOf(8f) }
    // Only the issues this election has, under its own names.
    val liveIssues = remember(game.scenarioId, game.issues.keys) { game.liveIssueIds() }
    var issue by remember(game.scenarioId) { mutableStateOf(liveIssues.firstOrNull() ?: IssueId.ECONOMY) }
    var position by remember(game.scenarioId) {
        mutableFloatStateOf((game.candidates[game.playerCandidate.serial]?.issuePositions?.get(issue.serial) ?: 0.0).toFloat())
    }
    var notice by remember { mutableStateOf<String?>(null) }
    val states = remember(game.scenarioId) { game.states.filter { it.blocs.isNotEmpty() } }
    LaunchedEffect(selectedId) {
        if (selectedId != null && states.any { it.id == selectedId }) target = selectedId
    }
    var lastShortcut by remember { mutableIntStateOf(session.shortcutSequence) }
    LaunchedEffect(session.shortcutSequence) {
        if (lastShortcut == session.shortcutSequence) return@LaunchedEffect
        lastShortcut = session.shortcutSequence
        val index = session.shortcut.toIntOrNull()?.minus(1)
        if (session.pendingDialog.value == null && session.recap.value == null && index != null && index in ACTIONS.indices) type = ACTIONS[index].first
    }
    val targetsState = type in setOf(ActionType.ADVERTISE, ActionType.RALLY, ActionType.SURROGATE, ActionType.GROUND_GAME, ActionType.GOTV, ActionType.FUNDRAISE)
    val dayCount = game.queuedActions.count { (it.day ?: 1) == day }
    val plannedSpend = game.queuedActions.sumOf { if (it.type == ActionType.ADVERTISE) it.spend ?: 0.0 else 0.0 }
    val availableCash = ((game.resources[game.playerCandidate.serial]?.cash ?: 0.0) - plannedSpend).coerceAtLeast(0.0)

    MovCard {
        CardHead("Week plan") { Tag("${session.slotsLeft()} actions left", if (session.slotsLeft() > 0) TagKind.Accent else TagKind.Outline) }
        KeyValue("Planned ads", "$${"%.1f".format(plannedSpend / 1_000_000)}M")
        KeyValue("Available cash", "$${"%.1f".format(availableCash / 1_000_000)}M")
        if (game.queuedActions.isNotEmpty()) {
            Text("Plan estimate: ${projectPlannedElection(game).ev.getValue(game.playerCandidate.serial)} EV. Rival moves and events can change the result.",
                style = MaterialTheme.typography.bodySmall, color = Mov.Info)
        }
        PlanBonusHints(plannedBonuses(game))
        Eyebrow("Action")
        ChipRow { ACTIONS.forEach { (action, label) -> MovChip(label, type == action, { type = action; notice = null }) } }
        if (targetsState) ChoicePicker("Target state", target, states.map { it.id to "${it.name} · ${it.electoralVotes} EV" }) { target = it }
        if (type == ActionType.ADVERTISE) {
            Eyebrow("Ad mode")
            Segmented(AdMode.entries.map { it.serial to it.serial.replaceFirstChar(Char::titlecase) }, adMode.serial, { id -> adMode = AdMode.entries.first { it.serial == id } }, label = "Ad mode")
            KeyValue("Spend", "$${spend.toInt()}M")
            Slider(value = spend, onValueChange = { spend = it }, valueRange = 1f..30f, steps = 28, modifier = Modifier.semantics { contentDescription = "Ad spend in millions" },
                colors = SliderDefaults.colors(thumbColor = Mov.Accent, activeTrackColor = Mov.Accent, inactiveTrackColor = Mov.Sunken))
        }
        if (type == ActionType.ISSUE_PIVOT || (type == ActionType.ADVERTISE && adMode == AdMode.ISSUE)) {
            ChoicePicker("Issue", issue.serial, liveIssues.map { it.serial to (game.issues[it.serial]?.name ?: it.serial) }) { id ->
                issue = IssueId.entries.first { it.serial == id }
                position = (game.candidates[game.playerCandidate.serial]?.issuePositions?.get(id) ?: 0.0).toFloat()
            }
        }
        if (type == ActionType.ISSUE_PIVOT) {
            KeyValue("Position, left -1 to right +1", "%.2f".format(position))
            Slider(value = position, onValueChange = { position = it }, valueRange = -1f..1f, modifier = Modifier.semantics { contentDescription = "Issue position: ${game.issues[issue.serial]?.name ?: issue.serial}" },
                colors = SliderDefaults.colors(thumbColor = Mov.Accent, activeTrackColor = Mov.Accent, inactiveTrackColor = Mov.Sunken))
        }
        Eyebrow("Day · $dayCount of 3 used")
        ChipRow { (1..7).forEach { n -> MovChip("$n", day == n, { day = n }) } }
        SecondaryButton("Add to day $day", {
            val added = session.queueConfiguredAction(type, if (targetsState) target else null, day,
                if (type == ActionType.ADVERTISE) adMode else null,
                if (type == ActionType.ADVERTISE) spend.toInt().toDouble() else null,
                if (type == ActionType.ISSUE_PIVOT || (type == ActionType.ADVERTISE && adMode == AdMode.ISSUE)) issue else null,
                if (type == ActionType.ISSUE_PIVOT) position.toDouble() else null)
            notice = if (added) null else "Check your day, action slots, and available cash."
        }, Modifier.fillMaxWidth(), enabled = session.slotsLeft() > 0 && dayCount < 3 && (type != ActionType.ADVERTISE || spend * 1_000_000 <= availableCash))
        if (dayCount >= 3) Text("Day $day is full. Choose another day.", style = MaterialTheme.typography.bodySmall, color = Mov.Warning)
        else if (session.slotsLeft() == 0) Text("Weekly action pool is spent.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
        notice?.let { Text(it, color = Mov.Negative, style = MaterialTheme.typography.bodySmall) }
        Hairline()
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("${game.queuedActions.size} planned", Modifier.weight(1f), style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
            GhostButton("Clear all", { session.clearQueue() }, enabled = game.queuedActions.isNotEmpty())
        }
        val rows = plannedActionRows(game)
        (1..7).forEach { n ->
            val items = rows.filter { it.day == n }
            Row(Modifier.fillMaxWidth().heightIn(min = 32.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("DAY $n", modifier = Modifier.width(52.dp), color = if (items.isEmpty()) Mov.Text4 else Mov.Warning, style = MaterialTheme.typography.labelSmall)
                if (items.isEmpty()) Text("Open", style = MaterialTheme.typography.bodySmall, color = Mov.Text4)
                else Column(Modifier.weight(1f)) {
                    items.forEach { item ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(item.label, Modifier.weight(1f), color = Mov.Text1, style = MaterialTheme.typography.bodyMedium)
                            IconButton(onClick = { session.removeAction(item.index) }) {
                                Icon(Icons.Filled.Close, contentDescription = "Remove ${item.label} from day $n", tint = Mov.Text3)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun PlanBonusHints(active: List<PlanBonus>) {
    var expanded by remember { mutableStateOf(false) }
    if (active.isNotEmpty()) ChipRow { active.forEach { bonus -> Tag("${bonus.name} +${bonus.percent}%", TagKind.Positive, Modifier.padding(bottom = 4.dp)) } }
    GhostButton(if (expanded) "Hide plan bonuses" else "How to combine moves", { expanded = !expanded }, color = Mov.Text2)
    if (expanded) Inset { PLAN_BONUSES.forEach { bonus ->
        Text("${bonus.recipe} · +${bonus.percent}%", style = MaterialTheme.typography.labelLarge, color = Mov.Text1)
        Text(bonus.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
    } }
}
