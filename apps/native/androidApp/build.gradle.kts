plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

fun String.asBuildConfigString(): String = "\"" + replace("\\", "\\\\").replace("\"", "\\\"") + "\""

val sentryDsn = providers.gradleProperty("MOV_SENTRY_DSN")
    .orElse(providers.environmentVariable("MOV_SENTRY_DSN"))
    .orElse("")

// Release signing comes only from the build environment (a CI secret or a
// local shell), never from the repo. All four values must be present for the
// release build to be signed; otherwise it stays unsigned (fine for local
// checks, rejected by Play). See docs/ANDROID-RELEASE.md.
fun buildValue(name: String): String? =
    providers.environmentVariable(name).orElse(providers.gradleProperty(name)).orNull?.takeIf { it.isNotBlank() }
val keystoreFile = buildValue("MOV_ANDROID_KEYSTORE_FILE")
val keystorePassword = buildValue("MOV_ANDROID_KEYSTORE_PASSWORD")
val signingAlias = buildValue("MOV_ANDROID_KEY_ALIAS")
val signingKeyPassword = buildValue("MOV_ANDROID_KEY_PASSWORD")
val signRelease = listOf(keystoreFile, keystorePassword, signingAlias, signingKeyPassword).all { it != null }
// Play needs a strictly higher versionCode on every upload. CI passes
// MOV_VERSION_CODE (2,000,000 plus the workflow run number).
val versionCodeOverride = buildValue("MOV_VERSION_CODE")?.toIntOrNull()

// Native Android UI backed by the shared KMP simulation.
android {
    namespace = "com.lakesidegames.electioneer"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.lakesidegames.electioneer"
        minSdk = libs.versions.minSdk.get().toInt()
        targetSdk = libs.versions.compileSdk.get().toInt()
        // Play needs a versionCode above every build it has seen. Nothing has been
        // uploaded yet; major * 1,000,000 + minor * 1,000 + patch keeps it rising
        // with the version and matches the code the Tauri Android shell derives.
        versionCode = versionCodeOverride ?: 2_000_000
        versionName = "2.0.0"
        // Empty until the store and crash reporting are configured.
        buildConfigField("String", "SENTRY_DSN", sentryDsn.get().asBuildConfigString())
    }

    signingConfigs {
        if (signRelease) create("release") {
            storeFile = file(keystoreFile!!)
            storePassword = keystorePassword
            keyAlias = signingAlias
            keyPassword = signingKeyPassword
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            if (signRelease) signingConfig = signingConfigs.getByName("release")
        }
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    testImplementation(kotlin("test-junit"))
    implementation(project(":shared"))
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.icons.core)
    implementation(libs.play.billing)
    // Crash reporting (#24): inert until SENTRY_DSN is set at build time.
    implementation(libs.sentry.android)
}
