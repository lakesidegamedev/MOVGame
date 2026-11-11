package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.CandidateId
import com.lakesidegames.electioneer.engine.NativeResults

// U.S. results: outcome, electoral and popular totals, score, state table,
// what decided it, and the next campaign.
@Composable
fun ResultsScreen(session: GameSession) {
    val game by session.game.collectAsState()
    val g = game.state ?: return
    val result = g.result
    if (result == null) {
        Column(Modifier.fillMaxSize().padding(MovSpace.s6), horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(MovSpace.s3, Alignment.CenterVertically)) {
            Text("No result yet.", color = Mov.Text2)
            SecondaryButton("Back to setup", { session.go(Screen.SETUP) })
        }
        return
    }

    val demEv = result.electoralVotes[CandidateId.DEM.serial] ?: 0
    val repEv = result.electoralVotes[CandidateId.REP.serial] ?: 0
    val summary = remember(g, session.campaignDifficulty) { NativeResults.us(g, session.campaignDifficulty) }
    val achievements = remember(g, session.campaignDifficulty) { NativeResults.achievements(g, session.campaignDifficulty) }
    var showHistory by remember { mutableStateOf(false) }
    var showAllStates by remember { mutableStateOf(false) }
    val dem = g.candidates[CandidateId.DEM.serial]
    val rep = g.candidates[CandidateId.REP.serial]
    val winnerName = when (result.winner) {
        CandidateId.DEM.serial -> dem?.name ?: "Democrat"
        CandidateId.REP.serial -> rep?.name ?: "Republican"
        else -> "Tie"
    }
    val won = result.winner == g.playerCandidate.serial
    val stateNames = remember(g) { g.states.associate { it.id to it.name } }
    val sorted = remember(result) {
        result.stateResults.sortedWith(compareBy<com.lakesidegames.electioneer.engine.StateResult> { kotlin.math.abs(it.margin) }.thenBy { stateNames[it.stateId] })
    }
    val demPop = (result.popularShare[CandidateId.DEM.serial] ?: 0.5)

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        MovCard(color = Mov.Surface2, accent = won) {
            Eyebrow("Election result", color = if (won) Mov.Positive else Mov.Negative)
            Text(if (won) "Victory" else "Defeat", style = MaterialTheme.typography.displayMedium, color = Mov.Text1)
            Text(if (result.winner == "tie") "Electoral College tied. No candidate reaches 270." else "$winnerName wins the presidency",
                style = MaterialTheme.typography.titleMedium, color = Mov.Text2)
            Row(verticalAlignment = Alignment.Bottom) {
                BigNumber("$demEv", dem?.shortName ?: "Dem", Mov.DemText)
                Spacer(Modifier.weight(1f))
                Text("270 TO WIN", color = Mov.Text3, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(bottom = 6.dp))
                Spacer(Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) {
                    Text("$repEv", style = MaterialTheme.typography.displayMedium.num, color = Mov.GopText, fontWeight = FontWeight.ExtraBold)
                    Text((rep?.shortName ?: "Rep").uppercase(), style = MaterialTheme.typography.labelSmall, color = Mov.Text3)
                }
            }
            SeatBar(listOf(Mov.Dem to demEv, Mov.Gop to repEv), 538, 270, description = "$demEv to $repEv electoral votes")
            Row {
                Text("Popular vote ${percent(demPop)}", Modifier.weight(1f), color = Mov.DemText, style = MaterialTheme.typography.bodyMedium.num)
                Text(percent(1 - demPop), color = Mov.GopText, style = MaterialTheme.typography.bodyMedium.num)
            }
        }
        summary?.let { info -> MovCard {
            CardHead("Campaign score") {
                Text(if (info.score >= 0) "${info.score} / 1000" else "Unavailable", style = MaterialTheme.typography.titleLarge.num, color = Mov.Text1, fontWeight = FontWeight.Bold)
            }
            if (info.score >= 0) KeyValue("Difficulty", info.difficulty.replaceFirstChar { it.uppercase() })
            if (info.score >= 0) KeyValue("Electoral vote margin", "${info.unitMargin}")
            KeyValue("Popular vote margin", "${signed(info.popularMargin)} pts")
            if (info.score < 0) Text("Score unavailable for this older save.", color = Mov.Text3, style = MaterialTheme.typography.bodySmall)
            if (!info.standardLength) Text("Short and long campaigns are casual runs. Standard nine-week campaigns are comparable on the leaderboard.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
        } }
        if (g.customScenario != null) Tag("Custom campaign · casual only", TagKind.Warning)
        ScorePosting(session)
        if (achievements.isNotEmpty()) MovCard {
            CardHead("Achievements earned")
            achievements.forEach { award -> Column {
                Text("${award.icon} ${award.name}", style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                Text(award.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            } }
        }
        if (result.postMortem.isNotEmpty()) MovCard {
            CardHead("What decided it")
            result.postMortem.take(5).forEach { Text(it.cause, style = MaterialTheme.typography.bodyMedium, color = Mov.Text2) }
        }
        MovCard(tight = true) {
            CardHead("Closest states") { GhostButton(if (showAllStates) "Show fewer" else "All ${sorted.size}", { showAllStates = !showAllStates }) }
            (if (showAllStates) sorted else sorted.take(12)).forEach { sr ->
                val demWon = sr.winner == CandidateId.DEM
                Row(Modifier.fillMaxWidth().heightIn(min = 28.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                    PartySwatch(if (demWon) Mov.Dem else Mov.Gop)
                    Text(stateNames[sr.stateId] ?: sr.stateId, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, color = Mov.Text1)
                    Text("${sr.electoralVotes}", Modifier.widthIn(min = 28.dp), style = MaterialTheme.typography.bodyMedium.num, color = Mov.Text3, textAlign = TextAlign.End)
                    Text("+${"%.1f".format(kotlin.math.abs(sr.margin))}", Modifier.widthIn(min = 52.dp), style = MaterialTheme.typography.bodyMedium.num,
                        color = if (demWon) Mov.DemText else Mov.GopText, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
                }
            }
        }
        MovCard(tight = true) {
            CardHead("Compared with history") { GhostButton(if (showHistory) "Hide" else "Show", { showHistory = !showHistory }) }
            if (showHistory) NativeResults.historicalUs(g).forEach { region ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(region.name, style = MaterialTheme.typography.bodyMedium, color = Mov.Text1, fontWeight = FontWeight.SemiBold)
                        Text("${region.units} EV now · ${region.historicalUnits} historically", style = MaterialTheme.typography.bodySmall.num, color = Mov.Text3)
                    }
                    Text(signed(region.shareSwing), color = if (region.shareSwing >= 0) Mov.Positive else Mov.Negative, style = MaterialTheme.typography.bodyMedium.num)
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
            if (session.canViewReplay()) GhostButton("Replay and report", { session.go(Screen.REPLAY) })
            GhostButton("Analysis", { session.go(Screen.ANALYSIS) })
        }
        SecondaryButton("New U.S. campaign", { session.playAgain() }, Modifier.fillMaxWidth())
    }
}
