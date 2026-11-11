package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.border
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import com.lakesidegames.electioneer.engine.CandidateId
import com.lakesidegames.electioneer.engine.Projection

// Phase 3 map decision (#9): Compose tile grid, no map library. Approximate
// tile-grid cartogram, 12 cols x 8 rows, keyed by state abbr.
private val TILE_POS: Map<String, Pair<Int, Int>> = mapOf(
    "ME" to (11 to 0),
    "WI" to (3 to 1), "MI" to (7 to 1), "VT" to (10 to 1), "NH" to (11 to 1),
    "WA" to (0 to 2), "ID" to (1 to 2), "MT" to (2 to 2), "ND" to (3 to 2),
    "MN" to (4 to 2), "NY" to (8 to 2), "MA" to (10 to 2), "RI" to (11 to 2),
    "OR" to (0 to 3), "NV" to (1 to 3), "WY" to (2 to 3), "SD" to (3 to 3),
    "IA" to (4 to 3), "IL" to (5 to 3), "IN" to (6 to 3), "OH" to (7 to 3),
    "PA" to (8 to 3), "NJ" to (9 to 3), "CT" to (10 to 3),
    "CA" to (0 to 4), "UT" to (1 to 4), "CO" to (2 to 4), "NE" to (3 to 4),
    "MO" to (4 to 4), "KY" to (5 to 4), "WV" to (6 to 4), "VA" to (7 to 4),
    "MD" to (8 to 4), "DE" to (9 to 4), "DC" to (10 to 4),
    "AZ" to (1 to 5), "NM" to (2 to 5), "KS" to (3 to 5), "AR" to (4 to 5),
    "TN" to (5 to 5), "NC" to (7 to 5), "SC" to (8 to 5),
    "AK" to (0 to 6), "HI" to (1 to 6), "OK" to (3 to 6), "LA" to (4 to 6),
    "MS" to (5 to 6), "AL" to (6 to 6), "GA" to (7 to 6),
    "TX" to (3 to 7), "FL" to (8 to 7),
)

private const val COLS = 12
private const val ROWS = 8

private val byPos: Map<Pair<Int, Int>, String> =
    TILE_POS.entries.associate { (abbr, pos) -> pos to abbr }

fun tileColor(lean: String?, demShare: Double?): Color = when (lean) {
    CandidateId.DEM.serial -> {
        val t = (((demShare ?: 0.6) - 0.5) * 2).toFloat().coerceIn(0.15f, 1f)
        lerp(Color(0xFF1E3A6E), Mov.Dem, t)
    }
    CandidateId.REP.serial -> {
        val t = ((1 - (demShare ?: 0.4)) - 0.5).let { it * 2 }.toFloat().coerceIn(0.15f, 1f)
        lerp(Color(0xFF6E2626), Mov.Gop, t)
    }
    else -> Mov.Tossup
}

/** 12 x 8 tile cartogram of the states. Every tile is a named, tappable control. */
@Composable
fun TileMap(
    projection: Projection?,
    abbrToStateId: Map<String, String>,
    selectedAbbr: String?,
    onSelect: (stateId: String, abbr: String) -> Unit,
    modifier: Modifier = Modifier,
    describe: (stateId: String) -> String = { it },
) {
    val byStateId = projection?.contests?.associateBy { it.stateId } ?: emptyMap()
    Column(modifier = modifier.fillMaxWidth()) {
        for (r in 0 until ROWS) {
            Row(modifier = Modifier.fillMaxWidth()) {
                for (c in 0 until COLS) {
                    val abbr = byPos[c to r]
                    Box(modifier = Modifier.weight(1f).aspectRatio(1f).padding(1.dp)) {
                        if (abbr != null) {
                            val stateId = abbrToStateId[abbr]
                            val contest = stateId?.let { byStateId[it] }
                            val isSel = abbr == selectedAbbr
                            val fill = tileColor(contest?.lean, contest?.demShare)
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(fill)
                                    .then(if (isSel) Modifier.border(2.dp, Mov.Warning, RoundedCornerShape(3.dp)) else Modifier)
                                    .clickable(enabled = stateId != null, onClickLabel = "Select state") {
                                        if (stateId != null) onSelect(stateId, abbr)
                                    }
                                    .semantics { if (stateId != null) contentDescription = describe(stateId); selected = isSel },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = abbr,
                                    fontSize = 10.sp,
                                    color = textOn(fill),
                                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.sp,
                                        fontWeight = if (isSel) FontWeight.ExtraBold else FontWeight.SemiBold),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
