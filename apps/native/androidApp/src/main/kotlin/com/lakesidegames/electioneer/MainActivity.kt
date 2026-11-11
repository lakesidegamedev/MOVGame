package com.lakesidegames.electioneer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.BackHandler
import android.app.Activity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.ui.Mov
import com.lakesidegames.electioneer.ui.MovTheme
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.material3.TextButton
import com.lakesidegames.electioneer.ui.AskDialog
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.lakesidegames.electioneer.ui.CampaignSavesScreen
import com.lakesidegames.electioneer.ui.AnalysisScreen
import com.lakesidegames.electioneer.ui.AccountScreen
import com.lakesidegames.electioneer.ui.GameScreen
import com.lakesidegames.electioneer.ui.GameSession
import com.lakesidegames.electioneer.ui.HomeScreen
import com.lakesidegames.electioneer.ui.ResultsScreen
import com.lakesidegames.electioneer.ui.Screen
import com.lakesidegames.electioneer.ui.SetupScreen
import com.lakesidegames.electioneer.ui.StoreScreen
import com.lakesidegames.electioneer.ui.CampaignLibraryScreen
import com.lakesidegames.electioneer.ui.ElectionNightScreen
import com.lakesidegames.electioneer.ui.NativeEditorScreen
import com.lakesidegames.electioneer.ui.NativeSettingsScreen
import com.lakesidegames.electioneer.ui.NativeGuideScreen
import com.lakesidegames.electioneer.ui.NativeCampaignCoach
import com.lakesidegames.electioneer.ui.DailyBoardsScreen
import com.lakesidegames.electioneer.ui.WorldCampaignScreen

