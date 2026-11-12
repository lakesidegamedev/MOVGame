package com.lakesidegames.electioneer.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.lakesidegames.electioneer.engine.NativeTrendChart

@Composable
fun AnalysisScreen(session: GameSession, timeline: Boolean = false) {
    var region by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(if (timeline) setOf("standings", "week-actions", "report") else setOf("polls")) }
    val document = (if (timeline) session.replayDocument(region) else session.analysis(region)) ?: return
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(MovSpace.gutter), verticalArrangement = Arrangement.spacedBy(MovSpace.s3)) {
        GhostButton("Back to campaign", session::resumeGame, color = Mov.Text2)
        ScreenHeader(if (timeline) "Campaign replay and report" else "Campaign analysis", session.savedCampaignLabel() ?: "Your campaign")
        document.charts.forEach { chart -> TrendChart(chart) }
        ChoicePicker(if (timeline) "Campaign week" else "State or region", document.selectedRegion, document.regions.map { it.id to it.name }) { region = it }
        document.sections.forEach { section ->
            val open = section.id in expanded
            MovCard(tight = true) {
                CardHead(section.title) { GhostButton(if (open) "Hide" else "Show", { expanded = if (open) expanded - section.id else expanded + section.id }) }
                if (open) section.rows.forEach { row ->
                    Column {
                        Text(row.label, style = MaterialTheme.typography.titleSmall, color = Mov.Text1)
                        Text(row.value, style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
                    }
                }
            }
        }
    }
}

@Composable
private fun TrendChart(chart: NativeTrendChart) {
    MovCard(tight = true) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            CardHead(chart.title)
            Text("${chart.minimum.toInt()} to ${chart.maximum.toInt()} · ${chart.referenceLabel}", style = MaterialTheme.typography.bodySmall.num, color = Mov.Text3)
            val maxTurn = chart.series.flatMap { it.points }.maxOfOrNull { it.turn }?.coerceAtLeast(1) ?: 1
            Canvas(Modifier.fillMaxWidth().height(160.dp).semantics {
                contentDescription = chart.title + ". " + chart.series.joinToString(". ") { series ->
                    series.label + ": " + series.points.joinToString { "Week ${it.turn}: ${it.value}" }
                }
            }) {
                fun position(turn: Int, value: Double) = Offset(
                    6f + (size.width - 12f) * turn / maxTurn,
                    6f + (size.height - 12f) * (1 - (value - chart.minimum) / (chart.maximum - chart.minimum)).toFloat())
                for (fraction in listOf(0.0, 0.25, 0.5, 0.75, 1.0)) {
                    val y = 6f + (size.height - 12f) * fraction.toFloat()
                    drawLine(Mov.Border, Offset(6f, y), Offset(size.width - 6f, y))
                }
                val reference = position(0, chart.reference).y
                drawLine(Mov.Text4, Offset(6f, reference), Offset(size.width - 6f, reference), strokeWidth = 1.5.dp.toPx())
                chart.series.forEach { series ->
                    val color = partyFill(series.color)
                    val path = Path()
                    series.points.forEachIndexed { index, point ->
                        val at = position(point.turn, point.value)
                        if (index == 0) path.moveTo(at.x, at.y) else path.lineTo(at.x, at.y)
                        drawCircle(color, radius = 3.dp.toPx(), center = at)
                    }
                    drawPath(path, color, style = Stroke(width = 2.dp.toPx()))
                }
            }
            ChipRow { chart.series.forEach { series ->
                Row(Modifier.padding(end = MovSpace.s3), verticalAlignment = Alignment.CenterVertically) {
                    PartySwatch(partyFill(series.color), size = 10.dp)
                    Text(" ${series.label}", color = partyInk(series.color), style = MaterialTheme.typography.labelMedium)
                }
            } }
            Text("Start to week $maxTurn", style = MaterialTheme.typography.bodySmall, color = Mov.Text4)
        }
    }
}
