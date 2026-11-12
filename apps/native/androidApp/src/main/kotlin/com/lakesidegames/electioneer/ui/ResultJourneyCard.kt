package com.lakesidegames.electioneer.ui

import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.NativeResultsJourney

@Composable
internal fun ResultJourneyCard(session: GameSession) {
    val snapshot = session.currentSnapshot() ?: return
    val journey = remember(snapshot, nativeUtcDay()) { NativeResultsJourney.create(snapshot, nativeUtcDay()) } ?: return
    val context = LocalContext.current
    val account = session.account
    val user by account.user.collectAsState()
    val board by account.board.collectAsState()
    val rank by account.dailyRank.collectAsState()
    val boardKey by account.boardKey.collectAsState()
    LaunchedEffect(journey.shareText, user?.id) { if (journey.daily) account.loadBoard(nativeUtcDay()) }
    MovCard {
        if (journey.daily && journey.score >= 0) {
            CardHead("Daily · ${nativeUtcDay()}") { Text("${journey.score} / 1000", style = MaterialTheme.typography.titleMedium.num, color = Mov.Text1) }
            val percentile = if (boardKey == "daily:${nativeUtcDay()}")
                NativeResultsJourney.percentile(journey.score, board.map { it.score }, rank?.rank) else null
            percentile?.let { Text("Top $it% vs today's board${rank?.let { mine -> " · Rank #${mine.rank}" }.orEmpty()}", color = Mov.Positive, style = MaterialTheme.typography.bodyMedium) }
            GhostButton("Refresh daily ranking", { account.loadBoard(nativeUtcDay()) })
        }
        journey.next?.let { next ->
            Eyebrow("Next campaign", color = Mov.AccentText)
            Text(next.label, style = MaterialTheme.typography.titleMedium, color = Mov.Text1)
            Text(next.blurb, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            PrimaryButton("Play ${next.label}", session::playNextCampaign, Modifier.fillMaxWidth())
        }
        SecondaryButton("Share campaign result", {
            val intent = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, journey.shareText) }
            context.startActivity(Intent.createChooser(intent, "Share campaign result"))
        }, Modifier.fillMaxWidth())
    }
}
