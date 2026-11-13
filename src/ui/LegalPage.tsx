import { useEffect, useState } from "react";
import { BRAND } from "../brand";
import { ChevronLeft } from "lucide-react";
import type { LegalTab } from "./view";
import { PARTY_LOGOS } from "@content/partyLogos";

// Privacy policy and terms for the game. Plain language, and it only claims
// what the code does: check server/, src/lib/errorReporting.ts, src/main.tsx
// and apps/native before changing a line.

const PRIVACY_UPDATED = "November 13, 2026";
const TERMS_UPDATED = "July 8, 2026";

const LAKESIDE_PRIVACY = "https://lakesidegames.net/privacy/";
const ASK_PRIVACY = "https://ask.lakesidegames.net/privacy";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

function Privacy() {
  return (
    <>
      <h3>Privacy Policy</h3>
      <p className="muted small">Last updated {PRIVACY_UPDATED}</p>

      <h4>The short version</h4>
      <p>
        You can play {BRAND.name} without an account, and then your campaigns stay on your device. If you
        create an account or sign in, we keep what the game needs to run your account, cloud saves,
        leaderboards and purchases. {BRAND.name} does not use analytics or advertising trackers, shows no
        ads, and never sells your data. Error reporting is currently switched off; when we turn it on,
        error reports will contain no personal data.
      </p>
      <p>
        This policy covers {BRAND.name} on the web, on desktop, and in the iPhone, iPad and Android apps.
        It is run by Lakeside Games. The <Ext href={LAKESIDE_PRIVACY}>Lakeside privacy policy</Ext> covers
        your Lakeside account and applies alongside this one.
      </p>

      <h4>Playing without an account</h4>
      <p>
        Your campaigns, settings and achievements are saved on your device only (browser storage on the web
        and desktop, app storage on phones). Nothing about your games is sent to us. The only things that
        can leave your device are error reports, once switched on (see below), and anything you choose to
        send to Ask.
      </p>

      <h4>Your game account</h4>
      <p>To post scores, use cloud saves or buy packs, you need a game account. There are two ways in.</p>
      <ul>
        <li><strong>Sign up with email.</strong> We store your username, your email address, and your
          password as a one-way hash that we cannot read. We use your email only to identify your account
          when you sign in. We do not send you marketing email.</li>
        <li><strong>Sign in with your Lakeside account.</strong> You sign in on Lakeside&apos;s sign-in page
          with an A House Divided, Discord or Apple login (Google works on the web; Google does not allow
          its sign-in inside apps). We never see the password for any of these. Lakeside sends us your
          Lakeside account ID, a username, and your email address if the account has one. A sign-in from
          the Lakeside launcher may come without an email address; then we store no email for you.</li>
      </ul>
      <p>
        The sign-in pages belong to Lakeside and A House Divided, not to this game. Those sites have their
        own privacy policies, cookie choices and analytics, which apply while you are on them.
      </p>

      <h4>Cloud saves</h4>
      <p>
        If you are signed in and save to the cloud, we store each saved campaign: its name, the week it
        reached, the candidate or party you played, the full game state, and its replay if you keep one.
        You can delete cloud saves one at a time in Saved campaigns.
      </p>

      <h4>Leaderboards, daily challenge and achievements</h4>
      <p>
        When you finish a campaign or the daily challenge while signed in, the game posts your result: the
        election, your score, your winning margins, the weeks played, the difficulty and the date. These
        appear publicly on the leaderboards next to your username. Achievements you earn are stored with
        your account so they follow you between devices. Choose a username you are happy for other players
        to see.
      </p>

      <h4>Purchases</h4>
      <ul>
        <li><strong>On the web and desktop</strong>, packs are bought through your Lakeside account and
          paid with Stripe. Stripe handles your card details; neither Lakeside nor this game sees or stores
          your card number. Your Lakeside account keeps a record of what you bought, when, and the amount,
          so the game can unlock it on every device.</li>
        <li><strong>In the iPhone and Android apps</strong>, Apple or Google handles the payment under its
          own terms. To unlock the pack on all your devices, the app sends the store&apos;s proof of purchase
          (Apple&apos;s signed transaction or Google&apos;s purchase token) to Lakeside, which checks it with
          Apple or Google and records it on your Lakeside account. You need to be signed in with your
          Lakeside account to buy in the apps. On iPhone, a random code that links the purchase to your
          Lakeside account is attached to the Apple purchase.</li>
        <li><strong>Activation codes</strong> you redeem are recorded against your account.</li>
      </ul>

      <h4>Ask</h4>
      <p>
        Ask is Lakeside&apos;s question assistant, opened from the game. When you open it, the game puts a
        short summary of your current campaign into the link: the election, the week, your party, funds,
        momentum, seats by region and the moves you have planned. Nothing that identifies you is in that
        summary. Ask runs on ask.lakesidegames.net: the questions you type there, with that summary, are
        sent to the AI providers Ask uses, and Ask keeps your conversations until you delete them.
        The <Ext href={ASK_PRIVACY}>Ask privacy page</Ext> explains this in full and applies while you use it.
      </p>

      <h4>Error reports</h4>
      <p>
        Error reporting is currently switched off. When we turn it on, the game on the web, on desktop and
        on Android will send a report to Sentry, our error tracking service, when something goes wrong. A
        report contains the error and where in the code it happened, the game version, which build it was
        (web, desktop or app), and basic technical details such as browser or device model and operating
        system version. Reports are set up to carry no personal data: no account, username, email or saves.
        They are used only to find and fix bugs.
      </p>
      <p>
        The iPhone and iPad app sends no error reports of its own. If you have chosen in your iPhone
        settings to share analytics with app developers, Apple may pass us its own crash reports, which
        Apple makes anonymous.
      </p>

      <h4>Analytics and advertising</h4>
      <p>
        {BRAND.name} does not use analytics or advertising trackers, on any platform. There are no ads, no
        ad identifiers, and no tracking across other apps or websites.
      </p>

      <h4>What is stored on your device</h4>
      <p>
        The game stores your saves, settings, achievements and, when you sign in, a sign-in token on your
        device so you stay signed in. The game sets no cookies of its own.
      </p>

      <h4>Who we share data with</h4>
      <p>
        We do not sell or trade your data. It goes only to the services that run parts of the game:
        Lakeside (your Lakeside account and purchase records), Stripe (web payments), Apple and Google (app
        store payments), Sentry (error reports, once switched on) and, if you use Ask, the AI providers
        listed on the Ask privacy page. Each handles it under its own policy. We may disclose data if the
        law requires it.
      </p>

      <h4>Where your data is stored</h4>
      <p>
        Game accounts, cloud saves, scores and achievements are stored on our server in Germany, in the
        European Union. Your Lakeside account and purchase records are held by Lakeside&apos;s account
        service in the United States. Data is always sent over encrypted connections.
      </p>

      <h4>How long we keep it</h4>
      <ul>
        <li>Your game account, cloud saves, scores and achievements: as long as your account exists.</li>
        <li>When you delete your account, it is removed from our live database straight away. Copies we make
          before server maintenance are deleted within 30 days.</li>
        <li>Purchase records on your Lakeside account are kept as
          the <Ext href={LAKESIDE_PRIVACY}>Lakeside privacy policy</Ext> describes, because they are needed
          for refunds, restoring purchases and accounting.</li>
      </ul>

      <h4>Deleting your account</h4>
      <ul>
        <li><strong>On the web and desktop:</strong> select your username at the top of the page, then Your
          account, then Delete account. Type your username to confirm.</li>
        <li><strong>In the iPhone, iPad and Android apps:</strong> Account, then Delete account, then
          confirm.</li>
      </ul>
      <p>
        Deleting your game account removes your username, email, password hash, cloud saves, leaderboard and
        daily scores, achievements and code activations, and signs you out. Purchases stay with your Lakeside
        account, so if you sign in again with that Lakeside account your packs are still yours. To delete
        your Lakeside account itself, follow the <Ext href={LAKESIDE_PRIVACY}>Lakeside privacy policy</Ext>.
      </p>

      <h4>Your rights</h4>
      <p>
        You can ask us for a copy of the data tied to your account, ask us to correct it, or ask us to
        delete it. Email us and we will answer within 30 days. If you are in the European Union or the
        United Kingdom, you can also complain to your data protection authority.
      </p>

      <h4>Children</h4>
      <p>
        {BRAND.name} is not directed at children under 13, and we do not knowingly collect data from them.
        If you believe a child under 13 has created an account, email us and we will delete it.
      </p>

      <h4>Changes</h4>
      <p>
        When we change this policy, we update the date at the top. If a change affects what we collect, we
        say so on this page before it takes effect.
      </p>

      <h4>Contact</h4>
      <p className="muted">Questions or data requests: <strong>{BRAND.supportEmail}</strong></p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h3>Terms of Service</h3>
      <p className="muted small">Last updated {TERMS_UPDATED}</p>

      <h4>The deal</h4>
      <p>
        {BRAND.name} is a game of historical fiction. Play it, enjoy it, share your results. Scenario
        packs, when sold, are a personal, non-transferable license to play that content on your accounts,
        not ownership of the content itself.
      </p>

      <h4>Fair play</h4>
      <p>
        Leaderboards are shared space. Submitting forged scores, exploiting bugs for ranks, automating
        play, or abusing other players gets your entries removed and can get your account closed.
        Found a bug or exploit? Tell us. We're grateful, not litigious.
      </p>

      <h4>Your account</h4>
      <p>
        You're responsible for keeping your password safe. We can suspend accounts that break these
        terms. You can delete your account at any time (see the privacy policy).
      </p>

      <h4>The content</h4>
      <p>
        Scenarios depict real elections, public figures, and historical events for the purposes of
        simulation, commentary, and education. Candidate ratings and event outcomes are editorial game
        design, not statements of fact. All trademarks belong to their owners.
      </p>

      <h4>No warranty</h4>
      <p>
        The game is provided as-is. We work hard to keep it up and your data safe, but we can't promise
        uninterrupted service, and our total liability is limited to what you paid us in the last
        12 months.
      </p>

      <h4>Changes</h4>
      <p>
        We may update these terms as the game grows; material changes will be noted on this page with a
        new date above.
      </p>
    </>
  );
}

