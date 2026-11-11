package com.lakesidegames.electioneer.ui

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.util.Base64
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.NativeCatalog
import com.lakesidegames.electioneer.engine.NativeHelp
import com.lakesidegames.electioneer.engine.NativeSound
import com.lakesidegames.electioneer.BuildConfig
import java.io.File

class NativePreferences(private val context: Context) {
    private val prefs = context.getSharedPreferences("mov_native", Context.MODE_PRIVATE)
    var soundOn by mutableStateOf(prefs.getBoolean("sound_on", true)); private set
    var volume by mutableStateOf(prefs.getFloat("volume", 0.6f).let { if (it.isFinite()) it.coerceIn(0f, 1f) else 0.6f }); private set
    var reducedMotion by mutableStateOf(prefs.getBoolean("reduce_motion", false)); private set
    var hotkeysOn by mutableStateOf(prefs.getBoolean("hotkeys_on", true)); private set
    var tutorialNonce by mutableIntStateOf(0); private set
    private var replayRequested = false
    fun takeTutorialReplay(): Boolean = replayRequested.also { replayRequested = false }
    private val players = mutableSetOf<MediaPlayer>()
    fun sound(value: Boolean) { soundOn = value; prefs.edit().putBoolean("sound_on", value).apply(); if (value) play("pollUp") }
    fun volume(value: Float) { volume = value.coerceIn(0f, 1f); prefs.edit().putFloat("volume", volume).apply() }
    fun motion(value: Boolean) { reducedMotion = value; prefs.edit().putBoolean("reduce_motion", value).apply() }
    fun hotkeys(value: Boolean) { hotkeysOn = value; prefs.edit().putBoolean("hotkeys_on", value).apply() }
    fun tourDone(country: String) = prefs.getBoolean("tour_$country", false)
    fun finishTour(country: String) { prefs.edit().putBoolean("tour_$country", true).apply() }
    fun replayTutorial() { replayRequested = true; prefs.edit().apply { NativeCatalog.countryIds().forEach { remove("tour_$it") } }.apply(); tutorialNonce++ }
    fun play(cue: String) {
        if (!soundOn || volume <= 0f) return
        val file = File(context.cacheDir, "mov-cue-$cue.wav")
        runCatching {
            file.writeBytes(Base64.decode(NativeSound.wavBase64(cue, volume.toDouble()), Base64.DEFAULT))
            val player = MediaPlayer()
            players.add(player)
            fun release() { players.remove(player); player.release() }
            try {
                player.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                player.setDataSource(file.absolutePath)
                player.setOnCompletionListener { release() }
                player.setOnErrorListener { _, _, _ -> release(); true }
                player.prepare(); player.start()
            } catch (error: Exception) { release() }
        }
    }
    fun close() { players.toList().forEach { it.release() }; players.clear() }
}

@Composable
fun NativeSettingsScreen(session: GameSession) {
    val settings = session.settings
    val uri = LocalUriHandler.current
    val slider = SliderDefaults.colors(thumbColor = Mov.Accent, activeTrackColor = Mov.Accent, inactiveTrackColor = Mov.Sunken)
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        ScreenHeader("Settings", "Game settings")
        MovCard {
            CardHead("Sound")
            NativeToggle("Sound effects", settings.soundOn, settings::sound)
            KeyValue("Volume", "${(settings.volume * 100).toInt()}%")
            Slider(settings.volume, settings::volume, enabled = settings.soundOn, modifier = Modifier.semantics { contentDescription = "Sound volume" }, colors = slider)
            SecondaryButton("Preview sound", { settings.play("turnAdvance") }, enabled = settings.soundOn)
        }
        MovCard {
            CardHead("Motion and controls")
            NativeToggle("Reduce motion", settings.reducedMotion, settings::motion)
            Text("Election night uses instant results when this or your device's animation setting is on.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            Hairline()
            NativeToggle("Keyboard shortcuts", settings.hotkeysOn, settings::hotkeys)
            Text("Enter or Space ends the week, with confirmation if no moves are queued. 1 through 9 selects a move. Escape closes a recap or selection. ? opens Settings. Shortcuts pause while typing or resolving an event.", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
        }
        MovCard {
            CardHead("Learn and create")
            SecondaryButton("Replay tutorial", { settings.replayTutorial(); session.resumeGame() }, Modifier.fillMaxWidth(),
                enabled = (session.game.value.state != null || session.campaign.value != null))
            SecondaryButton("How to play", { session.go(Screen.GUIDE) }, Modifier.fillMaxWidth())
            SecondaryButton("Scenario editor", { session.go(Screen.EDITOR) }, Modifier.fillMaxWidth())
        }
        MovCard(tight = true) {
            CardHead("About")
            GhostButton("Privacy policy", { uri.openUri("https://lakesidegames.net/games/electioneer/?legal=privacy") }, color = Mov.Info)
            GhostButton("Terms of service", { uri.openUri("https://lakesidegames.net/games/electioneer/?legal=terms") }, color = Mov.Info)
            GhostButton("Contact support", { uri.openUri("mailto:support@lakesidegames.net") }, color = Mov.Info)
            GhostButton("Web game", { uri.openUri("https://lakesidegames.net/games/electioneer/") }, color = Mov.Info)
            Text("Version ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})", style = MaterialTheme.typography.bodySmall.num, color = Mov.Text4)
        }
    }
}

@Composable
internal fun NativeToggle(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = MovSpace.touch).toggleable(value = checked, role = Role.Switch, onValueChange = onChange),
        verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f), color = Mov.Text1, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = null, colors = SwitchDefaults.colors(checkedThumbColor = Mov.OnAccent, checkedTrackColor = Mov.Accent,
            uncheckedThumbColor = Mov.Text3, uncheckedTrackColor = Mov.Sunken, uncheckedBorderColor = Mov.BorderStrong))
    }
}

@Composable
fun NativeGuideScreen() {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        ScreenHeader("How to play", "Run a winning campaign")
        NativeHelp.guide().forEach { lesson ->
            MovCard {
                CardHead(lesson.title)
                Text(lesson.body, color = Mov.Text2, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun NativeCampaignCoach(session: GameSession, country: String, goal: String, turn: Int, selected: String?, queued: Int) {
    val settings = session.settings
    var step by remember(country) { mutableStateOf<Int?>(if (settings.takeTutorialReplay() || (turn == 0 && !settings.tourDone(country))) 0 else null) }
    var startTurn by remember(country) { mutableIntStateOf(turn) }
    LaunchedEffect(settings.tutorialNonce) { if (settings.takeTutorialReplay()) { step = 0; startTurn = turn } }
    LaunchedEffect(selected) { if (step == 1 && selected != null) step = 2 }
    LaunchedEffect(queued) { if (step == 3 && queued > 0) step = 4 }
    LaunchedEffect(turn) { if (step == 4 && turn > startTurn) step = 5 }
    fun finish() { step = null; settings.finishTour(country) }
    step?.let { index ->
        val lesson = NativeHelp.steps(country, goal)[index]
        Callout("Tour · ${index + 1} of 8 · ${lesson.title}", lesson.body, Modifier.padding(MovSpace.s3).semantics { liveRegion = LiveRegionMode.Polite }, kind = NoticeKind.Info) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                GhostButton("Skip tour", ::finish, color = Mov.Text2)
                Spacer(Modifier.weight(1f))
                if (index > 0) GhostButton("Back", { step = index - 1 }, color = Mov.Text2)
                SecondaryButton(if (index == 7) "Done" else "Next", { if (index == 7) finish() else step = index + 1 })
            }
        }
    }
}
