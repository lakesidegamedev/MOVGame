package com.lakesidegames.electioneer.content

import com.lakesidegames.electioneer.engine.EngineJson
import com.lakesidegames.electioneer.engine.GameState
import kotlinx.serialization.Serializable

@Serializable
data class ArtLogo(val country: String, val party: String, val from: Int, val to: Int, val file: String)

/** One line of the Credits screen: what is shown, its Commons file, author and licence. */
@Serializable
data class ArtCredit(
    val name: String,
    val source: String,
    val title: String,
    val author: String,
    val license: String,
    val licenseUrl: String? = null,
)

@Serializable
data class ArtIndex(
    val portraits: Map<String, String>,
    val logos: List<ArtLogo>,
    val portraitCredits: List<ArtCredit>,
    val logoCredits: List<ArtCredit>,
)

/**
 * Leader photos and party logos, the same tables as the web (src/content/portraits.ts and
 * partyLogos.ts, exported to bundles/art.json). Lookups return a file name under
 * [DIRECTORY]; each app loads the image itself. Null means no image: show initials or
 * the party colour instead.
 */
object NativeArt {
    /** Resource folder of the image files, relative to the app's resources. */
    const val DIRECTORY = "bundles/art"

    private val index: ArtIndex by lazy { EngineJson.decodeFromString<ArtIndex>(bundleText("art")) }

    /** Photo of a leader or candidate by the full name the game shows. */
    fun portrait(name: String?): String? = name?.let { index.portraits[it] }

    /** The logo [party] used at this election, by country code ("US", "UK", "FR") and election id ("1974feb", "2024"). */
    fun logo(country: String, party: String, electionId: String?): String? {
        val year = electionYear(electionId) ?: return null
        val code = country.lowercase()
        return index.logos.firstOrNull { it.country == code && it.party == party && it.from <= year && year <= it.to }?.file
    }

    /** A U.S. party's logo ("dem", "rep") in this game's election year; none for custom races. */
    fun usLogo(game: GameState, side: String): String? {
        if (game.customScenario != null) return null
        val year = SCENARIOS[game.scenarioId ?: "2020"]?.year ?: return null
        return logo("US", side, year.toString())
    }

    /** "1974feb" and "2024" are both election ids; the year is the leading number. */
    fun electionYear(id: String?): Int? = id?.let { Regex("^\\d{4}").find(it)?.value?.toIntOrNull() }

    fun portraitCredits(): List<ArtCredit> = index.portraitCredits
    fun logoCredits(): List<ArtCredit> = index.logoCredits
}
