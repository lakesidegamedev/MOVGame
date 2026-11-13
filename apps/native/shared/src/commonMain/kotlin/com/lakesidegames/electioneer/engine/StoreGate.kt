package com.lakesidegames.electioneer.engine

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull

/**
 * Whether a native client locks paid elections, and which packs its store can
 * sell. Android (Google Play) and iOS (App Store) share this one rule: a paid
 * election locks only while the server has native gating on, the device's
 * store is ready for sales, and that election's own pack can be bought there,
 * so nobody is locked out of something they cannot buy. [OPEN], the default
 * and the result of every failure, locks nothing.
 */
data class StoreGate(val gating: Boolean = false, val sellable: Set<String> = emptySet()) {
    /** The server's view, plus the store product id (SKU) of each pack it says the store can sell. */
    data class Server(val gate: StoreGate, val skus: Map<String, String>)

    companion object {
        val OPEN = StoreGate()
        const val GOOGLE = "google"
        const val APPLE = "apple"

        /**
         * Reads the public store catalog (or the binding, which carries the
         * same fields) for [store] ([GOOGLE] or [APPLE]). Older servers send
         * only purchasesEnabled; a missing nativeGating means off. A product
         * row needs a non-empty `<store>Sku`, and newer servers also say per
         * pack whether that store can sell it (an unlisted pack cannot).
         */
        fun fromServer(json: String, store: String): Server {
            val closed = Server(OPEN, emptyMap())
            if (store != GOOGLE && store != APPLE) return closed
            val root = runCatching { Json.parseToJsonElement(json) as? JsonObject }.getOrNull() ?: return closed
            fun JsonObject.flag(key: String): Boolean? = (get(key) as? JsonPrimitive)?.takeIf { !it.isString }?.booleanOrNull
            val ready = (root["stores"] as? JsonObject)?.flag(store) ?: root.flag("purchasesEnabled") ?: false
            if (root.flag("nativeGating") != true || !ready) return closed
            val known = NativeCatalog.packIds()
            val skuKey = store + "Sku"
            val skus = (root["products"] as? JsonArray).orEmpty().mapNotNull { row ->
                val product = row as? JsonObject ?: return@mapNotNull null
                val pack = (product["packId"] as? JsonPrimitive)?.takeIf { it.isString }?.content ?: return@mapNotNull null
                val sku = (product[skuKey] as? JsonPrimitive)?.takeIf { it.isString }?.content?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                val purchasable = (product["purchasable"] as? JsonObject)?.flag(store) ?: true
                if (pack in known && purchasable) sku to pack else null
            }.toMap()
            return Server(StoreGate(gating = skus.isNotEmpty(), sellable = skus.values.toSet()), skus)
        }
    }

    /** Keep only the packs whose store product actually loaded on this device. */
    fun onDevice(loadedPacks: Set<String>): StoreGate {
        val packs = sellable intersect loadedPacks
        return if (packs.isEmpty()) OPEN else StoreGate(gating, packs)
    }

    /**
     * The pack a new campaign on [country]/[nativeId] needs, or null when it
     * is playable: gating off, free, today's daily, owned through any pack
     * (Lakeside account, Google Play, App Store, Complete Collection, legacy
     * Global pack, any Lakeside supporter tier), unlocked on the account (activation codes
     * and web unlocks on the game account, linked or not), or not sellable here.
     */
    fun lockedPack(country: String, nativeId: String, ownedPacks: Set<String>, accountScenarios: Set<String>, dailyScenarioId: String?): String? {
        if (!gating) return null
        val pack = NativeAccess.lockedPack(country, nativeId, ownedPacks.toList(), true, dailyScenarioId) ?: return null
        if (pack !in sellable) return null
        val scenario = MobileCampaign.elections(country.uppercase()).firstOrNull { it.nativeId == nativeId }?.scenarioId
        return if (scenario != null && scenario in accountScenarios) null else pack
    }
}
