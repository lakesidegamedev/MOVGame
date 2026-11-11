package com.lakesidegames.electioneer.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.MobileCampaign
import com.lakesidegames.electioneer.engine.NativeCatalog
import com.lakesidegames.electioneer.engine.NativeElection

/** Era buckets for the library filter, newest first. */
internal fun eraOf(year: Int): String = when {
    year >= 2020 -> "2020s"
    year >= 2010 -> "2010s"
    year >= 2000 -> "2000s"
    year >= 1990 -> "1990s"
    else -> "Before 1990"
}
private val ERAS = listOf("2020s", "2010s", "2000s", "1990s", "Before 1990")

/** "2024 · Harris v. Trump" becomes "Harris v. Trump" next to a year column. */
internal fun electionTitle(label: String): String = label.substringAfter(" · ", label)

/**
 * The campaign library: every election from the scenario registry, grouped by
 * country in catalog order, with search and owned, difficulty and era filters.
 * Picking an election opens its briefing, where the player picks a side.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CampaignLibraryScreen(session: GameSession) {
    val countries = remember { NativeCatalog.countries() }
    val all = remember { countries.flatMap { MobileCampaign.elections(it.id) } }
    val owned by session.owned.collectAsState()
    val ownedScenarios = remember(owned) { NativeCatalog.ownedScenarios(owned.toList()) }
    fun isOwned(e: NativeElection) = e.free || e.scenarioId in ownedScenarios || (e.packId != null && e.packId in owned)
    val daily = remember { session.dailySetup }
    val pick = remember { session.libraryPick.also { session.libraryPick = null } }
    var picked by remember { mutableStateOf(
        daily?.let { d -> all.firstOrNull { it.country == d.countryId && it.nativeId == d.electionId } }
            ?: pick?.let { id -> all.firstOrNull { it.scenarioId == id } }) }
    var query by rememberSaveable { mutableStateOf("") }
    var ownership by rememberSaveable { mutableStateOf("all") }
    var difficulty by rememberSaveable { mutableStateOf("all") }
    var era by rememberSaveable { mutableStateOf("all") }
    var country by rememberSaveable { mutableStateOf("all") }
    LaunchedEffect(Unit) { session.dailySetup = null }

    picked?.let { election ->
        BackHandler { picked = null }
        ElectionBriefing(session, election, daily?.takeIf { it.electionId == election.nativeId && it.countryId == election.country },
            owned = isOwned(election), onBack = { picked = null })
        return
    }

    val needle = query.trim().lowercase()
    val shown = all.filter { e ->
        (country == "all" || e.country == country) &&
            (ownership == "all" || isOwned(e)) &&
            (difficulty == "all" || e.difficulty == difficulty) &&
            (era == "all" || eraOf(e.year) == era) &&
            (needle.isEmpty() || e.label.lowercase().contains(needle) || e.blurb.lowercase().contains(needle) ||
                countries.first { it.id == e.country }.name.lowercase().contains(needle) || e.year.toString() == needle)
    }
    val groups = countries.mapNotNull { c -> shown.filter { it.country == c.id }.takeIf { it.isNotEmpty() }?.let { c to it } }
    val list = rememberLazyListState()
    LazyColumn(state = list, contentPadding = PaddingValues(bottom = MovSpace.s6), verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
        item {
            Column(Modifier.padding(horizontal = MovSpace.gutter).padding(top = MovSpace.s4), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
                ScreenHeader("Campaign library", "Choose your election",
                    "${all.size} elections in ${countries.size} countries. ${all.count { it.free }} are free.")
                SearchField(query, { query = it }, "Search elections, leaders, years")
                Segmented(listOf("all" to "All", "owned" to "Free and owned"), ownership, { ownership = it }, label = "Ownership filter")
                Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                    ChoicePicker("Difficulty", difficulty, listOf("all" to "Any") + listOf("easy", "medium", "hard").map { it to it.replaceFirstChar { c -> c.uppercase() } },
                        Modifier.weight(1f)) { difficulty = it }
                    ChoicePicker("Era", era, listOf("all" to "Any") + ERAS.filter { e -> all.any { eraOf(it.year) == e } }.map { it to it },
                        Modifier.weight(1f)) { era = it }
                }
            }
        }
        item {
            // Explicit horizontal rail: jump to one country.
            LazyRow(contentPadding = PaddingValues(horizontal = MovSpace.gutter), horizontalArrangement = Arrangement.spacedBy(MovSpace.s1_5)) {
                item { MovChip("All countries", country == "all", { country = "all" }) }
                items(countries) { c -> MovChip("${c.flag} ${c.name}", country == c.id, { country = if (country == c.id) "all" else c.id }) }
            }
        }
        item {
            Text(if (shown.size == all.size) "Showing all ${all.size} elections" else "Showing ${shown.size} of ${all.size} elections",
                Modifier.padding(horizontal = MovSpace.gutter), color = Mov.Text3, style = MaterialTheme.typography.labelMedium)
        }
        if (groups.isEmpty()) item {
            Column(Modifier.padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                Text("No elections match these filters.", color = Mov.Text2)
                SecondaryButton("Clear filters", { query = ""; ownership = "all"; difficulty = "all"; era = "all"; country = "all" })
            }
        }
        groups.forEach { (c, elections) ->
            stickyHeader(key = "head-${c.id}") {
                Row(Modifier.fillMaxWidth().background(Mov.Surface0).padding(horizontal = MovSpace.gutter, vertical = MovSpace.s2)
                    .semantics(mergeDescendants = true) { heading() }, verticalAlignment = Alignment.CenterVertically) {
                    Text("${c.flag} ${c.name}", Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
                    val paid = elections.count { !it.free }
                    Text(if (paid == 0) "${elections.size} free" else "${elections.size} elections", color = Mov.Text3, style = MaterialTheme.typography.labelMedium.num)
                }
            }
            items(elections, key = { it.scenarioId }) { e ->
                MovCard(Modifier.padding(horizontal = MovSpace.gutter), tight = true, onClick = { picked = e }) {
                    Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
                        Text("${e.year}", Modifier.width(52.dp), style = MaterialTheme.typography.titleLarge.num, color = Mov.Text1, fontWeight = FontWeight.Bold)
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                            Text(electionTitle(e.label), style = MaterialTheme.typography.titleSmall, color = Mov.Text1, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text(e.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1_5)) {
                                Tag(e.difficulty, difficultyTag(e.difficulty))
                                if (e.free) Tag("Free", TagKind.Positive) else if (isOwned(e)) Tag("Owned", TagKind.Positive)
                            }
                        }
                    }
                }
            }
        }
    }
}

/** One election's briefing: blurb, side picker sized for ten parties, launch. */
@Composable
private fun ElectionBriefing(session: GameSession, election: NativeElection, daily: com.lakesidegames.electioneer.engine.NativeDailyAssignment?, owned: Boolean, onBack: () -> Unit) {
    val us = election.country == "US"
    val parties = remember(election) { if (us) emptyList() else MobileCampaign.parties(election.country, election.nativeId) }
    var partyId by remember(election) { mutableStateOf(daily?.role?.takeIf { id -> parties.any { it.id == id } } ?: parties.firstOrNull()?.id ?: "") }
    var difficulty by remember { mutableStateOf("normal") }
    var seed by remember(election) { mutableStateOf(daily?.seed ?: System.currentTimeMillis().toString()) }
    val country = remember(election) { NativeCatalog.country(election.country) }
    Column(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
            item { GhostButton("All elections", onBack, color = Mov.Text2) }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                    Eyebrow(if (daily != null) "Daily challenge · ${daily.date}" else "${country?.flag ?: ""} ${country?.name ?: election.country} · ${election.year}".trim(), color = Mov.AccentText)
                    Text(electionTitle(election.label), Modifier.semantics { heading() }, style = MaterialTheme.typography.headlineLarge, color = Mov.Text1)
                    Text(election.blurb, style = MaterialTheme.typography.bodyMedium, color = Mov.Text2)
                    Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1_5)) {
                        Tag(election.difficulty, difficultyTag(election.difficulty))
                        if (election.free) Tag("Free", TagKind.Positive) else if (owned) Tag("Owned", TagKind.Positive)
                        else Tag(NativeCatalog.packName(election.packId), TagKind.Outline)
                    }
                    country?.guide?.let { Callout(it.title, it.body, kind = NoticeKind.Info) }
                }
            }
            if (!us) {
                item { Eyebrow("Choose your side · ${parties.size} parties") }
                items(parties, key = { it.id }) { party ->
                    val on = party.id == partyId
                    MovCard(tight = true, accent = on, color = if (on) Mov.Surface2 else Mov.Surface1, onClick = { partyId = party.id }) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                            PartySwatch(partyFill(party.color), size = 14.dp)
                            Column(Modifier.weight(1f)) {
                                Text(party.name, color = partyInk(party.color), style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                Text(party.leader, color = Mov.Text2, style = MaterialTheme.typography.bodySmall)
                            }
                            if (on) Tag("Your side", TagKind.Accent)
                        }
                        if (on) StatRow {
                            Metric("${party.charisma.toInt()}", "Charisma")
                            Metric("${party.energy.toInt()}", "Energy")
                            Metric("${party.competence.toInt()}", "Competence")
                            Metric("${party.machine.toInt()}", "Machine")
                        }
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                        Eyebrow("Difficulty")
                        Segmented(DIFFICULTIES.map { it to it.replaceFirstChar { c -> c.uppercase() } }, difficulty, { difficulty = it }, label = "Difficulty")
                        OutlinedTextField(seed, { seed = it.take(64) }, label = { Text("Campaign seed") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                            supportingText = { Text("The same seed replays the same campaign.") }, colors = movFieldColors(), shape = MovRadius.md,
                            textStyle = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        ActionBar {
            if (us) PrimaryButton("Choose your presidential ticket", { session.setupScenarioId = election.nativeId; session.go(Screen.SETUP) }, Modifier.weight(1f))
            else PrimaryButton("Launch campaign", { session.startCampaign(election.country, election.nativeId, partyId, difficulty, seed) }, Modifier.weight(1f),
                enabled = seed.isNotBlank() && partyId.isNotEmpty())
        }
    }
}
