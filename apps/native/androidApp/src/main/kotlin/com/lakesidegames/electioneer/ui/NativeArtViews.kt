package com.lakesidegames.electioneer.ui

import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.coerceIn
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lakesidegames.electioneer.content.ArtCredit
import com.lakesidegames.electioneer.content.NativeArt

// Leader photos and party logos ship in the shared module's resources
// (bundles/art). Each file is a few kilobytes; decoded images are kept in a
// small memory cache so lists do not decode the same logo twice.
private object ArtCache {
    private val images = object : LruCache<String, ImageBitmap>(8 * 1024 * 1024) {
        override fun sizeOf(key: String, value: ImageBitmap): Int = value.width * value.height * 4
    }
    private val missing = HashSet<String>()

    @Synchronized
    fun get(file: String): ImageBitmap? {
        images.get(file)?.let { return it }
        if (file in missing) return null
        val image = runCatching {
            ArtCache::class.java.classLoader?.getResourceAsStream("${NativeArt.DIRECTORY}/$file")
                ?.use { BitmapFactory.decodeStream(it) }?.asImageBitmap()
        }.getOrNull()
        if (image == null) missing += file else images.put(file, image)
        return image
    }
}

@Composable
private fun rememberArt(file: String?): ImageBitmap? = remember(file) { file?.let { ArtCache.get(it) } }

/**
 * A party's logo on a small white tile, so dark marks stay readable, sized to sit
 * beside its name. Without a logo it is the party's colour swatch. Decorative: the
 * party name next to it is the label.
 */
@Composable
fun PartyMark(color: String?, logo: String?, modifier: Modifier = Modifier, size: Dp = 12.dp) {
    val image = rememberArt(logo)
    if (image == null) {
        PartySwatch(partyFill(color), modifier, size)
        return
    }
    val height = size + 6.dp
    val width = (height * (image.width.toFloat() / image.height.coerceAtLeast(1))).coerceIn(height, height * 2.6f)
    Box(modifier.height(height).width(width).clip(MovRadius.xs).background(Color.White).padding(2.dp),
        contentAlignment = Alignment.Center) {
        Image(image, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
    }
}

/**
 * A leader's photo in a circle ringed in the party colour, or their initials when the
 * game has no freely licensed photo. Decorative: the name is always shown beside it.
 */
@Composable
fun LeaderPortrait(name: String?, color: String?, modifier: Modifier = Modifier, size: Dp = 40.dp, ring: Color? = null) {
    val image = rememberArt(NativeArt.portrait(name))
    Box(modifier.size(size).clip(CircleShape).background(Mov.Surface3).border(2.dp, ring ?: partyFill(color), CircleShape),
        contentAlignment = Alignment.Center) {
        if (image != null) {
            Image(image, contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
        } else {
            Text(initials(name), color = Mov.Text1, fontWeight = FontWeight.Bold, fontSize = (size.value * 0.36f).sp, maxLines = 1)
        }
    }
}

internal fun initials(name: String?): String {
    val words = name.orEmpty().split(' ').filter { it.isNotBlank() }
    return when {
        words.size >= 2 -> "${words.first().first()}${words.last().first()}"
        words.size == 1 -> words.first().take(2)
        else -> ""
    }.uppercase()
}

/**
 * Credits for the leader photos and party logos, the same lines as the web Credits page.
 * The lists are long, so they open on request. Each line opens its Commons file page.
 */
@Composable
fun NativeCreditsCard() {
    var open by remember { mutableStateOf(false) }
    MovCard(tight = true) {
        CardHead("Credits")
        Text("Leader photos and party logos come from Wikimedia Commons. Each line names the file, its author and its licence.",
            style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
        SecondaryButton(if (open) "Hide credits" else "Show credits", { open = !open }, Modifier.fillMaxWidth())
        if (open) {
            Eyebrow("Leader photos")
            Text("Photos of leaders and candidates are public domain or used under the Creative Commons licence named next to " +
                "them, and were cropped to a square and made smaller. Leaders with no freely licensed photo are shown with their initials.",
                style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            NativeArt.portraitCredits().forEach { CreditLine(it) }
            Eyebrow("Party logos")
            Text("Party logos are the property of their parties and are shown only to identify each party. They are listed with " +
                "the source, the author and the status or licence Commons gives each file, and were trimmed and made smaller. " +
                "Parties without a logo on Commons are shown by their colour.",
                style = MaterialTheme.typography.bodySmall, color = Mov.Text3)
            NativeArt.logoCredits().forEach { CreditLine(it) }
        }
    }
}

@Composable
private fun CreditLine(credit: ArtCredit) {
    val uri = LocalUriHandler.current
    Text("${credit.name}: ${credit.title}, ${credit.author}, ${credit.license}",
        Modifier.fillMaxWidth().clickable(onClickLabel = "Open the source of ${credit.name}") { uri.openUri(credit.source) }
            .padding(vertical = 2.dp),
        style = MaterialTheme.typography.bodySmall, color = Mov.Text2)
}
