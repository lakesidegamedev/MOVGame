package com.lakesidegames.electioneer.content

import com.lakesidegames.electioneer.engine.Government
import com.lakesidegames.electioneer.engine.PartyId
import com.lakesidegames.electioneer.engine.PartyDef
import com.lakesidegames.electioneer.engine.PoliticalSystem
import kotlinx.serialization.Serializable

// UK + country content descriptors (mirrors content/uk/* and
// content/countries/*). Data tables are generated; country rules are data
// interpreted here exactly as the web engine interprets them.

// ── UK ─────────────────────────────────────────────────────────────────────

@Serializable
data class UkLeader(
    val partyId: PartyId,
    val name: String,
    val charisma: Double,
    val energy: Double,
    val competence: Double,
    val machine: Double,
)

@Serializable
data class UkEventChoice(
    val id: String,
    val text: String,
    val resultText: String,
    val appeal: Double? = null,
    val momentum: Double? = null,
    val rivalAppeal: Double? = null,
)

@Serializable
data class UkEvent(
    val id: String,
    // {party} is substituted with the target party's short name.
    val headline: String,
    val role: String,
    val weight: Double,
    val appeal: Double? = null,
    val momentum: Double? = null,
    // Fixed target party regardless of role.
    val party: PartyId? = null,
    // Scheduled story beat: fires at this turn index instead of the draw.
    val turn: Int? = null,
    val prompt: String? = null,
    val choices: List<UkEventChoice>? = null,
)

@Serializable
data class UkMajority(
    val total: Int,
    val threshold: Int,
)

@Serializable
data class RegionResult(
    val v: Map<String, Double>,
    val s: Map<String, Int>,
)

@Serializable
data class UkElectionData(
    val id: String,
    val year: Int,
    val label: String,
    val tagline: String,
    val salience: Map<String, Double>,
    // The issues this election ran on; null means the shared UK list.
    val issues: List<CountryIssueDef>? = null,
    val regions: Map<String, RegionResult>,
    val majority: UkMajority? = null,
    val goalText: String? = null,
)

@Serializable
data class UkRegionMeta(
    val id: String,
    val name: String,
    val abbr: String,
    val nation: String,
    // 2024-boundary seat pool.
    val seats: Int,
    // Thousands of votes cast (approx).
    val electorate: Double,
    val profile: Map<String, Double>? = null,
)

@Serializable
data class UkBlocDef(
    val id: String,
    val name: String,
    val share: Double,
    val turnoutPropensity: Double,
    val tilt: Map<String, Double>,
)

@Serializable
data class UkIssue(
    val id: String,
    val name: String,
    val baseSalience: Double,
    val blurb: String,
)

// ── Countries ──────────────────────────────────────────────────────────────

@Serializable
data class CountryIssueDef(
    val id: String,
    val name: String,
    val blurb: String,
)

@Serializable
data class CountryBlocDef(
    val id: String,
    val name: String,
    // National electorate fraction (normalized per region).
    val share: Double,
    val turnoutPropensity: Double,
    // Per-party logit nudge vs the region baseline.
    val tilt: Map<String, Double>,
)

@Serializable
data class CountryRegionMeta(
    val id: String,
    val name: String,
    val abbr: String,
    // The region's awardable-unit pool.
    val seats: Int,
    // Thousands of votes cast (weights the national aggregate).
    val electorate: Double,
    val profile: Map<String, Double>? = null,
    val seatElasticity: Double? = null,
)

@Serializable
data class CountryElectionData(
    val id: String,
    val year: Int,
    val label: String,
    val tagline: String,
    val salience: Map<String, Double>,
    // The issues this election ran on; null means the country's list.
    val issues: List<CountryIssueDef>? = null,
    val campaignPower: Map<PartyId, Double>? = null,
    val regions: Map<String, RegionResult>,
    val majority: UkMajority? = null,
    val events: List<CountryEventDef> = emptyList(),
)

@Serializable
data class CountryLeader(
    val partyId: PartyId,
    val name: String,
    val charisma: Double,
    val energy: Double,
    val competence: Double,
    val machine: Double,
)

@Serializable
data class CountryEventChoice(
    val id: String,
    val text: String,
    val resultText: String,
    val appeal: Double? = null,
    val momentum: Double? = null,
    val rivalAppeal: Double? = null,
)

