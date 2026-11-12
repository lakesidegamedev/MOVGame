import type { ReactNode } from "react";
import { PAYWALL_ENABLED, SCENARIO_REGISTRY, type ScenarioMeta } from "@content/scenarioRegistry";
import { packCovered, STORE_PACKS } from "@content/packs";
import { countryCover } from "@content/covers";
import { COUNTRY_MODULES } from "@content/countries";
import {
  COUNTRY_COUNT, ELECTION_COUNT, FREE_COUNTRY_COUNT, FREE_ELECTION_COUNT, VOTING_SYSTEM_COUNT,
  countryInSentence, electionCountFor, firstYearFor, joinList,
} from "@content/facts";
import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { usePackPrices } from "@lib/usePackPrices";
import { packFacts, COMPLETE_ID } from "@lib/storeModel";
import { DISTRIBUTION } from "@lib/distribution";
import { UserMenu } from "@ui/auth/UserMenu";
import { DailyCard } from "@ui/DailyCard";
import { ElectionLibrary, LibraryCard } from "@ui/library/ElectionLibrary";
import { EvBar } from "@ui/EvBar";
import { Sparkline } from "@ui/Sparkline";
import {
  Play, Trophy, Check, X, ShoppingBag,
  LineChart, Mic2, Globe2,
} from "lucide-react";
import { BRAND } from "../brand";
import { useGameStore } from "@store/gameStore";
import { listResumableCampaigns, type ResumeTarget } from "@persistence/resume";

// "the UK, Canada, ..., and Japan": every registered country after the US.
function otherCountriesList(): string {
  return joinList(COUNTRY_MODULES.filter((m) => m.code !== "US").map((m) => countryInSentence(m.code, m.name)));
}
const COUNTRY_FLAGS = COUNTRY_MODULES.map((m) => m.flag);
const VOTING_SYSTEMS_LINE = `${COUNTRY_COUNT} countries, ${VOTING_SYSTEM_COUNT} voting systems`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
// "13 full elections across 12 countries": every country has a free election.
const FREE_LINE = `${FREE_ELECTION_COUNT} full elections across ${FREE_COUNTRY_COUNT} countries`;
// The hero has just named the totals, so it says "15 of them, at least one in
// every country" rather than repeating "across 14 countries".
const HERO_FREE_LINE = FREE_COUNTRY_COUNT === COUNTRY_COUNT
  ? `${FREE_ELECTION_COUNT} of them, at least one in every country`
  : FREE_LINE;

export type LandingDestination =
  | { kind: "us"; scenarioId: string }   // native id, e.g. "2024"
  | { kind: "uk"; electionId?: string }
  | { kind: "country"; countryId: string; electionId?: string }
  | { kind: "leaderboard" }
  | { kind: "daily" }                    // App resolves via dailyAssignment()
  | { kind: "legal"; tab?: "privacy" | "terms" };

