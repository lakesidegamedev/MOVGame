package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.lakesidegames.electioneer.engine.MobileCampaign
import com.lakesidegames.electioneer.engine.NativeCatalog

@Composable
fun AccountScreen(session: GameSession) {
    val account = session.account
    val user by account.user.collectAsState()
    val busy by account.busy.collectAsState()
    val notice by account.notice.collectAsState()
    val unlocked by account.unlocked.collectAsState()
    val purchases by account.purchases.collectAsState()
    val purchasesLoaded by account.purchasesLoaded.collectAsState()
    val awards by account.awards.collectAsState()
    val rankings by account.rankings.collectAsState()
    val owned by session.owned.collectAsState()
    var showingLakeside by remember { mutableStateOf(false) }
    var showingAwards by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var registering by remember { mutableStateOf(false) }
    var confirmingDelete by remember { mutableStateOf(false) }
    val elections = remember { MobileCampaign.countries().flatMap { MobileCampaign.elections(it.id) } }
    LaunchedEffect(user) { if (user != null) password = "" }
    if (showingLakeside) LakesideLogin(onCode = { code -> showingLakeside = false; account.exchangeLakeside(code) }, onClose = { showingLakeside = false })
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        val signedIn = user
        ScreenHeader("Your account", if (signedIn != null) "Welcome, ${signedIn.username}" else if (registering) "Create an account" else "Sign in",
            if (signedIn != null) signedIn.email else "Use the same Margin of Victory account as the web game.")
        notice?.let { Notice(it) }
        if (signedIn != null) {
            MovCard {
                CardHead("Lakeside Games") { Tag(if (signedIn.ahdLinked) "Linked" else "Not linked", if (signedIn.ahdLinked) TagKind.Positive else TagKind.Outline) }
                Text(if (signedIn.ahdLinked) "Packs and purchases follow this account on the web, iPhone and Android."
                    else "Link your Lakeside Games account to buy packs and keep them on every device.", color = Mov.Text2, style = MaterialTheme.typography.bodyMedium)
                if (!signedIn.ahdLinked) PrimaryButton("Sign in with Lakeside Games", { showingLakeside = true }, Modifier.fillMaxWidth(), enabled = !busy)
                Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                    GhostButton("Refresh account", account::refresh, enabled = !busy)
                    GhostButton("Sign out", account::signOut, enabled = !busy, color = Mov.Negative)
                }
            }
            MovCard {
                CardHead("What you own") { GhostButton("Store", { session.go(Screen.STORE) }) }
                val mine = NativeCatalog.packs().mapNotNull { pack -> ownershipReason(pack, owned)?.let { pack to it } }
                if (mine.isEmpty()) Text("The free elections. Packs you buy appear here with how you got them.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                mine.forEach { (pack, reason) -> KeyValue(pack.name, reason, valueColor = Mov.Positive) }
                Text("${unlocked.size} campaigns activated with codes", color = Mov.Text4, style = MaterialTheme.typography.bodySmall.num)
            }
            MovCard {
                CardHead("Purchases")
                if (!purchasesLoaded) Text(if (busy) "Loading purchase history" else "Refresh your account to load purchase history.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                else if (purchases.isEmpty()) Text("No purchases yet.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                purchases.forEach { purchase ->
                    val cents = purchase.amountCents
                    val money = purchase.currency
                    val amount = when {
                        purchase.provider == "apple" -> "App Store"
                        purchase.provider == "google" -> "Google Play"
                        cents == null || money == null -> "Purchase"
                        cents == 0 -> "Code"
                        else -> runCatching {
                            java.text.NumberFormat.getCurrencyInstance().apply { currency = java.util.Currency.getInstance(money.uppercase()) }.format(cents / 100.0)
                        }.getOrElse { "${cents / 100.0} ${money.uppercase()}" }
                    }
                    val date = java.text.DateFormat.getDateInstance(java.text.DateFormat.MEDIUM).format(java.util.Date(purchase.createdAt))
                    KeyValue("${purchase.name} · $date", if (purchase.refunded) "$amount · Refunded" else amount)
                }
            }
            MovCard {
                CardHead("Activation code")
                OutlinedTextField(code, { code = it }, label = { Text("Activation code") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    colors = movFieldColors(), shape = MovRadius.md, textStyle = MaterialTheme.typography.bodyMedium)
                SecondaryButton("Activate code", { account.activate(code) }, Modifier.fillMaxWidth(), enabled = !busy && code.isNotBlank())
            }
            MovCard {
                CardHead("Delete your account")
                Text("Deleting removes this Margin of Victory account, its cloud saves, scores and achievements. Packs bought on your Lakeside account stay with that account.",
                    color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                GhostButton("Delete account", { confirmingDelete = true }, enabled = !busy, color = Mov.Negative)
            }
            if (confirmingDelete) androidx.compose.material3.AlertDialog(onDismissRequest = { confirmingDelete = false },
                title = { Text("Delete your Margin of Victory account?") },
                text = { Text("This permanently removes the account, its cloud saves, scores and achievements. It cannot be undone.") },
                confirmButton = { androidx.compose.material3.TextButton(onClick = { confirmingDelete = false; account.deleteAccount() }) { Text("Delete account", color = Mov.Negative) } },
                dismissButton = { androidx.compose.material3.TextButton(onClick = { confirmingDelete = false }) { Text("Cancel") } })
        } else {
            MovCard {
                PrimaryButton("Sign in with Lakeside Games", { showingLakeside = true }, Modifier.fillMaxWidth(), enabled = !busy)
                Eyebrow("Or use email")
                if (registering) OutlinedTextField(username, { username = it }, label = { Text("Username") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    colors = movFieldColors(), shape = MovRadius.md)
                OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    colors = movFieldColors(), shape = MovRadius.md)
                OutlinedTextField(password, { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), singleLine = true,
                    modifier = Modifier.fillMaxWidth(), colors = movFieldColors(), shape = MovRadius.md)
                SecondaryButton(if (busy) "Please wait" else if (registering) "Create account" else "Sign in",
                    { account.authenticate(email, password, if (registering) username else null) }, Modifier.fillMaxWidth(),
                    enabled = !busy && email.isNotBlank() && password.isNotEmpty() && (!registering || username.isNotBlank()))
                GhostButton(if (registering) "Already have an account? Sign in" else "New here? Create an account", { registering = !registering }, enabled = !busy, color = Mov.Text2)
            }
        }
        MovCard {
            CardHead("Your campaigns")
            KeyValue("On this device", session.savedCampaignLabel() ?: "None")
            SecondaryButton("Saved campaigns", { session.go(Screen.SAVES) }, Modifier.fillMaxWidth())
            SecondaryButton("Leaderboards and daily champions", { session.go(Screen.BOARDS) }, Modifier.fillMaxWidth())
            if (signedIn != null && rankings.isNotEmpty()) {
                Eyebrow("Personal bests")
                rankings.forEach { ranking ->
                    val label = elections.firstOrNull { it.scenarioId == ranking.scenarioId }?.label ?: ranking.scenarioId
                    KeyValue("$label · ${ranking.difficulty}", "#${ranking.rank} · ${ranking.score}")
                }
            }
        }
        MovCard {
            CardHead("Achievements · ${awards.size}") { GhostButton(if (showingAwards) "Hide" else "Show", { showingAwards = !showingAwards }) }
            if (showingAwards) {
                if (awards.isEmpty()) Text("Finish a U.S. campaign to earn achievements.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                awards.forEach { entry ->
                    Column {
                        Text("${entry.award.icon} ${entry.award.name} · ${entry.scenarioLabel}", style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                        Text(entry.award.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                    }
                }
                if (signedIn != null) GhostButton("Sync achievements", account::syncAchievements, enabled = !busy)
                else Text("Achievements are saved on this device. Sign in to sync them.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
            SecondaryButton("Settings", { session.go(Screen.SETTINGS) }, Modifier.weight(1f))
            SecondaryButton("How to play", { session.go(Screen.GUIDE) }, Modifier.weight(1f))
        }
    }
}

@Composable
internal fun ScorePosting(session: GameSession) {
    ResultJourneyCard(session)
    val payload = session.scorePayload() ?: return
    val user by session.account.user.collectAsState()
    val busy by session.account.busy.collectAsState()
    val notice by session.account.notice.collectAsState()
    val daily = session.isDaily()
    MovCard {
        CardHead(if (daily) "Daily challenge" else "Leaderboard")
        if (daily) KeyValue("Best today · streak", "${session.dailyBest() ?: 0} · ${session.dailyStreak()} days")
        if (user == null) SecondaryButton("Sign in to post your score", { session.go(Screen.ACCOUNT) }, Modifier.fillMaxWidth())
        else SecondaryButton(if (busy) "Posting" else if (daily) "Post daily score" else "Post to leaderboard", { session.account.postScore(payload, daily) },
            Modifier.fillMaxWidth(), enabled = !busy)
        notice?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Mov.Text2) }
        if (daily) GhostButton("Replay today's challenge", { session.openDaily(restart = true) })
    }
}

@Composable
internal fun BigNumber(value: String, label: String, color: androidx.compose.ui.graphics.Color = Mov.Text1, modifier: Modifier = Modifier) {
    Column(modifier) {
        Text(value, style = MaterialTheme.typography.displayMedium.num, color = color, fontWeight = FontWeight.ExtraBold)
        Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = Mov.Text3)
    }
}
