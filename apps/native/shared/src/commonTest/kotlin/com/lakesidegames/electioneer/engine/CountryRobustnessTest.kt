package com.lakesidegames.electioneer.engine

import com.lakesidegames.electioneer.content.COUNTRIES
import com.lakesidegames.electioneer.content.CountryBlocDef
import com.lakesidegames.electioneer.content.CountryBundle
import com.lakesidegames.electioneer.content.RegionResult
import com.lakesidegames.electioneer.content.countryGovernmentText
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

// Every registered country, bent into the shapes later countries bring: a
// party that stands in one election but not another, a party with votes and
// no seats, a region one party does not contest, a voter bloc no older
// country has, and a two-round flag on a country other than France. The
// engine must play each to a result without throwing, keep every seat, and
// survive a save round trip. Runs over COUNTRIES, so a new country is covered
// the moment its bundle is exported.
class CountryRobustnessTest {
    private fun stressed(country: CountryBundle): CountryBundle {
        val newest = country.elections.values.maxBy { it.year }
        val active = newest.regions.values.flatMap { it.v.keys + it.s.keys }.distinct()
        val playable = active.filter { it in country.playable }
        // Keep the two leading playable parties intact so the game has a player and a rival.
        val bendable = active.filter { it !in playable.take(2) }
        val dropped = bendable.lastOrNull()
        val seatless = bendable.dropLast(1).lastOrNull()
        val firstRegion = newest.regions.keys.first()
        val absentHere = bendable.firstOrNull { it != dropped && it != seatless }

        val regions = newest.regions.mapValues { (id, r) ->
            val removed = setOfNotNull(dropped, absentHere.takeIf { id == firstRegion })
            val v = r.v.filterKeys { it !in removed }
            var s = r.s.filterKeys { it !in removed }
            // Seats taken from removed or seatless parties go to the region's
            // top remaining holder, so the region's pool is unchanged.
            val freed = r.s.filterKeys { it in removed || it == seatless }.values.sum()
            if (seatless != null && seatless in s) s = s + (seatless to 0)
            if (freed > 0) {
                val top = s.entries.filter { it.key != seatless }.maxByOrNull { it.value }?.key ?: playable.first()
                s = s + (top to (s[top] ?: 0) + freed)
            }
            RegionResult(v = v, s = s)
        }
        val variant = newest.copy(id = "stress", year = newest.year + 1, regions = regions)
        val extraBloc = CountryBlocDef(
            id = "stress_bloc", name = "Synthetic bloc", share = 0.1, turnoutPropensity = 0.7,
            tilt = mapOf(playable.first() to 0.3, "no_such_party" to 0.2),
        )
        return country.copy(
            elections = country.elections + ("stress" to variant),
            blocs = country.blocs + extraBloc,
            runoff = true,
        )
    }

    @Test fun everyCountryPlaysThroughRostersSeatlessPartiesAndNewBlocs() {
        for ((code, original) in COUNTRIES) {
            val country = stressed(original)
            val election = country.elections.getValue("stress")
            val pool = election.regions.values.sumOf { it.s.values.sum() }
            for (player in playablePartiesIn(country, "stress")) {
                var g = createCountryGame(country, NewCountryGameOptions(election = "stress", playerParty = player, seed = "stress-$code-$player"))
                assertEquals(player, g.playerParty, "$code $player")
                assertTrue(g.regions.all { r -> r.blocs.any { it.blocId.serial == "stress_bloc" } }, "$code $player bloc")
                var guard = 0
                while (g.phase != "result" && guard++ < 50) g = countryAdvanceTurn(g, country)
                assertEquals("result", g.phase, "$code $player never finished")
                val result = g.result!!
                assertEquals(pool, result.seats.values.sum(), "$code $player seats")
                assertTrue(result.seats.keys.all { it in g.parties }, "$code $player seat keys ${result.seats.keys}")
                assertTrue(countryGovernmentText(country, result.government) { it }.let { it == null || '{' !in it }, "$code $player government text")
                val restored = EngineJson.decodeFromString<CountryGameState>(EngineJson.encodeToString(CountryGameState.serializer(), g))
                assertEquals(g, restored, "$code $player save")
            }
        }
    }

    @Test fun anElectionWithoutAPartyLeavesThatPartyOutOfTheGame() {
        for ((code, original) in COUNTRIES) {
            val country = stressed(original)
            val stress = country.elections.getValue("stress")
            val newest = original.elections.values.maxBy { it.year }
            val missing = newest.regions.values.flatMap { it.v.keys + it.s.keys }.toSet() -
                stress.regions.values.flatMap { it.v.keys + it.s.keys }.toSet()
            val g = createCountryGame(country, NewCountryGameOptions(election = "stress", seed = 7))
            assertTrue(g.parties.none { it in missing }, "$code ${g.parties} vs $missing")
            assertTrue(g.leaders.keys.none { it in missing } && g.resources.keys.none { it in missing }, code)
            // An unknown party never becomes the player.
            val fallback = createCountryGame(country, NewCountryGameOptions(election = "stress", playerParty = "no_such_party", seed = 7))
            assertTrue(fallback.playerParty in fallback.parties, code)
        }
    }
}