class MainActivity : ComponentActivity() {
    private lateinit var gameSession: GameSession
    override fun onResume() { super.onResume(); if (::gameSession.isInitialized) gameSession.requestCloudSync(force = true) }
    override fun dispatchKeyEvent(event: android.view.KeyEvent): Boolean {
        if (::gameSession.isInitialized && gameSession.settings.hotkeysOn &&
            event.action == android.view.KeyEvent.ACTION_DOWN && event.repeatCount == 0 &&
            !event.isCtrlPressed && !event.isAltPressed && !event.isMetaPressed &&
            gameSession.screen.value in listOf(Screen.GAME, Screen.WORLD_GAME) &&
            !(getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).isAcceptingText) {
            val key = when (event.keyCode) {
                android.view.KeyEvent.KEYCODE_ENTER, android.view.KeyEvent.KEYCODE_NUMPAD_ENTER -> "enter"
                android.view.KeyEvent.KEYCODE_SPACE -> " "
                android.view.KeyEvent.KEYCODE_ESCAPE -> "escape"
                else -> event.unicodeChar.toChar().toString()
            }
            if (key in listOf("enter", " ", "escape", "?", "1", "2", "3", "4", "5", "6", "7", "8", "9")) {
                if (key == "?") gameSession.go(Screen.SETTINGS) else gameSession.sendShortcut(key)
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Stock ViewModelProvider: no viewmodel-compose artifact needed.
        val session = ViewModelProvider(this)[GameSession::class.java]
        gameSession = session
        session.attachStorage(applicationContext)
        session.attachBilling(applicationContext)
        if (BuildConfig.DEBUG) intent.getStringExtra("mov_capture")?.let { flow ->
            runCatching { captureDebugFlow(session, flow) }.onFailure { android.util.Log.e("MOVCapture", "Capture failed: $flow", it) }
        }
        setContent { MarginOfVictoryApp(session, this) }
    }
}

@Composable
fun MarginOfVictoryApp(session: GameSession, activity: Activity) {
    val screen by session.screen.collectAsState()
    var askUrl by remember { mutableStateOf<String?>(null) }
    val capture = if (BuildConfig.DEBUG) activity.intent.getStringExtra("mov_capture") else null
    LaunchedEffect(capture) { if (capture?.startsWith("ask") == true) askUrl = session.askUrl() }
    BackHandler(enabled = screen != Screen.HOME && screen != Screen.REVEAL) {
        if (screen in listOf(Screen.SETTINGS, Screen.GUIDE, Screen.BOARDS, Screen.SAVES, Screen.EDITOR)) session.go(Screen.ACCOUNT)
        else if (screen in listOf(Screen.ANALYSIS, Screen.REPLAY)) session.resumeGame()
        else session.go(Screen.HOME)
    }
    MovTheme {
        Surface(color = Mov.Surface0) {
            if (askUrl != null) AskDialog(askUrl!!, onRefresh = session::askUrl,
                onClose = { askUrl = null }, smoke = capture?.takeIf { it in listOf("ask-offline", "ask-blank", "ask-retry") })
            Scaffold(
                containerColor = Mov.Surface0,
                topBar = {
                    if (screen in listOf(Screen.HOME, Screen.GAME, Screen.WORLD_GAME, Screen.RESULTS)) {
                        Row(Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(if (screen == Screen.HOME) "" else "Margin of Victory", Modifier.padding(start = 12.dp).weight(1f), color = Mov.Text3,
                                style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                            TextButton(onClick = { askUrl = session.askUrl() }, colors = ButtonDefaults.textButtonColors(contentColor = Mov.Info)) {
                                Text(if (session.hasSave()) "Ask about this campaign" else "Ask about Margin of Victory", style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    }
                },
                bottomBar = {
                    val itemColors = NavigationBarItemDefaults.colors(selectedIconColor = Mov.Text1, selectedTextColor = Mov.Text1,
                        indicatorColor = Mov.AccentSoft, unselectedIconColor = Mov.Text3, unselectedTextColor = Mov.Text3)
                    NavigationBar(containerColor = Mov.Surface1, tonalElevation = 0.dp) {
                        NavigationBarItem(
                            selected = screen == Screen.HOME || screen == Screen.SETUP || screen == Screen.LOADING ||
                                screen == Screen.GAME ||
                                screen == Screen.RESULTS || screen == Screen.LIBRARY || screen == Screen.WORLD_GAME || screen == Screen.ANALYSIS || screen == Screen.REPLAY || screen == Screen.REVEAL,
                            onClick = { session.playTab() },
                            icon = { Icon(Icons.Filled.PlayArrow, contentDescription = null) },
                            label = { Text("Play") },
                            colors = itemColors,
                        )
                        NavigationBarItem(
                            selected = screen == Screen.STORE,
                            onClick = { session.go(Screen.STORE) },
                            icon = { Icon(Icons.Filled.ShoppingCart, contentDescription = null) },
                            label = { Text("Store") },
                            colors = itemColors,
                        )
                        NavigationBarItem(
                            selected = screen in listOf(Screen.ACCOUNT, Screen.SAVES, Screen.BOARDS, Screen.SETTINGS, Screen.GUIDE, Screen.EDITOR),
                            onClick = { session.go(Screen.ACCOUNT) },
                            icon = { Icon(Icons.Filled.AccountCircle, contentDescription = null) },
                            label = { Text("Account") },
                            colors = itemColors,
                        )
                    }
                },
            ) { inner ->
                val mod = Modifier.padding(inner)
                Box(mod.fillMaxSize(), contentAlignment = Alignment.TopCenter) { Box(Modifier.widthIn(max = 840.dp).fillMaxSize()) {
                    when (screen) {
                        Screen.HOME -> HomeScreen(session)
                        Screen.SETUP -> SetupScreen(session)
                        Screen.LOADING -> Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)) {
                            CircularProgressIndicator(color = Mov.Accent)
                            Text("Preparing the campaign", color = Mov.Text2)
                        }
                        Screen.GAME -> GameScreen(session)
                        Screen.RESULTS -> ResultsScreen(session)
                        Screen.REVEAL -> ElectionNightScreen(session)
                        Screen.STORE -> StoreScreen(session, activity)
                        Screen.ACCOUNT -> AccountScreen(session)
                        Screen.SETTINGS -> NativeSettingsScreen(session)
                        Screen.GUIDE -> NativeGuideScreen()
                        Screen.EDITOR -> NativeEditorScreen(session)
                        Screen.BOARDS -> DailyBoardsScreen(session)
                        Screen.SAVES -> CampaignSavesScreen(session)
                        Screen.ANALYSIS -> AnalysisScreen(session)
                        Screen.REPLAY -> AnalysisScreen(session, timeline = true)
                        Screen.LIBRARY -> CampaignLibraryScreen(session)
                        Screen.WORLD_GAME -> WorldCampaignScreen(session)
                    }
                } }
            }
        }
    }
}