function CoverImg({ src, alt, tall }: { src?: string; alt: string; tall?: boolean }) {
  if (!src) return null;
  return (
    <img
      className={`scenario-cover${tall ? " tall" : ""}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

// Sample polling swing used only to illustrate the mechanic on the landing
// page. Not tied to any real scenario or player data.
const SAMPLE_POLL_TREND = [0.47, 0.49, 0.48, 0.51, 0.53, 0.52, 0.55];

// Mock projection shape (same type EvBar takes in-game) used purely as an
// illustration of the electoral tally bar. Numbers are made up.
const SAMPLE_PROJECTION = {
  ev: { dem: 236, rep: 235 },
  tossupEv: 67,
} as unknown as Parameters<typeof EvBar>[0]["projection"];

function FeatureBlock({
  icon, title, blurb, children,
}: { icon: ReactNode; title: string; blurb: string; children: ReactNode }) {
  return (
    <div className="feature-card">
      <div className="feature-illustration">{children}</div>
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p className="small">{blurb}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="landing-features">
      <div className="feature-grid">
        <FeatureBlock
          icon={<LineChart size={18} />}
          title="Polling that moves like the real thing"
          blurb="Every rally, ad buy, and news cycle nudges a state's polling average. Track the swing turn by turn instead of watching a single fixed number."
        >
          <Sparkline values={SAMPLE_POLL_TREND} color="var(--dem-bright)" />
        </FeatureBlock>
        <FeatureBlock
          icon={<Mic2 size={18} />}
          title="Debates and events change the race"
          blurb="Scripted debates, scandals, and endorsements land on the calendar and shift the electoral map. The tally bar updates live as tossup states break."
        >
          <EvBar projection={SAMPLE_PROJECTION} />
        </FeatureBlock>
        <FeatureBlock
          icon={<Globe2 size={18} />}
          title={VOTING_SYSTEMS_LINE}
          blurb="US electoral college duels, UK multiparty first-past-the-post with hung parliaments, French two-round runoffs, German proportional Bundestag seats, and more."
        >
          <div className="feature-flags">
            {COUNTRY_FLAGS.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </FeatureBlock>
      </div>
    </div>
  );
}

const BUY_QUESTION = "Where do I buy bundles?";

function faqItems(prices: Record<string, number>): { q: string; a: string }[] {
  return [
  {
    q: "What's actually free?",
    a: `${FREE_LINE}, so you can try every country before you buy it, plus a new daily challenge every day. No account and no payment required. Nothing is time limited or ad supported.`,
  },
  {
    q: "What do I get if I pay?",
    a: `Each country is a ${money(prices["us-historical"] ?? 99)} bundle with the rest of its elections: the US back to ${firstYearFor("US")}, ${otherCountriesList()}. The Complete Collection unlocks every country for ${money(prices.complete ?? 399)}. Both are one time purchases, not subscriptions.`,
  },
  {
    q: BUY_QUESTION,
    a: "Press Buy on any bundle or locked election. You sign in with your Lakeside account and pay through Stripe; the bundle unlocks on that account on every device. Have an activation code? Choose Redeem in the account menu.",
  },
  {
    q: "Can I play offline or without an account?",
    a: "Yes for the free scenarios and daily challenge: progress saves in your browser. An account is only needed to buy a bundle and to appear on leaderboards.",
  },
  {
    q: "What's your refund policy?",
    a: "Refunds for bundles follow the Lakeside store's standard policy. Contact Lakeside support through the store or reach us directly if a purchase didn't unlock correctly.",
  },
  {
    q: "What platforms does this run on?",
    a: "It's a browser game: desktop and mobile, any modern browser, nothing to install.",
  },
  ];
}

function FaqSection({ prices }: { prices: Record<string, number> }) {
  const items = faqItems(prices).map((item) => {
    if (DISTRIBUTION.externalStore) return item;
    if (item.q === "What do I get if I pay?") {
      return { q: item.q, a: `Scenario packs unlock more elections. They are one time purchases managed by ${DISTRIBUTION.nativeStoreName}, not subscriptions.` };
    }
    if (item.q === BUY_QUESTION) {
      return { q: item.q, a: `Purchases and purchase restoration will be handled by ${DISTRIBUTION.nativeStoreName} in this edition.` };
    }
    if (item.q === "What's your refund policy?") {
      return { q: item.q, a: `Purchases in this edition follow ${DISTRIBUTION.nativeStoreName} policies.` };
    }
    if (item.q === "What platforms does this run on?") {
      return { q: item.q, a: "Margin of Victory is available on the web and is being packaged for desktop and mobile." };
    }
    return item;
  });
  return (
    <div className="landing-section">
      <div className="section-head"><h2 className="section-title">Frequently asked</h2></div>
      <div className="faq-list">
        {items.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p className="faq-answer">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// Quiet one-line banner for post-redirect notices (Stripe result, Lakeside
// sign-in). Success gets the green edge; cancel stays neutral.
function NoticeBanner() {
  const notice = useAuthStore((s) => s.notice);
  const dismiss = useAuthStore((s) => s.dismissNotice);
  if (!notice) return null;
  const good = notice.kind === "lakeside-signed-in";
  const text =
    notice.kind === "lakeside-signed-in"
      ? `Signed in as ${notice.username} with your Lakeside Games account.`
      : notice.kind === "lakeside-link-needs-login"
        ? "A game account already uses that email. Log in with its password first, then link your Lakeside account from Your Account."
        : "That sign in link expired. Try again from the login screen.";
  return (
    <div className={`notice-banner${good ? " good" : ""}`} role="status">
      {good ? <Check size={14} /> : null}
      <span>{text}</span>
      <button className="notice-close" onClick={dismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

export function LandingPage({ onGo, onResume }: { onGo: (dest: LandingDestination) => void; onResume: (target: ResumeTarget) => void }) {
  const usSaves = useGameStore((s) => s.saves);
  const currentUsGame = useGameStore((s) => s.game);
  const resumable = listResumableCampaigns(usSaves);
  if (currentUsGame) {
    const autosaveIndex = resumable.findIndex((option) => option.target.kind === "us" && option.target.saveId === "autosave");
    if (autosaveIndex >= 0) resumable.splice(autosaveIndex, 1);
    resumable.unshift({ target: { kind: "us", saveId: "autosave" }, label: "US campaign", turn: currentUsGame.turn, updatedAt: Date.now() });
  }
  const canPlay = useAuthStore((s) => s.canPlay);
  const unlocked = useAuthStore((s) => s.unlocked);
  const openStore = useStoreNav((s) => s.openStore);
  const packPrices = usePackPrices();

  const free = SCENARIO_REGISTRY.filter((s) => s.free);

  const play = (s: ScenarioMeta) => {
    if (s.engine === "us") onGo({ kind: "us", scenarioId: s.nativeId });
    else if (s.engine === "uk") onGo({ kind: "uk", electionId: s.nativeId });
    else onGo({ kind: "country", countryId: s.country, electionId: s.nativeId });
  };

  const locked = (s: ScenarioMeta) => {
    openStore({ scenarioId: s.scenarioId });
  };

  return (
    <div className="landing">
      {/* Sticky topbar: game brand left, auth right */}
      <div className="landing-topbar">
        <div className="landing-topbar-inner">
          <span className="landing-brand">
            <span className="mark"><img src="brand/margin-of-victory-icon.png" alt="" width={24} height={24} /></span>{BRAND.name}
          </span>
          <span className="row" style={{ gap: 6 }}>
            <button className="ghost small" onClick={() => openStore()}>
              <ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Store
            </button>
            <button className="ghost small" onClick={() => onGo({ kind: "leaderboard" })}>
              <Trophy size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Leaderboard
            </button>
            <UserMenu />
          </span>
        </div>
      </div>

      <div className="landing-body">
        <NoticeBanner />
        <header className="landing-hero">
          <div className="landing-hero-copy">
            <div className="kicker">Turn-based election campaign sim · {BRAND.eyebrow}</div>
            <h1>{BRAND.name}</h1>
            <p className="sub">
              Run a real campaign turn by turn: allocate a budget, target battlegrounds, survive debates,
              and watch the map move. {ELECTION_COUNT} elections across {COUNTRY_COUNT} countries.
              {PAYWALL_ENABLED
                ? ` ${HERO_FREE_LINE}, and the daily challenge are free forever. The rest of each country is ${money(packPrices["us-historical"] ?? 99)}, or ${money(packPrices.complete ?? 399)} for everything.`
                : " All of them are free to play right now."}
            </p>
            <div className="landing-hero-actions">
              <button className="primary" onClick={() => play(free[0])}><Play size={15} /> Play free</button>
              {resumable[0] && (
                <button className="ghost" onClick={() => onResume(resumable[0].target)}>
                  Resume {resumable[0].label} · Week {resumable[0].turn + 1}
                </button>
              )}
              <button className="ghost" onClick={() => document.getElementById("election-library")?.scrollIntoView({ behavior: "smooth" })}>
                Browse {SCENARIO_REGISTRY.length} campaigns
              </button>
            </div>
            {resumable.length > 1 && (
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }} aria-label="Saved campaigns">
                {resumable.slice(1, 5).map((save) => (
                  <button key={JSON.stringify(save.target)} className="ghost small" onClick={() => onResume(save.target)}>
                    Load {save.label} · Week {save.turn + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="landing-proof" aria-label="Product highlights">
              <span>No account needed</span><span>20 to 40 minute campaigns</span><span>No subscription</span>
            </div>
          </div>
          <div className="landing-hero-art" aria-label="Campaigns from around the world">
            <div className="hero-art-card hero-art-main">
              <CoverImg src={countryCover("US")} alt="United States election campaigns" />
              <span><b>{electionCountFor("US")} US elections</b><small>Fight for 270</small></span>
            </div>
            <div className="hero-art-card hero-art-side hero-art-uk">
              <CoverImg src={countryCover("UK")} alt="United Kingdom election campaigns" />
              <span><b>United Kingdom</b><small>Win a working majority</small></span>
            </div>
            <div className="hero-art-card hero-art-side hero-art-world">
              <CoverImg src={countryCover("FR")} alt="French election campaigns" />
              <span><b>{COUNTRY_COUNT} countries</b><small>{VOTING_SYSTEM_COUNT} voting systems</small></span>
            </div>
          </div>
        </header>

        <FeaturesSection />

        {/* Daily Challenge: one seeded race, same for everyone, every day */}
        <div className="landing-section daily-section">
          <DailyCard onPlay={() => onGo({ kind: "daily" })} />
        </div>

        {/* Featured starters, text-led (portraits live in the setup wizard) */}
        <div className="landing-section" id="campaign-catalog">
          <div className="section-head">
            <h2 className="section-title">{PAYWALL_ENABLED ? "Play free, no account needed" : "Start here, no account needed"}</h2>
          </div>
          <div className="library-grid featured">
            {free.map((s) => (
              <LibraryCard key={s.scenarioId} s={s} unlocked showFree={PAYWALL_ENABLED} onPlay={() => play(s)} onLocked={() => {}} />
            ))}
          </div>
        </div>

        {/* Full library: search, filter and browse every election by country. */}
        <div className="landing-section" id="election-library">
          <div className="section-head">
            <h2 className="section-title">Election library</h2>
            <span className="section-note">Every election, grouped by country</span>
          </div>
          <ElectionLibrary
            rows={SCENARIO_REGISTRY}
            canPlay={canPlay}
            showAccess={PAYWALL_ENABLED}
            onPlay={play}
            onLocked={locked}
          />
        </div>

        {/* Pricing: honest free vs paid, no fake tiers */}
        <div className="field" style={{ textAlign: "left", margin: "44px 0 0" }}>
          <label>Pricing</label>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Free</h3>
              <p className="pricing-price">$0</p>
              <ul className="pricing-list">
                <li><Check size={13} /> {PAYWALL_ENABLED ? FREE_LINE : `All ${ELECTION_COUNT} scenarios`}, no account needed</li>
                <li><Check size={13} /> A new daily challenge every day</li>
                <li><Check size={13} /> Leaderboards with a free account</li>
              </ul>
              <p className="muted small" style={{ marginTop: 8 }}>No ads, no time limit, no trial.</p>
            </div>
            <div className="pricing-card">
              <h3>Country bundles</h3>
              <p className="pricing-price">{PAYWALL_ENABLED ? `${money(packPrices["us-historical"] ?? 99)} per country` : "Free for now"}</p>
              <ul className="pricing-list">
                <li><Check size={13} /> {SCENARIO_REGISTRY.length - free.length} additional elections across {STORE_PACKS.length - 1} country bundles</li>
                <li><Check size={13} /> Complete Collection: every country for {money(packPrices.complete ?? 399)}</li>
                {PAYWALL_ENABLED ? (
                  <>
                    <li><Check size={13} /> One time purchase, yours to keep, no subscription</li>
                    <li><Check size={13} /> {DISTRIBUTION.externalStore ? "Bought and delivered through the Lakeside store" : `Purchased and restored through ${DISTRIBUTION.nativeStoreName}`}</li>
                  </>
                ) : (
                  <li><Check size={13} /> Play every election free while paid tiers are being prepared</li>
                )}
              </ul>
              {PAYWALL_ENABLED && !DISTRIBUTION.externalStore && (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Purchases and restoration will be handled by {DISTRIBUTION.nativeStoreName}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Packs strip: text-led, no cover art */}
        <div className="field" id="country-bundles" style={{ textAlign: "left", margin: "36px 0 0" }}>
          <label>{PAYWALL_ENABLED ? "Country bundles" : "Scenario packs: free for now, every scenario is playable while we finish the paid tiers"}</label>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
            {STORE_PACKS.map((p) => {
              const owned = packCovered(p.id, unlocked.packIds);
              return (
                <div key={p.id} className={`scenario-card pack-card${owned ? " sel" : ""}`}
                  style={{ textAlign: "left", alignItems: "flex-start" }}>
                  <span className="scenario-year" style={{ fontSize: 14 }}>
                    {p.name} {owned && <Check size={13} style={{ verticalAlign: "-2px", color: "var(--green)" }} />}
                  </span>
                  <span className="scenario-match">{p.id === COMPLETE_ID ? `${ELECTION_COUNT} elections, every country` : packFacts(p).countLabel}</span>
                  <span className="muted small pack-desc" title={p.description}>{p.description}</span>
                  <span className="pack-foot">
                    <span className="pack-price">
                      {PAYWALL_ENABLED ? (
                        <>${((packPrices[p.id] ?? p.price) / 100).toFixed(2)}</>
                      ) : (
                        <>
                          <s style={{ opacity: 0.5, fontWeight: 500 }}>${((packPrices[p.id] ?? p.price) / 100).toFixed(2)}</s>
                          <span style={{ color: "var(--green)", fontWeight: 800, marginLeft: 6 }}>Free</span>
                        </>
                      )}
                    </span>
                    {owned ? (
                      <span className="muted small">Owned</span>
                    ) : PAYWALL_ENABLED && DISTRIBUTION.externalStore ? (
                      <button className="primary small" onClick={() => openStore({ packId: p.id })}>
                        View
                      </button>
                    ) : PAYWALL_ENABLED ? (
                      <span className="pack-beta-note">Available through {DISTRIBUTION.nativeStoreName}</span>
                    ) : (
                      <span className="pack-beta-note">Free for now</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <FaqSection prices={packPrices} />

        {/* Footer: legal + studio credit + contact + attribution */}
        <div className="landing-foot">
          <button className="ghost small" onClick={() => onGo({ kind: "legal", tab: "privacy" })}>Privacy</button>
          <button className="ghost small" onClick={() => onGo({ kind: "legal", tab: "terms" })}>Terms</button>
          <a className="ghost small" href={`mailto:${BRAND.supportEmail}`}>Contact</a>
          <a className="ghost small" href="https://ask.lakesidegames.net/?game=electioneer" target="_blank" rel="noopener noreferrer">Ask about the game</a>
          <button className="ghost small" onClick={() => openStore()}>Store</button>
          <span className="muted small" title="Coming soon">Discord (coming soon)</span>
          <a className="lakeside-credit" href="https://lakesidegames.net" target="_blank" rel="noopener">
            <img src="lakeside-mark.svg" alt="Lakeside Games logo" width={20} height={20} />
            by Lakeside Games
          </a>
          <span>Country photos: Wikimedia Commons / public domain</span>
        </div>
      </div>
    </div>
  );
}
