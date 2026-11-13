package com.lakesidegames.electioneer.engine

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class NativeAskNavigationTest {
    private fun allows(host: String?, path: String? = "/", scheme: String? = "https", port: Int = -1) =
        NativeAskNavigation.allows(scheme, host, port, path)

    @Test fun askAndTheOldSignInHostsStayInsideTheApp() {
        listOf("ask.lakesidegames.net", "auth.lakesidegames.net", "auth.ahousedividedgame.com",
            "ahousedividedgame.com", "accounts.lakesidegames.net", "discord.com", "appleid.apple.com")
            .forEach { assertTrue(allows(it), it) }
        assertTrue(allows("ASK.lakesidegames.net"))
        assertTrue(allows("ask.lakesidegames.net", port = 443))
    }

    @Test fun lakesideAccountPagesOnTheMainSiteStayInsideTheApp() {
        assertTrue(allows("lakesidegames.net", "/account"))
        assertTrue(allows("lakesidegames.net", "/account/auth/start"))
        assertTrue(allows("lakesidegames.net", "/account/auth/callback"))
        assertFalse(allows("lakesidegames.net", "/"), "The rest of the site opens in the browser")
        assertFalse(allows("lakesidegames.net", "/store/"))
        assertFalse(allows("lakesidegames.net", "/accounts"))
        assertFalse(allows("lakesidegames.net", null))
        assertFalse(allows("www.lakesidegames.net", "/account"))
    }

    @Test fun anythingElseOpensOutside() {
        assertFalse(allows("ask.lakesidegames.net", scheme = "http"))
        assertFalse(allows("lakesidegames.net", "/account", scheme = "http"))
        assertFalse(allows("ask.lakesidegames.net", port = 444))
        assertFalse(allows("lakesidegames.net.attacker.test", "/account"))
        assertFalse(allows("ask.lakesidegames.net.attacker.test"))
        assertFalse(allows("accounts.google.com"))
        assertFalse(allows(null))
    }

    @Test fun signInPagesAreRecognised() {
        assertTrue(NativeAskNavigation.isSignInPage("auth.lakesidegames.net", "/realms/accounts/protocol/openid-connect/auth"))
        assertTrue(NativeAskNavigation.isSignInPage("auth.ahousedividedgame.com", "/auth/ahd"))
        assertTrue(NativeAskNavigation.isSignInPage("ahousedividedgame.com", "/login"))
        assertTrue(NativeAskNavigation.isSignInPage("lakesidegames.net", "/account"))
        assertFalse(NativeAskNavigation.isSignInPage("ahousedividedgame.com", "/"))
        assertFalse(NativeAskNavigation.isSignInPage("ask.lakesidegames.net", "/"))
        assertFalse(NativeAskNavigation.isSignInPage("lakesidegames.net", "/store/"))
    }
}
