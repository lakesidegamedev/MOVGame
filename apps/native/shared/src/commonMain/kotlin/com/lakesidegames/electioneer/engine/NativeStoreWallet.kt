package com.lakesidegames.electioneer.engine

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString

private const val storeGraceMillis = 7L * 86_400_000L
@Serializable
private data class StoreOwnership(val owner: String, val packIds: List<String>, val verifiedAt: Long)
@Serializable
private data class StoredWallet(val version: Int = 1, val sessionKey: String, val owner: String, val packIds: List<String>, val confirmedAt: Long, val sourceAt: Long)

/** Platform code protects the serialized wallet in Keychain or Keystore. Only
 * an authenticated server snapshot may replace it; cache reads never renew it. */
class NativeStoreWallet private constructor(private var wallet: StoredWallet?) {
    companion object {
        fun restore(json: String?): NativeStoreWallet = NativeStoreWallet(json?.let {
            runCatching { EngineJson.decodeFromString<StoredWallet>(it) }.getOrNull()
        }?.takeIf { it.version == 1 && it.owner.isNotBlank() }?.let { it.copy(packIds = it.packIds.filter { pack -> pack in NativeCatalog.packIds() }) })
    }
    fun accept(responseJson: String, sessionKey: String, expectedOwner: String, nowMillis: Long): Boolean {
        val snapshot = runCatching { EngineJson.decodeFromString<StoreOwnership>(responseJson) }.getOrNull() ?: return false
        if (sessionKey.isBlank() || expectedOwner.isBlank() || snapshot.owner != expectedOwner ||
            snapshot.verifiedAt <= 0 ||
            snapshot.verifiedAt < nowMillis - 300_000 || snapshot.verifiedAt > nowMillis + 300_000) return false
        val previous = wallet?.takeIf { it.sessionKey == sessionKey && it.owner == expectedOwner }
        if (previous != null && snapshot.verifiedAt < previous.sourceAt) return false
        // A newer server can report a pack this build does not ship (a country
        // added after this release). It carries no rights here and must not
        // discard what the player owns, so it is dropped, not rejected.
        val known = snapshot.packIds.filter { it in NativeCatalog.packIds() }
        val packs = if (previous != null && snapshot.verifiedAt == previous.sourceAt)
            known.filter { it in previous.packIds } else known
        wallet = StoredWallet(sessionKey = sessionKey, owner = expectedOwner,
            packIds = packs.distinct().sorted(), confirmedAt = minOf(nowMillis, snapshot.verifiedAt), sourceAt = snapshot.verifiedAt)
        return true
    }
    fun packs(sessionKey: String?, nowMillis: Long): List<String> {
        val saved = wallet ?: return emptyList()
        if (sessionKey.isNullOrBlank() || saved.sessionKey != sessionKey || saved.confirmedAt <= 0 ||
            nowMillis < saved.confirmedAt || nowMillis - saved.confirmedAt > storeGraceMillis) return emptyList()
        return saved.packIds
    }
    fun json(): String? = wallet?.let { EngineJson.encodeToString(it) }
}
