package com.lakesidegames.electioneer.ui

import android.app.Activity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.billing.StoreProduct
import com.lakesidegames.electioneer.content.CatalogPack
import com.lakesidegames.electioneer.engine.MobileCampaign
import com.lakesidegames.electioneer.engine.NativeAccess
import com.lakesidegames.electioneer.engine.NativeCatalog
import com.lakesidegames.electioneer.engine.NativeElection

/** Why a pack counts as owned, in the player's words, or null when it does not. */
internal fun ownershipReason(pack: CatalogPack, owned: Set<String>): String? {
    val list = owned.toList()
    return when {
        pack.id in owned -> "On your Lakeside account"
        pack.id != "complete" && "complete" in owned && NativeAccess.covers(pack.id, listOf("complete")) -> "Included in the Complete Collection"
        "global" in owned && pack.id != "global" && NativeAccess.covers(pack.id, listOf("global")) -> "Included in your Global Elections Pack"
        NativeAccess.covers(pack.id, list) -> "Covered by the packs you own"
        else -> null
    }
}

/**
 * Every pack in the catalog bundle, Complete Collection first. Prices come
 * from the Play product when one exists; a pack without a purchasable product
 * says "Coming soon" and has no Buy button. Presentation only: buying,
 * receipts and entitlements stay in billing/ and the shared wallet.
 */
@Composable
fun StoreScreen(session: GameSession, activity: Activity) {
    val products by session.products.collectAsState()
    val owned by session.owned.collectAsState()
    val notice by session.storeNotice.collectAsState()
    val user by session.account.user.collectAsState()
    val linked = user?.ahdLinked == true
    val elections = remember { NativeCatalog.countries().flatMap { MobileCampaign.elections(it.id) }.associateBy { it.scenarioId } }
    val countries = remember { NativeCatalog.countries() }
    val packs = remember { NativeCatalog.packs() }
    val complete = packs.firstOrNull { it.id == "complete" }
    val countryPacks = packs.filter { it.id != "complete" && !it.legacy }
    val legacy = packs.filter { it.legacy && ownershipReason(it, owned) != null }
    var open by remember { mutableStateOf<String?>(null) }

    LazyColumn(contentPadding = PaddingValues(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        item {
            ScreenHeader("Store", "Election packs",
                "${countries.size} countries and ${elections.size} elections. ${elections.values.count { it.free }} elections are free for everyone.")
        }
        notice?.let { item { Notice(it) } }
        if (!linked) item {
            Callout("Sign in to buy", "Packs belong to your Lakeside account, so they work on the web, iPhone and Android.", kind = NoticeKind.Info) {
                SecondaryButton("Sign in with Lakeside Games", { session.go(Screen.ACCOUNT) }, Modifier.fillMaxWidth())
            }
        }
        complete?.let { pack -> item {
            // The collection opens every election of every country it covers,
            // the free ones included (web packFacts): say the total and how many
            // of those are already free.
            val covered = pack.scenarios.mapNotNull { elections[it]?.country }.toSet()
            val all = elections.values.filter { it.country in covered }.sortedWith(compareByDescending<NativeElection> { it.year })
            PackCard(pack, "Every election in the game: ${all.size} elections across ${covered.size} countries, ${all.count { it.free }} of them already free.",
                flag = null, featured = true,
                owned = owned, product = products.firstOrNull { it.packId == pack.id }, linked = linked, expanded = open == pack.id,
                elections = all, onToggle = { open = if (open == pack.id) null else pack.id },
                onBuy = { session.buy(activity, pack.id) }, onPlay = { session.libraryPick = it; session.go(Screen.LIBRARY) })
        } }
        item { Eyebrow("Country packs · ${countryPacks.size}") }
        items(countryPacks, key = { it.id }) { pack ->
            val country = countries.firstOrNull { c -> NativeCatalog.country(c.id)?.packId == pack.id }
            // A country pack opens its country's free elections too (web packFacts).
            val list = (pack.scenarios.mapNotNull { elections[it] } +
                elections.values.filter { it.free && it.country == country?.id })
                .distinctBy { it.scenarioId }.sortedWith(compareByDescending<NativeElection> { it.year })
            val years = list.map { it.year }
            val free = list.count { it.free }
            val summary = buildString {
                append("${list.size} elections")
                if (free > 0) append(", $free free")
                if (years.isNotEmpty()) append(" · ${years.min()} to ${years.max()}")
            }
            PackCard(pack, summary, country?.flag, featured = false, owned = owned, product = products.firstOrNull { it.packId == pack.id },
                linked = linked, expanded = open == pack.id, elections = list, onToggle = { open = if (open == pack.id) null else pack.id },
                onBuy = { session.buy(activity, pack.id) }, onPlay = { session.libraryPick = it; session.go(Screen.LIBRARY) })
        }
        if (legacy.isNotEmpty()) {
            item { Eyebrow("Retired packs you own") }
            items(legacy, key = { it.id }) { pack ->
                PackCard(pack, "${pack.scenarios.size} elections. No longer sold; it stays on your account.", null, featured = false, owned = owned,
                    product = null, linked = linked, expanded = open == pack.id, elections = pack.scenarios.mapNotNull { elections[it] },
                    onToggle = { open = if (open == pack.id) null else pack.id }, onBuy = {}, onPlay = { session.libraryPick = it; session.go(Screen.LIBRARY) })
            }
        }
        if (linked) item { SecondaryButton("Restore purchases", session::restorePurchases, Modifier.fillMaxWidth()) }
    }
}

@Composable
private fun PackCard(
    pack: CatalogPack, summary: String, flag: String?, featured: Boolean, owned: Set<String>, product: StoreProduct?,
    linked: Boolean, expanded: Boolean, elections: List<NativeElection>, onToggle: () -> Unit, onBuy: () -> Unit, onPlay: (String) -> Unit,
) {
    val reason = ownershipReason(pack, owned)
    MovCard(accent = featured && reason == null, color = if (featured) Mov.Surface2 else Mov.Surface1) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                if (featured) Eyebrow("Best value", color = Mov.AccentText)
                Text(listOfNotNull(flag, pack.name).joinToString(" "), style = if (featured) MaterialTheme.typography.headlineSmall else MaterialTheme.typography.titleMedium,
                    color = Mov.Text1, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(summary, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                when {
                    reason != null -> Tag("Owned", TagKind.Positive)
                    product != null -> Text(product.price, style = MaterialTheme.typography.titleMedium.num, color = Mov.Text1, fontWeight = FontWeight.Bold)
                    !linked -> Tag("Sign in to buy", TagKind.Outline)
                    else -> Tag("Coming soon", TagKind.Warning)
                }
            }
        }
        if (reason != null) Text(reason, style = MaterialTheme.typography.bodySmall, color = Mov.Positive)
        else if (product != null) PrimaryButton("Buy ${pack.name} · ${product.price}", onBuy, Modifier.fillMaxWidth())
        GhostButton(if (expanded) "Hide elections" else "Show ${elections.size} elections", onToggle, color = Mov.Text2)
        if (expanded) elections.forEach { e ->
            Row(Modifier.fillMaxWidth().heightIn(min = 44.dp).clickable(onClickLabel = "Open in the library") { onPlay(e.scenarioId) },
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                Text("${e.flag} ${e.year}", Modifier.width(76.dp), style = MaterialTheme.typography.bodyMedium.num, color = Mov.Text2)
                Text(electionTitle(e.label), Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, color = Mov.Text1, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Tag(e.difficulty, difficultyTag(e.difficulty))
            }
        }
    }
}
