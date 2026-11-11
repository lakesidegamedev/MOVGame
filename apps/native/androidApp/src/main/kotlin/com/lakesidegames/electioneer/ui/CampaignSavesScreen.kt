package com.lakesidegames.electioneer.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun CampaignSavesScreen(session: GameSession) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val saves by session.namedSaves.collectAsState()
    val notice by session.saveNotice.collectAsState()
    val syncNotice by session.cloudSyncNotice.collectAsState()
    val account = session.account
    val user by account.user.collectAsState()
    val busy by account.busy.collectAsState()
    val cloud by account.cloudSaves.collectAsState()
    val remoteNotice by account.notice.collectAsState()
    var name by remember { mutableStateOf("") }
    var fileNotice by remember { mutableStateOf<String?>(null) }
    var exporting by remember { mutableStateOf<String?>(null) }
    var deletingLocal by remember { mutableStateOf<String?>(null) }
    var deletingCloud by remember { mutableStateOf<String?>(null) }
    var renaming by remember { mutableStateOf<String?>(null) }
    var rename by remember { mutableStateOf("") }
    val importFile = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) scope.launch {
            runCatching {
                val json = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { stream ->
                        val data = ByteArrayOutputStream()
                        val buffer = ByteArray(8192)
                        var count = stream.read(buffer)
                        while (count >= 0) {
                            check(data.size() + count <= 2_000_000) { "Save file is too large." }
                            data.write(buffer, 0, count)
                            count = stream.read(buffer)
                        }
                        data.toByteArray().toString(Charsets.UTF_8)
                    } ?: error("Could not open save file.")
                }
                session.importCampaign(json)
            }.onFailure { fileNotice = it.message }
        }
    }
    val exportFile = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        val json = exporting
        exporting = null
        if (uri != null && json != null) scope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    context.contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray(Charsets.UTF_8)) }
                        ?: error("Could not write save file.")
                }
                fileNotice = "Campaign exported."
            }.onFailure { fileNotice = it.message }
        }
    }
    LaunchedEffect(user?.id) { if (user != null) account.loadCloudSaves() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        ScreenHeader("Your campaigns", "Saved campaigns",
            "Local saves work offline. When you are signed in, U.S. autosaves and named saves sync with the web.")
        listOfNotNull(fileNotice, notice, remoteNotice).distinct().forEach { Notice(it) }
        MovCard {
            CardHead("Current campaign") { Text(session.savedCampaignLabel() ?: "None", color = Mov.Text3, style = MaterialTheme.typography.labelMedium) }
            OutlinedTextField(name, { name = it }, label = { Text("Save name") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                colors = movFieldColors(), shape = MovRadius.md)
            PrimaryButton("Save current campaign", { if (session.saveNamed(name)) name = "" }, Modifier.fillMaxWidth(),
                enabled = name.isNotBlank() && session.currentSnapshot() != null)
            Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s2)) {
                SecondaryButton("Import file", { importFile.launch(arrayOf("application/json", "text/plain", "application/octet-stream")) }, Modifier.weight(1f))
                SecondaryButton("Export current", {
                    exporting = session.exportCampaign()
                    if (exporting != null) exportFile.launch("mov-campaign.json")
                }, Modifier.weight(1f), enabled = session.currentSnapshot() != null)
            }
        }
        Eyebrow("On this device · ${saves.size}")
        if (saves.isEmpty()) Text("No saved campaigns yet.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
        saves.forEach { save ->
            val document = save.document
            MovCard(tight = true) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(save.name, style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                        Text("${document?.label ?: "Campaign"} · Week ${document?.turn ?: 0}", style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                    }
                    if (save.cloudOwner != null) Tag("Cloud", TagKind.Info)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                    SecondaryButton("Load", { session.loadNamed(save.id) })
                    GhostButton("Rename", { renaming = save.id; rename = save.name }, color = Mov.Text2)
                    GhostButton("Delete", { deletingLocal = save.id }, color = Mov.Negative)
                }
                if (user != null && document?.engine == "us") Row(horizontalArrangement = Arrangement.spacedBy(MovSpace.s1)) {
                    GhostButton("Upload", { session.uploadSave(save.id) }, enabled = !busy)
                    GhostButton("Upload as new", { session.uploadSaveAsNew(save.id) }, enabled = !busy)
                }
            }
        }
        MovCard {
            CardHead("Cloud saves") { if (user != null) GhostButton("Refresh", account::loadCloudSaves, enabled = !busy) }
            if (user == null) SecondaryButton("Sign in to sync saves", { session.go(Screen.ACCOUNT) }, Modifier.fillMaxWidth())
            else {
                syncNotice?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Mov.Text2) }
                if (cloud.isEmpty()) Text("No cloud saves.", color = Mov.Text3, style = MaterialTheme.typography.bodyMedium)
                cloud.forEach { save ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("${save.name} · Week ${save.turn}", Modifier.weight(1f), color = Mov.Text1, style = MaterialTheme.typography.bodyMedium)
                        GhostButton("Download", { session.downloadSave(save.id) }, enabled = !busy)
                        GhostButton("Delete", { deletingCloud = save.id }, enabled = !busy, color = Mov.Negative)
                    }
                }
                GhostButton("Retry cloud sync", session::retryCloudSync, enabled = !busy, color = Mov.Text2)
            }
        }
        GhostButton("Back to account", { session.go(Screen.ACCOUNT) }, color = Mov.Text2)
    }
    if (renaming != null) AlertDialog(onDismissRequest = { renaming = null }, title = { Text("Rename campaign") },
        text = { OutlinedTextField(rename, { rename = it }) }, confirmButton = { TextButton(onClick = {
            session.renameSave(renaming!!, rename); renaming = null
        }, enabled = rename.isNotBlank()) { Text("Rename") } }, dismissButton = { TextButton(onClick = { renaming = null }) { Text("Cancel") } })
    if (deletingLocal != null || deletingCloud != null) AlertDialog(onDismissRequest = { deletingLocal = null; deletingCloud = null },
        title = { Text(if (deletingCloud != null) "Delete online save?" else "Delete local save?") },
        text = { Text("The current campaign will keep running.") }, confirmButton = { TextButton(onClick = {
            deletingLocal?.let(session::deleteLocalSave); deletingCloud?.let(account::deleteCloudSave)
            deletingLocal = null; deletingCloud = null
        }) { Text("Delete") } }, dismissButton = { TextButton(onClick = { deletingLocal = null; deletingCloud = null }) { Text("Cancel") } })
}
