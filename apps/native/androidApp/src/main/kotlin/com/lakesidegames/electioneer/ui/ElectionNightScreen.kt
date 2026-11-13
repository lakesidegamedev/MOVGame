package com.lakesidegames.electioneer.ui

import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

@Composable
fun ElectionNightScreen(session: GameSession) {
    val night by session.electionNight.collectAsState()
    val reveal = night ?: return
    val context = LocalContext.current
    val reduced = session.reducedMotion() || Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    var index by remember(reveal) { mutableIntStateOf(if (reduced) reveal.count() else 0) }
    var speed by remember(reveal) { mutableIntStateOf(1) }
    var instant by remember(reveal) { mutableStateOf(reduced) }
    val data = reveal.data()
    val board = reveal.board(index)
    LaunchedEffect(reveal, index, speed, instant) {
        if (index < reveal.count()) { delay(reveal.delay(index, speed).toLong()); index++ }
        else if (instant && !session.captureHoldReveal) { delay(1500); session.finishReveal() }
    }
    val leader = board.rows.maxByOrNull { it.units }
    Column(Modifier.fillMaxSize()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Eyebrow(if (board.finished) "Final" else "Live", color = if (board.finished) Mov.Text3 else Mov.Negative)
                    Text(data.title, style = MaterialTheme.typography.headlineSmall, color = Mov.Text1)
                }
            }
            Segmented(listOf("1" to "1×", "2" to "2×", "instant" to "Instant"), if (instant) "instant" else "$speed", { id ->
                if (id == "instant") { instant = true; index = reveal.count() } else { speed = id.toInt(); instant = false }
            }, label = "Reveal speed")
            MovCard {
                Text(board.status, color = Mov.Warning, style = MaterialTheme.typography.labelLarge, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                board.projection?.let { Text(it, style = MaterialTheme.typography.titleLarge, color = Mov.Text1) }
                SeatBar(board.rows.map { partyFill(it.color) to it.units }, data.totalUnits, data.threshold.takeIf { data.pluralityWinner == null },
                    description = board.rows.joinToString("; ") { "${it.name} ${it.units} ${data.unitLabel}" } + ". ${data.goalLabel()}.")
                board.rows.forEach { row ->
                    PartyRow(row.color, row.name, listOf("${row.units}"), highlight = row.id == data.playerPartyId, tag = if (row.id == data.playerPartyId) "You" else null,
                        logo = reveal.logo(row.id))
                }
                KeyValue("Called", "${board.calledUnits} of ${data.totalUnits}")
                KeyValue("Goal", data.goalLabel())
                KeyValue("Remaining", "${board.remaining}")
            }
            MovCard(tight = true) {
                CardHead("Results map") { leader?.let { Text("${it.name} leads", color = partyInk(it.color), style = MaterialTheme.typography.labelLarge) } }
                val called = board.called.associateBy { it.id }
                NativeCountryMap(reveal.map(), called.mapValues { partyFill(it.value.winnerColor) }, null, null,
                    "Election map. " + board.called.joinToString { "${it.name}: ${it.winnerShort} leads" }, maxHeight = 280.dp)
                board.lastCall?.let { Text(it, style = MaterialTheme.typography.titleSmall, color = Mov.Text1, fontWeight = FontWeight.SemiBold) }
            }
        }
        ActionBar {
            if (board.finished) PrimaryButton("View full results", session::finishReveal, Modifier.weight(1f))
            else SecondaryButton("Skip to results", session::finishReveal, Modifier.weight(1f))
        }
    }
}

