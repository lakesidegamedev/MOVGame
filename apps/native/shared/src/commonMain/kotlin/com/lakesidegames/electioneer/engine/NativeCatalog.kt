package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.CONTENT_CATALOG
import com.lakesidegames.electioneer.content.CatalogCountry
import com.lakesidegames.electioneer.content.CatalogPack

/**
 * The registered countries and store packs, read from the exported catalog
 * bundle. Native screens list countries, packs and daily roles from here, so
 * a new country on the web reaches both apps with regenerated bundles only.
 */
object NativeCatalog {
    fun countries(): List<NativeCountry> = CONTENT_CATALOG.countries.map { NativeCountry(it.id, it.name, it.flag) }

    fun countryIds(): List<String> = CONTENT_CATALOG.countries.map { it.id }

    fun country(id: String): CatalogCountry? = CONTENT_CATALOG.countries.firstOrNull { it.id == id }

    fun packs(): List<CatalogPack> = CONTENT_CATALOG.packs

    fun pack(id: String?): CatalogPack? = CONTENT_CATALOG.packs.firstOrNull { it.id == id }

    /** Every pack id a server snapshot may legitimately contain, legacy packs included. */
    fun packIds(): Set<String> = CONTENT_CATALOG.packs.mapTo(mutableSetOf()) { it.id }

    /** Player-facing pack name, matching the store products. */
    fun packName(packId: String?): String = pack(packId)?.name ?: "country"

    /** The `country` value each campaign writes into an Ask snapshot. */
    fun askCountryNames(): List<String> = CONTENT_CATALOG.countries.map { if (it.engine == "country") it.name else it.id }

    /** Scenario ids unlocked by owning [ownedPacks]. */
    fun ownedScenarios(ownedPacks: List<String>): Set<String> =
        CONTENT_CATALOG.packs.filter { it.id in ownedPacks }.flatMapTo(mutableSetOf()) { it.scenarios }
}
