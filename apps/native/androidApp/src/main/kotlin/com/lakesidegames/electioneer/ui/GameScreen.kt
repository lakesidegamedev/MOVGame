package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.CandidateId
import com.lakesidegames.electioneer.engine.NativeMoney
import com.lakesidegames.electioneer.engine.electoralRule

// U.S. campaign desk: scoreboard, state tile map, seven-day plan, events and recap.
@Composable
fun GameScreen(session: GameSession) {
    val game by session.game.collectAsState()
    val projection by session.projection.collectAsState()
    val selectedId by session.selected.collectAsState()
    val pending by session.pendingDialog.collectAsState()
    val eventResult by session.eventResult.collectAsState()
    val recap by session.recap.collectAsState()
    val g = game.state ?: return
    // Older elections have smaller colleges (531 votes, 266 to win in 1932).
    val college = remember(g.scenarioId, g.customScenario) { g.electoralRule() }
    var confirmEmptyWeek by remember { mutableStateOf(false) }
    fun requestEndWeek() { if (pending == null && recap == null) { if (g.queuedActions.isEmpty()) confirmEmptyWeek = true else session.endTurn() } }
    var lastShortcut by remember { mutableIntStateOf(session.shortcutSequence) }
    LaunchedEffect(session.shortcutSequence) {
        if (lastShortcut == session.shortcutSequence) return@LaunchedEffect
        lastShortcut = session.shortcutSequence
        if (session.shortcut == "escape") { if (recap != null) session.dismissRecap() else session.select(null) }
        if (session.shortcut in listOf("enter", " ") && pending == null && recap == null ) requestEndWeek()
    }

    if (confirmEmptyWeek) AlertDialog(onDismissRequest = { confirmEmptyWeek = false },
        title = { Text("End week without moves?") }, text = { Text("You have no actions queued this week. Unspent slots win nothing. End the week anyway?") },
        confirmButton = { TextButton(onClick = { confirmEmptyWeek = false; session.endTurn() }) { Text("End week") } },
        dismissButton = { TextButton(onClick = { confirmEmptyWeek = false }) { Text("Keep planning") } }, containerColor = Mov.Surface2)
    val abbrToStateId = remember(g) { g.states.associate { it.abbr.uppercase() to it.id } }
    val idToAbbr = remember(g) { g.states.associate { it.id to it.abbr.uppercase() } }
    val selectedAbbr = selectedId?.let { idToAbbr[it] }
    val res = g.resources[g.playerCandidate.serial]
    val demEv = projection?.ev?.get(CandidateId.DEM.serial) ?: 0
    val repEv = projection?.ev?.get(CandidateId.REP.serial) ?: 0
    val tossEv = projection?.tossupEv ?: 0
    val selectedState = g.states.firstOrNull { it.id == selectedId }
    val selectedContest = projection?.contests?.firstOrNull { it.stateId == selectedId }
    val dem = g.candidates.getValue("dem")
    val rep = g.candidates.getValue("rep")
    val label = g.customScenario?.let { com.lakesidegames.electioneer.engine.NativeCustomScenario.entry(it)?.label }
        ?: session.campaigns().firstOrNull { it.id == g.scenarioId }?.label ?: "The election"
    fun leanText(lean: String?, share: Double): String = when (lean) {
        CandidateId.DEM.serial -> "${dem.shortName} ${percent(share)}"
        CandidateId.REP.serial -> "${rep.shortName} ${percent(1 - share)}"
        else -> "Tossup"
    }

    Column(Modifier.fillMaxSize()) {
      NativeCampaignCoach(session, "US", "Win ${college.majority} electoral votes in ${g.totalTurns} weeks.", g.turn, selectedId, g.queuedActions.size)
      Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        Column(verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
            Eyebrow("Campaign desk · Week ${g.turn + 1}/${g.totalTurns}", color = Mov.Warning)
            Text(label, style = MaterialTheme.typography.headlineSmall, color = Mov.Text1)
        }
        MovCard {
            Row(verticalAlignment = Alignment.Bottom) {
                Metric("$demEv", dem.shortName, color = Mov.DemText)
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${college.majority} TO WIN", color = Mov.Text2, style = MaterialTheme.typography.labelSmall)
                    Text("$tossEv tossup", color = Mov.Text3, style = MaterialTheme.typography.labelMedium.num)
                }
                Metric("$repEv", rep.shortName, color = Mov.GopText, alignEnd = true)
            }
            SeatBar(listOf(Mov.Dem to demEv, Mov.Tossup to tossEv, Mov.Gop to repEv), college.total, college.majority,
                description = "${dem.shortName} $demEv, tossup $tossEv, ${rep.shortName} $repEv electoral votes. ${college.majority} to win.")
            StatRow {
                Metric(NativeMoney.millions("$", (res?.cash ?: 0.0) / 1_000_000), "Cash")
                Metric("${session.slotsLeft()}", "Actions left")
                Metric("${g.queuedActions.size}", "Planned")
            }
        }
        MovCard(tight = true) {
            CardHead("Electoral map") {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                    PartySwatch(Mov.Dem, size = 10.dp); Text(dem.shortName, color = Mov.Text3, style = MaterialTheme.typography.labelMedium)
                    PartySwatch(Mov.Tossup, size = 10.dp); Text("Tossup", color = Mov.Text3, style = MaterialTheme.typography.labelMedium)
                    PartySwatch(Mov.Gop, size = 10.dp); Text(rep.shortName, color = Mov.Text3, style = MaterialTheme.typography.labelMedium)
                }
            }
            TileMap(projection = projection, abbrToStateId = abbrToStateId, selectedAbbr = selectedAbbr,
                onSelect = { id, _ -> session.select(id) },
                describe = { id ->
                    val state = g.states.first { it.id == id }
                    val contest = projection?.contests?.firstOrNull { it.stateId == id }
                    "${state.name}, ${state.electoralVotes} electoral votes, ${contest?.let { leanText(it.lean, it.demShare) } ?: "no projection"}"
                })
            if (selectedState != null && selectedContest != null) Inset {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(selectedState.name, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
                    Tag("${selectedState.electoralVotes} EV", TagKind.Outline)
                    IconButton(onClick = { session.select(null) }) { Icon(Icons.Filled.Close, contentDescription = "Clear state selection", tint = Mov.Text3) }
                }
                Meter(selectedContest.demShare.toFloat(), Mov.Dem, height = 8.dp, mark = 0.5f)
                Row {
                    Text("${dem.shortName} ${percent(selectedContest.demShare)}", Modifier.weight(1f), color = Mov.DemText, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.SemiBold)
                    Text("${rep.shortName} ${percent(1 - selectedContest.demShare)}", color = Mov.GopText, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.SemiBold)
                }
                Text("State moves in your plan target ${selectedState.name}.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            }
        }
        ActionPlanner(session, g, selectedId)
        Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
            GhostButton("Analysis", { session.go(Screen.ANALYSIS) })
            if (session.canViewReplay()) GhostButton("Replay and report", { session.go(Screen.REPLAY) })
            GhostButton("Undo", session::undo, enabled = session.canUndo())
        }
      }
      ActionBar {
          PrimaryButton("End week · ${g.queuedActions.size} planned", { requestEndWeek() }, Modifier.weight(1f))
      }
    }

    recap?.let { lines ->
        AlertDialog(
            onDismissRequest = { session.dismissRecap() },
            title = { Text("Week ${g.turn} recap") },
            text = { Column(verticalArrangement = Arrangement.spacedBy(MovSpace.s1_5)) { for (line in lines) Text(line, style = MaterialTheme.typography.bodyMedium, color = Mov.Text2) } },
            confirmButton = { TextButton(onClick = { session.dismissRecap() }) { Text("Continue") } },
            containerColor = Mov.Surface2,
        )
    }

    pending?.let { pe ->
        val def = session.eventDef(pe.eventId)
        if (def != null) {
            val result = eventResult
            AlertDialog(
                onDismissRequest = {},
                title = { Column { Tag(if (result == null) "Decision required" else "Result", TagKind.Warning); Spacer(Modifier.height(MovSpace.s2)); Text(def.title) } },
                text = {
                    Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                        Text(result ?: def.prompt, color = Mov.Text2)
                        if (result == null) for (choice in session.availableChoices(pe.eventId)) {
                            SecondaryButton(choice.text, { session.answerEvent(pe.eventId, choice.id) }, Modifier.fillMaxWidth())
                        }
                    }
                },
                confirmButton = { if (result != null) TextButton(onClick = { session.closeEventDialog() }) { Text("Continue") } },
                containerColor = Mov.Surface2,
            )
        }
    }
}
