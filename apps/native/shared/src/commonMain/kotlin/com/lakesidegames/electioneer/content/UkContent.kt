package com.lakesidegames.electioneer.content

import com.lakesidegames.electioneer.engine.PartyDef
import com.lakesidegames.electioneer.engine.PartyId

// Hand-ported UK content functions (the data tables are generated bundles).
// Mirrors content/uk/leaders.ts, events.ts and elections.ts. Country rules
// (coalitions, government text) are bundle data, see UkTypes.kt.

fun leaderFor(electionId: String, partyId: PartyId, partyName: String): UkLeader {
    return UK_LEADERS[electionId]?.get(partyId) ?: UkLeader(
        partyId = partyId,
        name = "$partyName leader",
        charisma = 55.0, energy = 60.0, competence = 60.0, machine = 55.0,
    )
}

fun headlineFor(ev: UkEvent, partyShort: String): String =
    ev.headline.replaceFirst("{party}", partyShort)

val UK_MAJORS: List<PartyId> = listOf("lab", "con", "ld", "ref", "grn", "snp", "pc")

// Parties a human may lead (GB-wide majors). NI parties + 'oth' are AI/fixed.
val UK_PLAYABLE: List<PartyId> = UK_MAJORS.toList()

val PARTY_BY_ID: Map<String, PartyDef> = UK_SYSTEM.parties.associateBy { it.id }

fun pickTarget(
    role: String,
    player: PartyId,
    leader: PartyId,
    parties: List<PartyId>,
    pick: (List<PartyId>) -> PartyId,
): PartyId {
    val majors = parties.filter { UK_MAJORS.contains(it) }
    return when (role) {
        "player" -> player
        "leader" -> leader
        "challenger" -> majors.filter { it != leader }.let { if (it.isNotEmpty()) pick(it) else player }
        else -> if (majors.isNotEmpty()) pick(majors) else player
    }
}

fun majorityForElection(electionId: String): UkMajority =
    UK_ELECTION_MAJORITY[electionId] ?: UkMajority(total = 650, threshold = 326)

fun poolFor(electionId: String, regionId: String): Int =
    UK_BOUNDARY_POOLS[electionId]?.get(regionId)
        ?: UK_BOUNDARY_POOLS.getValue("2024")[regionId]
        ?: 0
