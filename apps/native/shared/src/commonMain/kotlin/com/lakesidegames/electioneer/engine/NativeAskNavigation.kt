package com.lakesidegames.electioneer.engine

/**
 * Which pages Ask's in-app browser keeps inside the app. Anything else opens in the
 * system browser. Shared so the iPhone and Android apps follow one list.
 */
object NativeAskNavigation {
    const val ASK_HOST = "ask.lakesidegames.net"

    private val hosts = setOf(
        ASK_HOST, "auth.lakesidegames.net", "auth.ahousedividedgame.com",
        "ahousedividedgame.com", "www.ahousedividedgame.com", "sandbox.ahousedividedgame.com",
        "accounts.lakesidegames.net", "discord.com", "www.google.com",
        // Continue with Apple on the Lakeside page: Apple's sign-in page and its frame.
        "appleid.apple.com", "idmsa.apple.com",
    )

    /** Lakeside sign-in and the account pages live under /account on the main site. */
    private const val SITE_HOST = "lakesidegames.net"

    private fun isAccountPath(path: String?): Boolean {
        val p = path?.lowercase() ?: return false
        return p == "/account" || p.startsWith("/account/")
    }

    fun allows(scheme: String?, host: String?, port: Int, path: String?): Boolean {
        if (scheme?.lowercase() != "https" || (port != -1 && port != 443)) return false
        val h = host?.lowercase() ?: return false
        return h in hosts || (h == SITE_HOST && isAccountPath(path))
    }

    /** A Lakeside or A House Divided sign-in page, used by the device checks. */
    fun isSignInPage(host: String?, path: String?): Boolean {
        val h = host?.lowercase() ?: return false
        val p = path?.lowercase() ?: ""
        return h == "auth.lakesidegames.net" || h == "auth.ahousedividedgame.com" ||
            ((h == "ahousedividedgame.com" || h == "www.ahousedividedgame.com") && p == "/login") ||
            (h == SITE_HOST && isAccountPath(p))
    }
}
