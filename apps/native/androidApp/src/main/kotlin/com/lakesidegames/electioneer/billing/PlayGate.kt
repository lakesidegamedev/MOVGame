package com.lakesidegames.electioneer.billing

import com.lakesidegames.electioneer.engine.MobileCampaign
import com.lakesidegames.electioneer.engine.NativeAccess
import com.lakesidegames.electioneer.engine.NativeCatalog
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull

/**
 * Whether Android locks paid elections, and which packs Google Play can sell.
 * A paid election locks only while the server has native gating on, Google
 * Play is ready for sales, and its own pack can be bought here, so nobody is
 * locked out of something they cannot buy. [OPEN], the default and the result
 * of every failure, locks nothing.
 */
data class PlayGate(val gating: Boolean = false, val sellable: Set<String> = emptySet()) {
    /** The server's view, plus the Play SKU of each pack it says Play can sell. */
    data class Server(val gate: PlayGate, val skus: Map<String, String>)

    companion object {
        val OPEN = PlayGate()

        /**
         * Reads the public store catalog (or the binding, which carries the
         * same fields). Older servers send only purchasesEnabled; a missing
         * nativeGating means off.
         */
        fun fromServer(json: String): Server {
            val root = runCatching { Json.parseToJsonElement(json) as? JsonObject }.getOrNull() ?: return Server(OPEN, emptyMap())
            fun JsonObject.flag(key: String): Boolean? = (get(key) as? JsonPrimitive)?.takeIf { !it.isString }?.booleanOrNull
            val googleReady = (root["stores"] as? JsonObject)?.flag("google") ?: root.flag("purchasesEnabled") ?: false
            if (root.flag("nativeGating") != true || !googleReady) return Server(OPEN, emptyMap())
            val known = NativeCatalog.packIds()
            val skus = (root["products"] as? JsonArray).orEmpty().mapNotNull { row ->
                val product = row as? JsonObject ?: return@mapNotNull null
                val pack = (product["packId"] as? JsonPrimitive)?.takeIf { it.isString }?.content ?: return@mapNotNull null
                val sku = (product["googleSku"] as? JsonPrimitive)?.takeIf { it.isString }?.content?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                // Newer servers say per pack whether Play can sell it (an unlisted pack cannot).
                val purchasable = (product["purchasable"] as? JsonObject)?.flag("google") ?: true
                if (pack in known && purchasable) sku to pack else null
            }.toMap()
            return Server(PlayGate(gating = skus.isNotEmpty(), sellable = skus.values.toSet()), skus)
        }
    }

    /** Keep only the packs whose Play product actually loaded on this device. */
    fun onDevice(loadedPacks: Set<String>): PlayGate {
        val packs = sellable intersect loadedPacks
        return if (packs.isEmpty()) OPEN else PlayGate(gating, packs)
    }

    /**
     * The pack a new campaign on [country]/[nativeId] needs, or null when it
     * is playable: gating off, free, today's daily, owned through any pack
     * (Lakeside account, Google Play, App Store, Complete Collection, legacy
     * Global pack, Supporter perk), unlocked on the account, or not sellable.
     */
    fun lockedPack(country: String, nativeId: String, ownedPacks: Set<String>, accountScenarios: Set<String>, dailyScenarioId: String?): String? {
        if (!gating) return null
        val pack = NativeAccess.lockedPack(country, nativeId, ownedPacks.toList(), true, dailyScenarioId) ?: return null
        if (pack !in sellable) return null
        val scenario = MobileCampaign.elections(country.uppercase()).firstOrNull { it.nativeId == nativeId }?.scenarioId
        return if (scenario != null && scenario in accountScenarios) null else pack
    }
}
