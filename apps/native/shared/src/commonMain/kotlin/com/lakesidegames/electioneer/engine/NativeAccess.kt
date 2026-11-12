package com.lakesidegames.electioneer.engine

/**
 * Scenario access for the native clients. Locks apply only while the server
 * turns native gating on, which it does only once a native purchase has been
 * proven to unlock a pack; with gating off every election stays playable.
 * Ownership is resolved per scenario through the exported pack lists, exactly
 * like the web (packs.ts): the Complete Collection holds every paid scenario
 * and the retired Global pack holds its frozen list.
 */
object NativeAccess {
    /** True when owning [ownedPacks] covers every scenario in [packId] (web packCovered). */
    fun covers(packId: String, ownedPacks: List<String>): Boolean {
        if (packId in ownedPacks) return true
        val target = NativeCatalog.pack(packId) ?: return false
        val owned = NativeCatalog.ownedScenarios(ownedPacks)
        return target.scenarios.all { it in owned }
    }

    /**
     * The pack a new campaign on [country]/[nativeId] needs, or null when it is
     * playable: gating off, free, today's daily challenge, unknown, or owned.
     */
    fun lockedPack(country: String, nativeId: String, ownedPacks: List<String>, gating: Boolean, dailyScenarioId: String?): String? {
        if (!gating) return null
        val election = nativeElections.firstOrNull { it.country.equals(country, ignoreCase = true) && it.nativeId == nativeId }
            ?: return null
        if (election.free || election.scenarioId == dailyScenarioId) return null
        val pack = election.packId ?: return null
        return if (pack in ownedPacks || election.scenarioId in NativeCatalog.ownedScenarios(ownedPacks)) null else pack
    }
}
