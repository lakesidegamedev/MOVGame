package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.MobileCampaign

@Composable
fun DailyBoardsScreen(session: GameSession) {
    val account = session.account
    val user by account.user.collectAsState()
    val board by account.board.collectAsState()
    val rank by account.dailyRank.collectAsState()
    val champions by account.champions.collectAsState()
    val notice by account.notice.collectAsState()
    var selected by remember { mutableStateOf("champions") }
    var date by remember { mutableStateOf(nativeUtcDay()) }
    val elections = remember { MobileCampaign.countries().flatMap { MobileCampaign.elections(it.id) } }
    val dateValid = Regex("\\d{4}-\\d{2}-\\d{2}").matches(date)
    fun refresh() {
        if (selected == "champions") account.loadChampions()
        else if (dateValid) account.loadBoard(date, selected.takeIf { it != "daily" })
    }
    LaunchedEffect(selected, date, user?.id) { refresh() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        ScreenHeader("Leaderboards", "Daily and campaign boards", "Daily champions, the daily challenge, and every election's best scores.")
        ChoicePicker("Board", selected, listOf("champions" to "Daily champions", "daily" to "Daily challenge") + elections.map { it.scenarioId to "${it.flag} ${it.label}" }) { selected = it }
        if (selected == "daily") OutlinedTextField(date, { date = it.take(10) }, label = { Text("Daily date (YYYY-MM-DD, UTC)") }, singleLine = true, isError = !dateValid,
            modifier = Modifier.fillMaxWidth(), colors = movFieldColors(), shape = MovRadius.md)
        notice?.let { Notice(it) }
        MovCard(tight = true) {
            if (selected == "champions") {
                val table = champions
                CardHead("Daily champions") { table?.let { Text("${it.totalDays} days played", color = Mov.Text3, style = MaterialTheme.typography.labelMedium.num) } }
                if (table == null || table.entries.isEmpty()) Text("No daily champions yet.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                table?.entries?.forEach { entry ->
                    Row(Modifier.fillMaxWidth().heightIn(min = 40.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                        Text("#${entry.rank}", Modifier.width(40.dp), color = if (entry.rank <= 3) Mov.Warning else Mov.Text3, style = MaterialTheme.typography.titleSmall.num)
                        Column(Modifier.weight(1f)) {
                            Text(entry.username, color = Mov.Text1, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Text("${entry.wins} wins · ${entry.podiums} podiums · ${entry.played} played", color = Mov.Text3, style = MaterialTheme.typography.bodySmall.num)
                        }
                        Text("${entry.totalScore}", color = Mov.Text1, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                CardHead("Scores")
                rank?.let { KeyValue("Your rank", "#${it.rank} · ${it.score}", valueColor = Mov.Positive) }
                if (board.isEmpty()) Text("No scores to show yet. You can keep playing offline.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                board.forEach { entry ->
                    Row(Modifier.fillMaxWidth().heightIn(min = 36.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                        Text("#${entry.rank}", Modifier.width(40.dp), color = if (entry.rank <= 3) Mov.Warning else Mov.Text3, style = MaterialTheme.typography.titleSmall.num)
                        Text(entry.username, Modifier.weight(1f), color = Mov.Text1, style = MaterialTheme.typography.bodyMedium)
                        Text("${entry.score}", color = Mov.Text1, style = MaterialTheme.typography.bodyMedium.num, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        GhostButton("Refresh leaderboard", ::refresh)
    }
}
