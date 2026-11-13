package com.lakesidegames.electioneer

import android.app.Application
import com.lakesidegames.electioneer.BuildConfig
import io.sentry.android.core.SentryAndroid

// Crash reporting (#24): Sentry starts only when a DSN is baked in at build
// time (MOV_SENTRY_DSN, the same setting the web and desktop builds use).
// Environment and release match the other builds: "android" and
// version+commit. No personal data is attached.
class MovApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val dsn = BuildConfig.SENTRY_DSN
        if (dsn.isNotBlank()) {
            SentryAndroid.init(this) { options ->
                options.dsn = dsn
                options.environment = "android"
                options.release = "${BuildConfig.VERSION_NAME}+${BuildConfig.BUILD_COMMIT}"
                options.isSendDefaultPii = false
            }
        }
    }
}
