package com.lakesidegames.electioneer

import android.app.Application
import com.lakesidegames.electioneer.BuildConfig
import io.sentry.android.core.SentryAndroid

// Crash reporting (#24): Sentry starts only when a DSN is baked in at build
// time (MOV_SENTRY_DSN, the same setting the web and desktop builds use).
// Environment and release match the other builds: "android" and
// version+commit. No personal data and no install id are attached.
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
                // The SDK fills user with a random install id by default. Reports
                // carry no user at all, so they cannot be tied to a device.
                options.setBeforeSend { event, _ -> event.apply { user = null } }
                // Errors only: no session pings on launch.
                options.isEnableAutoSessionTracking = false
            }
        }
    }
}