interface PhotoCredit {
  name: string;
  source: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
}

interface LogoCredit {
  party: string;
  file: string;
  source: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
}

// A logo removed from PARTY_LOGOS drops out of the credits too.
const SHOWN_LOGOS = new Set(PARTY_LOGOS.map((r) => r.file));

interface CoverCredit {
  file: string;
  commons: string;
  license: string;
  artist: string;
}

// Photo credits load only when this tab opens: the lists are long and most
// players never look.
function useJson<T>(path: string): T | null | "error" {
  const [data, setData] = useState<T | null | "error">(null);
  useEffect(() => {
    let live = true;
    fetch(path)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: T) => { if (live) setData(json); })
      .catch(() => { if (live) setData("error"); });
    return () => { live = false; };
  }, [path]);
  return data;
}

function License({ name, url }: { name: string; url?: string }) {
  return url ? <Ext href={url}>{name}</Ext> : <>{name}</>;
}

function Credits() {
  const portraits = useJson<PhotoCredit[]>("images/portraits/credits.json");
  const covers = useJson<CoverCredit[]>("images/covers/ATTRIBUTION.json");
  const logos = useJson<LogoCredit[]>("images/logos/credits.json");
  return (
    <>
      <h3>Credits</h3>

      <h4>Leader photos</h4>
      <p>
        Photos of leaders and candidates come from Wikimedia Commons. Each is public domain or used under
        the Creative Commons licence named next to it, and was cropped to a square and made smaller.
        Leaders with no freely licensed photo are shown with their initials.
      </p>
      {portraits === null && <p className="muted small">Loading credits</p>}
      {portraits === "error" && <p className="muted small">The photo credits could not be loaded. Try again later.</p>}
      {Array.isArray(portraits) && (
        <ul className="credits-list">
          {portraits.map((c) => (
            <li key={c.name}>
              <strong>{c.name}</strong>: <Ext href={c.source}>{c.title}</Ext>, {c.attribution ?? c.author},{" "}
              <License name={c.license} url={c.licenseUrl} />
            </li>
          ))}
        </ul>
      )}

      <h4>Party logos</h4>
      <p>
        Party logos are the property of their parties and are shown only to identify each party. They come
        from Wikimedia Commons, listed here with the source, the author and the status or licence Commons
        gives each file, and were trimmed and made smaller. Parties without a logo on Commons are shown by
        their colour.
      </p>
      {logos === null && <p className="muted small">Loading credits</p>}
      {logos === "error" && <p className="muted small">The logo credits could not be loaded. Try again later.</p>}
      {Array.isArray(logos) && (
        <ul className="credits-list">
          {logos.filter((c) => SHOWN_LOGOS.has(c.file)).map((c) => (
            <li key={c.file}>
              <strong>{c.party}</strong>: <Ext href={c.source}>{c.title}</Ext>, {c.attribution ?? c.author},{" "}
              <License name={c.license} url={c.licenseUrl} />
            </li>
          ))}
        </ul>
      )}

      <h4>Country and election photos</h4>
      {Array.isArray(covers) ? (
        <ul className="credits-list">
          {covers.map((c) => (
            <li key={c.file}>
              <Ext href={`https://commons.wikimedia.org/wiki/${encodeURIComponent(c.commons.replace(/ /g, "_"))}`}>{c.commons.replace(/^File:/, "")}</Ext>
              , {c.artist.trim()}, {c.license}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{covers === "error" ? "The photo credits could not be loaded. Try again later." : "Loading credits"}</p>
      )}

      <h4>Fonts</h4>
      <ul className="credits-list">
        <li>
          Flags: Twemoji, copyright Twitter, Inc and other contributors,{" "}
          <Ext href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Ext>. Cropped and converted to a
          font with only the game's flags.
        </li>
        <li>
          Fira Sans, copyright The Mozilla Foundation and Telefonica S.A.,{" "}
          <Ext href="https://openfontlicense.org/">SIL Open Font License 1.1</Ext>.
        </li>
      </ul>
    </>
  );
}

export function LegalPage({ initialTab, onBack }: { initialTab?: LegalTab; onBack: () => void }) {
  const [tab, setTab] = useState<LegalTab>(initialTab ?? "privacy");
  return (
    <div className="center" style={{ alignItems: "flex-start", paddingTop: 18 }}>
      <div className="setup" style={{ maxWidth: 760, textAlign: "left" }}>
        <div className="row" style={{ justifyContent: "space-between", width: "100%", marginBottom: 10 }}>
          <button className="ghost small" onClick={onBack}>
            <ChevronLeft size={13} style={{ verticalAlign: "-2px" }} /> Back to {BRAND.name}
          </button>
          <div className="row" style={{ gap: 4 }}>
            <button className={`ghost small${tab === "privacy" ? " active" : ""}`} onClick={() => setTab("privacy")}>Privacy</button>
            <button className={`ghost small${tab === "terms" ? " active" : ""}`} onClick={() => setTab("terms")}>Terms</button>
            <button className={`ghost small${tab === "credits" ? " active" : ""}`} onClick={() => setTab("credits")}>Credits</button>
          </div>
        </div>
        <div className="card" style={{ lineHeight: 1.55 }}>
          {tab === "privacy" ? <Privacy /> : tab === "terms" ? <Terms /> : <Credits />}
        </div>
      </div>
    </div>
  );
}
