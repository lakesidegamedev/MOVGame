package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.CandidateId
import com.lakesidegames.electioneer.engine.EventMode

@Composable
fun HomeScreen(session: GameSession) {
    val countries = remember { com.lakesidegames.electioneer.engine.NativeCatalog.countries() }
    val electionCount = remember { countries.sumOf { com.lakesidegames.electioneer.engine.MobileCampaign.elections(it.id).size } }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s4)) {
        Spacer(Modifier.height(MovSpace.s4))
        Eyebrow("Election campaign strategy", color = Mov.AccentText)
        Text("Margin of Victory", style = MaterialTheme.typography.displayMedium, color = Mov.Text1)
        Text("Run the campaign in ${countries.size} countries and $electionCount elections. Every week of choices moves the map.",
            style = MaterialTheme.typography.bodyLarge, color = Mov.Text2)
        Text(countries.joinToString(" ") { it.flag }, style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.semantics { contentDescription = countries.joinToString(", ") { it.name } })
        if (session.hasSave()) {
            MovCard(accent = true, color = Mov.Surface2, onClick = { session.resumeGame() }, onClickLabel = "Continue campaign") {
                Eyebrow("Continue campaign", color = Mov.AccentText)
                Text(session.savedCampaignLabel() ?: "Your campaign", style = MaterialTheme.typography.headlineSmall, color = Mov.Text1)
                PrimaryButton("Continue campaign", { session.resumeGame() }, Modifier.fillMaxWidth())
            }
            SecondaryButton("Start a new campaign", { session.go(Screen.LIBRARY) }, Modifier.fillMaxWidth())
        } else PrimaryButton("Start a new campaign", { session.go(Screen.LIBRARY) }, Modifier.fillMaxWidth(), large = true)
        val daily = session.dailyAssignment()
        MovCard(onClick = { session.openDaily() }, onClickLabel = "Play the daily challenge") {
            CardHead("Daily challenge") { Text(daily.date, color = Mov.Text3, style = MaterialTheme.typography.labelMedium.num) }
            Text("${daily.flag} ${daily.label}", style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
            Text("Play as ${daily.roleName}. Same seed and events for everyone.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            val best = session.dailyBest()
            if (best != null) Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1_5)) {
                Tag("Best $best", TagKind.Positive); Tag("${session.dailyStreak()}-day streak", TagKind.Warning)
            } else Text("Play today's challenge", color = Mov.AccentText, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SetupScreen(session: GameSession) {
    val campaigns = remember { session.campaigns() }
    var scenarioId by remember { mutableStateOf(session.setupScenarioId) }
    var player by remember { mutableStateOf(if (session.dailySetup?.role == "rep") CandidateId.REP else CandidateId.DEM) }
    var mateId by remember { mutableStateOf("") }
    var staffIds by remember { mutableStateOf(setOf<String>()) }
    var difficulty by remember { mutableStateOf("normal") }
    var mode by remember { mutableStateOf(EventMode.HISTORICAL) }
    var turns by remember { mutableIntStateOf(9) }
    var seed by remember { mutableStateOf(session.dailySetup?.seed ?: (System.currentTimeMillis() % 1_000_000).toString().padStart(6, '0')) }
    LaunchedEffect(Unit) { session.dailySetup = null }
    var whatIfState by remember { mutableStateOf("") }
    var mirrorMatch by remember { mutableStateOf(false) }
    var pandemic by remember { mutableStateOf(false) }
    val campaign = campaigns.first { it.id == scenarioId }
    // Recompose when ownership or the lock switch changes.
    val gate by session.gate.collectAsState()
    val owned by session.owned.collectAsState()
    val unlocked by session.account.unlocked.collectAsState()
    val locked = remember(scenarioId, gate, owned, unlocked) { session.lockedPack("US", scenarioId) }
    val mates = remember(scenarioId, player) { session.mates(scenarioId, player) }
    val selectedMate = mates.firstOrNull { it.id == mateId } ?: mates.firstOrNull { it.historical } ?: mates.first()

    Column(Modifier.fillMaxSize()) {
    LazyColumn(
        modifier = Modifier.weight(1f),
        contentPadding = PaddingValues(MovSpace.gutter),
        verticalArrangement = Arrangement.spacedBy(MovSpace.s3),
    ) {
        item {
            GhostButton("All elections", { session.go(Screen.LIBRARY) }, color = Mov.Text2)
            ScreenHeader("New U.S. campaign", "Choose your path", "Pick the election, the ticket and the team.")
        }
        item {
            SetupSection("1 · The election") {
                Text("${campaigns.size} elections. Swipe for more.", style = MaterialTheme.typography.labelMedium, color = Mov.Text3)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(campaigns) { c ->
                        val selected = scenarioId == c.id
                        MovCard(Modifier.width(220.dp), tight = true, accent = selected, color = if (selected) Mov.Surface2 else Mov.Surface1,
                            onClick = { scenarioId = c.id; mateId = "" }) {
                            Text(c.year.toString(), style = MaterialTheme.typography.displaySmall.num, color = if (selected) Mov.AccentText else Mov.Text1)
                            if (electionTitle(c.label) != "${c.demName} v. ${c.repName}")
                                Text(electionTitle(c.label), style = MaterialTheme.typography.titleSmall, color = Mov.Text1, maxLines = 2)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(c.demName, color = Mov.DemText, style = MaterialTheme.typography.bodySmall)
                                Text(" v. ", color = Mov.Text4, style = MaterialTheme.typography.bodySmall)
                                Text(c.repName, color = Mov.GopText, style = MaterialTheme.typography.bodySmall)
                            }
                            if (remember(c.id, gate, owned, unlocked) { session.lockedPack("US", c.id) } != null) Row(
                                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                                Icon(Icons.Filled.Lock, contentDescription = null, tint = Mov.Text3, modifier = Modifier.size(14.dp))
                                Tag("Unlock", TagKind.Warning)
                            }
                        }
                    }
                }
                Text(campaign.tagline, color = Mov.Text2, style = MaterialTheme.typography.bodyMedium)
            }
        }
        item {
            SetupSection("2 · Your ticket") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MovChip(campaign.demName, player == CandidateId.DEM, { player = CandidateId.DEM; mateId = "" }, leading = Mov.Dem)
                    MovChip(campaign.repName, player == CandidateId.REP, { player = CandidateId.REP; mateId = "" }, leading = Mov.Gop)
                }
                Eyebrow("Running mate")
                mates.forEach { mate ->
                    val selected = selectedMate.id == mate.id
                    MovCard(tight = true, accent = selected, color = if (selected) Mov.Surface2 else Mov.Surface1, onClick = { mateId = mate.id }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(mate.name, Modifier.weight(1f), style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                            if (mate.historical) Tag("Historical", TagKind.Outline)
                        }
                        Text(mate.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                    }
                }
            }
        }
        item {
            SetupSection("3 · War room · ${staffIds.size} of 3 hired") {
                Text("Hire up to three advisers", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                session.staffChoices().forEach { staff ->
                    val selected = staff.id in staffIds
                    MovCard(tight = true, accent = selected, color = if (selected) Mov.Surface2 else Mov.Surface1,
                        onClick = { staffIds = if (selected) staffIds - staff.id else if (staffIds.size < 3) staffIds + staff.id else staffIds }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("${staff.name} · ${staff.role}", Modifier.weight(1f), style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                            if (selected) Tag("Hired", TagKind.Accent)
                        }
                        Text(staff.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                    }
                }
            }
        }
        item {
            SetupSection("4 · Campaign rules") {
                Eyebrow("Difficulty")
                Segmented(DIFFICULTIES.map { it to it.replaceFirstChar(Char::titlecase) }, difficulty, { difficulty = it }, label = "Difficulty")
                Eyebrow("Events")
                Segmented(EventMode.entries.map { it.serial to it.serial.replaceFirstChar(Char::titlecase) }, mode.serial, { id -> mode = EventMode.entries.first { it.serial == id } }, label = "Events")
                Eyebrow("Campaign length")
                Segmented(listOf(5, 9, 14).map { "$it" to "$it weeks" }, "$turns", { turns = it.toInt() }, label = "Campaign length")
                Eyebrow("What if: make one state a tossup")
                ChipRow { listOf("", "TX", "FL", "OH", "PA", "MI", "WI", "GA", "AZ", "NC", "NY").forEach { state ->
                    MovChip(state.ifEmpty { "Off" }, whatIfState == state, { whatIfState = state })
                } }
                NativeToggle("Mirror match · underdog boost", mirrorMatch, { mirrorMatch = it })
                NativeToggle("Pandemic era issues", pandemic, { pandemic = it })
                OutlinedTextField(value = seed, onValueChange = { seed = it.take(32) }, label = { Text("Campaign seed") }, supportingText = { Text("Use the same seed to replay the same campaign") },
                    modifier = Modifier.fillMaxWidth(), colors = movFieldColors(), shape = MovRadius.md, singleLine = true)
            }
        }
    }
    ActionBar {
        if (locked != null) {
            Icon(Icons.Filled.Lock, contentDescription = null, tint = Mov.Text2, modifier = Modifier.size(20.dp))
            PrimaryButton("Unlock the ${com.lakesidegames.electioneer.engine.NativeCatalog.packName(locked)} pack", { session.openStoreFor(locked) }, Modifier.weight(1f))
        } else PrimaryButton("Launch ${campaign.year} campaign", { session.newGame(scenarioId, player, selectedMate.id, staffIds.toList(), difficulty, mode, turns, seed, whatIfState, mirrorMatch, pandemic) }, Modifier.weight(1f))
    }
    }
}

@Composable
private fun SetupSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    MovCard {
        Eyebrow(title, color = Mov.AccentText)
        content()
    }
}
