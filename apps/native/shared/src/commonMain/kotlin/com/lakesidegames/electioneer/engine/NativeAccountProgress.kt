package com.lakesidegames.electioneer.engine

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString

data class NativeCollectedAward(val scenarioId: String, val scenarioLabel: String, val award: NativeAward)
data class NativeAchievementUpload(val scenarioId: String, val payload: String)
@Serializable
private data class AchievementJournal(val version: Int = 1, val entries: Map<String, List<String>> = emptyMap())
@Serializable
private data class RemoteAchievement(@SerialName("scenario_id") val scenarioId: String,
    @SerialName("achievement_id") val achievementId: String)
@Serializable
private data class RemoteAchievements(val achievements: List<RemoteAchievement>)
@Serializable
private data class AchievementSubmission(val scenarioId: String, val achievementIds: List<String>)

/** Local and account awards form a union. Failed uploads stay available for the next sync. */
class NativeAccountProgress private constructor(private val entries: MutableMap<String, List<String>>) {
    companion object {
        fun empty(): NativeAccountProgress = NativeAccountProgress(mutableMapOf())
        fun restore(json: String?): NativeAccountProgress {
            val progress = empty()
            val journal = json?.let { runCatching { EngineJson.decodeFromString<AchievementJournal>(it) }.getOrNull() }
            if (journal?.version == 1) journal.entries.forEach { (scenario, ids) -> progress.record(scenario, ids) }
            return progress
        }
    }

    fun record(scenarioId: String, ids: List<String>): Boolean {
        if (nativeElections.none { it.country == "US" && it.scenarioId == scenarioId }) return false
        val validIds = ACHIEVEMENTS.map { it.id }.toSet()
        val combined = (entries[scenarioId].orEmpty() + ids.filter { it in validIds }).distinct().sorted()
        val changed = combined.isNotEmpty() && entries[scenarioId] != combined
        if (changed) entries[scenarioId] = combined
        return changed
    }

    fun recordSnapshot(snapshot: String): Boolean = runCatching {
        val saved = loadGame(snapshot) ?: return@runCatching false
        val scenario = nativeElections.firstOrNull { it.country == "US" && it.nativeId == saved.state.scenarioId } ?: return@runCatching false
        record(scenario.scenarioId, NativeResults.achievements(saved.state, saved.difficulty).map { it.id })
    }.getOrDefault(false)

    fun json(): String = EngineJson.encodeToString(AchievementJournal(entries = entries.entries.sortedBy { it.key }.associate { it.key to it.value }))

    fun awards(): List<NativeCollectedAward> = entries.entries.sortedBy { it.key }.flatMap { (scenario, ids) ->
        val label = nativeElections.first { it.scenarioId == scenario }.label
        ACHIEVEMENTS.filter { it.id in ids }.map {
            NativeCollectedAward(scenario, label, NativeAward(it.id, it.name, it.description, it.icon))
        }
    }

    /** Read the authenticated server collection before deciding which idempotent writes are needed. */
    fun uploads(serverJson: String): List<NativeAchievementUpload>? {
        val remote = runCatching { EngineJson.decodeFromString<RemoteAchievements>(serverJson).achievements }.getOrNull() ?: return null
        remote.forEach { record(it.scenarioId, listOf(it.achievementId)) }
        val acknowledged = remote.groupBy { it.scenarioId }.mapValues { it.value.map { row -> row.achievementId }.toSet() }
        return entries.entries.sortedBy { it.key }.mapNotNull { (scenario, ids) ->
            val missing = ids.filter { it !in acknowledged[scenario].orEmpty() }
            if (missing.isEmpty()) null else NativeAchievementUpload(scenario,
                EngineJson.encodeToString(AchievementSubmission(scenario, missing)))
        }
    }
}

/** The browser returns a short-lived code to the API origin. The native shell intercepts it. */
class NativeLakesideLogin(private val nonce: String) {
    init { require(Regex("[a-zA-Z0-9_-]{32,128}").matches(nonce)) }
    private var consumed = false

    companion object {
        /** Shown in place of Google's page when a player picks Google inside the app. */
        const val GOOGLE_UNAVAILABLE = "Google sign-in works only on the web: sign in at lakesidegames.net, " +
            "or use Apple, Discord or A House Divided here."

        /**
         * Google refuses its sign-in inside embedded app browsers, so the apps stop
         * at the first Google step: the sign-in page's own Google route, or
         * Google's account page if anything links there directly.
         */
        fun isGoogleSignIn(host: String?, path: String?): Boolean {
            val h = host?.lowercase() ?: return false
            if (h == "accounts.google.com") return true
            val p = path?.lowercase() ?: return false
            return (h == "ahousedividedgame.com" || h.endsWith(".ahousedividedgame.com") ||
                h == "lakesidegames.net" || h.endsWith(".lakesidegames.net")) &&
                (p == "/api/auth/google" || p.startsWith("/api/auth/google/"))
        }
    }

    fun startUrl(): String = "https://sim.ahousedividedgame.com/api/lakeside/login?return=" +
        "https%3A%2F%2Fsim.ahousedividedgame.com%2Fnative-login%3Fstate%3D$nonce"

    fun allows(scheme: String?, host: String?, port: Int): Boolean = scheme == "https" &&
        (port == -1 || port == 443) && host?.lowercase() in setOf(
            "sim.ahousedividedgame.com", "auth.lakesidegames.net", "auth.ahousedividedgame.com",
            "ahousedividedgame.com", "www.ahousedividedgame.com", "sandbox.ahousedividedgame.com",
            "accounts.lakesidegames.net", "discord.com", "www.google.com",
            // Continue with Apple on the Lakeside page: Apple's sign-in page and its frame.
            "appleid.apple.com", "idmsa.apple.com")

    fun isCallback(scheme: String?, host: String?, port: Int, path: String?): Boolean =
        scheme == "https" && host?.lowercase() == "sim.ahousedividedgame.com" && (port == -1 || port == 443) && path == "/native-login"

    fun takeCode(scheme: String?, host: String?, port: Int, path: String?, states: List<String>, codes: List<String>, fragment: String?, mainFrame: Boolean): String? {
        if (!isCallback(scheme, host, port, path) || consumed || !mainFrame || !fragment.isNullOrEmpty() || states != listOf(nonce) || codes.size != 1) return null
        val code = codes.single()
        if (!Regex("[a-zA-Z0-9_-]{32}").matches(code)) return null
        consumed = true
        return code
    }
}