@Serializable
data class CountryEventDef(
    val id: String,
    val headline: String,
    val role: String,
    val weight: Double,
    val appeal: Double? = null,
    val momentum: Double? = null,
    val party: PartyId? = null,
    val turn: Int? = null,
    val choices: List<CountryEventChoice>? = null,
)

data class CountryBundle(
    val id: String,
    val label: String,
    val flag: String,
    val currency: String,
    val unitName: String,
    val unitNamePlural: String,
    val goalText: String,
    val system: PoliticalSystem,
    val playable: List<PartyId>,
    val abstaining: List<PartyId>,
    val defaultSeatElasticity: Double,
    val issues: List<CountryIssueDef>,
    val blocs: List<CountryBlocDef>,
    val regions: List<CountryRegionMeta>,
    val elections: Map<String, CountryElectionData>,
    val leaders: Map<String, Map<String, CountryLeader>>,
    val events: List<CountryEventDef>,
    val eventChance: Double,
    // Who may govern with whom (Germany's firewall, etc.), as exported data.
    val coalitions: CoalitionRules? = null,
    // Country-specific framing of the outcome, one template per government kind.
    val governmentText: Map<String, String> = emptyMap(),
    // Presidential two-round runoff (France).
    val runoff: Boolean = false,
    // Single-round plurality (Mexico): most units wins outright, no threshold
    // and no coalition step. Mirrors CountryBundle.plurality in countryGame.ts.
    val plurality: Boolean = false,
    // Longer goal line for the campaign coach: {majority} and {total} placeholders.
    val goalHint: String? = null,
    // Playable parties that stand in only part of the country: never the
    // target of a generic random event (web CountryBundle.regional).
    val regional: List<PartyId> = emptyList(),
)

// Declarative coalition rules, mirroring content/countries on the web
// (engine/countryGame.ts coalitionAllowed). A pair may govern together unless
// a rule forbids it.
@Serializable
data class CoalitionRules(
    val none: Boolean = false,
    val isolated: List<PartyId> = emptyList(),
    val forbidden: List<List<PartyId>> = emptyList(),
    val onlyWith: Map<PartyId, List<PartyId>> = emptyMap(),
)

fun coalitionAllowed(rules: CoalitionRules, lead: PartyId, partner: PartyId): Boolean {
    if (rules.none) return false
    if (rules.isolated.any { it == lead || it == partner }) return false
    if (rules.forbidden.any { (a, b) -> (a == lead && b == partner) || (a == partner && b == lead) }) return false
    rules.onlyWith[lead]?.let { if (partner !in it) return false }
    rules.onlyWith[partner]?.let { if (lead !in it) return false }
    return true
}

/** The engine-facing predicate, or null when every pair is compatible. */
val CountryBundle.compatible: ((lead: PartyId, partner: PartyId) -> Boolean)?
    get() = coalitions?.let { rules -> { lead: PartyId, partner: PartyId -> coalitionAllowed(rules, lead, partner) } }

private fun governmentKind(g: Government): String = when (g) {
    is Government.Majority -> "majority"
    is Government.Minority -> "minority"
    is Government.Coalition -> "coalition"
    is Government.ConfidenceSupply -> "confidence_supply"
    is Government.Hung -> "hung"
}

/**
 * The country's own outcome line, or null for the shell default. Placeholders
 * match the web: {party} {seats} {parties} {lead} {partner} {largest}.
 */
fun countryGovernmentText(country: CountryBundle, g: Government, partyName: (PartyId) -> String): String? {
    val template = country.governmentText[governmentKind(g)] ?: return null
    val values = when (g) {
        is Government.Majority -> mapOf("party" to partyName(g.party), "seats" to g.seats.toString())
        is Government.Minority -> mapOf("party" to partyName(g.party), "seats" to g.seats.toString())
        is Government.Coalition -> mapOf("parties" to g.parties.joinToString(" and ", transform = partyName), "seats" to g.seats.toString())
        is Government.ConfidenceSupply -> mapOf("lead" to partyName(g.lead), "partner" to partyName(g.partner), "seats" to g.seats.toString())
        is Government.Hung -> mapOf("largest" to partyName(g.largest))
    }
    return Regex("\\{(\\w+)\\}").replace(template) { values[it.groupValues[1]] ?: it.value }
}
