import { useMemo, useState } from "react";
import { DISTRIBUTION, PREVIEW_SCORE_NOTE } from "@lib/distribution";
import { InertLand, InsetFrames } from "@ui/mapExtras";
import { partyFill, partyInk } from "@ui/colors";
import { useCountryStore } from "@store/countryStore";
import { useAuthStore } from "@store/authStore";
import { openStoreForScenario } from "@store/storeNav";
import { api } from "@lib/api";
import { computeScoreFromFacts, multipartyScoreFacts, multipartyUnitMargin } from "@engine/scoring";
import { countryGovernmentText, majorityFor, playablePartiesIn, regionalReach } from "@engine/countryGame";
import type { Government } from "@engine/types";
import { countryNextScenario } from "@content/nextScenario";
import { partyColor, partyName, partyShort, sortBySeats } from "./helpers";
import { Trophy, Lock } from "lucide-react";
import { ElectionNight, hasSeenReveal, revealSupported } from "../electionNight/ElectionNight";
import { namedLeaders } from "@ui/Avatar";
import { ElectionNightShell, freeChoice } from "../electionNight/ElectionNightShell";
import { MultipartySeatPanel } from "../electionNight/MultipartySeatPanel";
import { countryReveal } from "../electionNight/countryReveal";
import { DailyResultPanel } from "../DailyResultPanel";
import { WhyReport } from "../WhyReport";
import { TimelineView } from "../TimelineView";
import { dailyAssignment, utcDateString } from "@lib/daily";
import { PartyLogo } from "@ui/PartyLogo";
import { partyLogoFor, partyLogosFor } from "@ui/PartyLogo";

function defaultGovText(g: Government, name: (p: string) => string, plurality = false, unit = "seats"): string {
  switch (g.kind) {
    case "majority": return plurality ? `${name(g.party)} finishes first with ${g.seats} ${unit}.` : `${name(g.party)} wins a majority with ${g.seats} seats.`;
    case "minority": return `${name(g.party)} forms a minority government on ${g.seats} seats.`;
    case "coalition": return `A ${g.parties.map(name).join("-")} coalition reaches ${g.seats} seats.`;
    case "confidence_supply": return `${name(g.lead)} governs with ${name(g.partner)} confidence-and-supply (${g.seats}).`;
    case "hung": return `No workable majority. ${name(g.largest)} is the largest party.`;
  }
}

export function CountryResults({ onExit }: { onExit: () => void }) {
  const country = useCountryStore((s) => s.country)!;
  const game = useCountryStore((s) => s.game)!;
  const reset = useCountryStore((s) => s.reset);
  const newGame = useCountryStore((s) => s.newGame);
  const replay = useCountryStore((s) => s.replay);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const serverDown = useAuthStore((s) => s.serverDown);
  const openModal = useAuthStore((s) => s.openModal);
  const canPlay = useAuthStore((s) => s.canPlay);
  const r = game.result!;

  const scenarioId = `${country.id.toLowerCase()}-${game.electionId}`;
  const majority = majorityFor(game, country);
  const plurality = majority.plurality === true;
  const difficulty = game.difficulty ?? "normal";

  const facts = useMemo(
    () => multipartyScoreFacts(r, game.playerParty, majority.threshold, majority.total, difficulty, plurality),
    [r, game.playerParty, majority, difficulty, plurality],
  );
  const score = computeScoreFromFacts(facts);

  const [postState, setPostState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [postNote, setPostNote] = useState("");

  const postScore = async () => {
    setPostState("busy");
    try {
      const out = await api.postScore({
        scenarioId,
        difficulty,
        score,
        facts,
        seats: r.seats,
        voteShare: r.voteShare,
        playerSide: game.playerParty,
        evMargin: Math.round(facts.unitMargin),
        popularVoteMargin: facts.popularMargin,
        turnsPlayed: game.turn,
      });
      setPostState("done");
      setPostNote(out.posted ? `Posted. Rank #${out.rank}.` : `Kept your personal best (${out.personalBest}). Rank #${out.rank}.`);
    } catch (e) {
      setPostState("error");
      setPostNote(e instanceof Error ? e.message : "Could not reach the server");
    }
  };

  const order = sortBySeats(country, r.seats);
  const playerSeats = r.seats[game.playerParty] ?? 0;
  const won = r.government.kind === "majority" && r.government.party === game.playerParty;
  const inGov = ("party" in r.government && r.government.party === game.playerParty) ||
    ("lead" in r.government && r.government.lead === game.playerParty) ||
    (r.government.kind === "coalition" && r.government.parties.includes(game.playerParty));

  const name = (p: string) => partyName(country, p);
  const govText = countryGovernmentText(country, r.government, name) ??
    defaultGovText(r.government, name, plurality, country.unitNamePlural);

  const reveal = useMemo(() => countryReveal(country, game), [country, game]);
  const leaders = useMemo(() => namedLeaders(game.leaders), [game.leaders]);
  const year = country.elections[game.electionId]?.year;
  const logos = partyLogosFor(country.id, reveal.parties.map((p) => p.id), year);
  const [nightDone, setNightDone] = useState(() => !revealSupported() || hasSeenReveal(reveal.storageKey ?? ""));
  if (!nightDone) {
    return <ElectionNight {...reveal} leaders={leaders} logos={logos} onDone={() => setNightDone(true)} />;
  }

  const next = countryNextScenario(country.id, game.electionId);
  const nextData = next ? country.elections[next.id] : null;
  const packId = next ? `${country.id.toLowerCase()}-${next.id}` : "";
  const unlocked = next ? canPlay(packId) : false;
  const playableNext = next ? playablePartiesIn(country, next.id) : [];
  const nextParty = playableNext.includes(game.playerParty) ? game.playerParty : playableNext[0];

  // A regional party cannot win; it is measured against its real result.
  const regional = regionalReach(country, game.electionId, game.playerParty);
  const largest = order[0];
  // Plurality: the margin is the lead over the strongest rival, not a line.
  const seatMargin = multipartyUnitMargin(r.seats, game.playerParty, majority.threshold, plurality);
  const popShare = (r.voteShare[game.playerParty] ?? 0) * 100;
  const leftParty = largest ?? game.playerParty;
  const rightParty = order.find((p) => p !== leftParty) ?? game.playerParty;

  const segments = order.map((p) => ({
    id: p,
    seats: r.seats[p],
    short: partyShort(country, p),
    color: partyColor(country, p),
  }));

  const eyebrow =
    r.government.kind === "majority"
      ? "PROJECTED WINNER"
      : r.government.kind === "hung"
        ? "HUNG PARLIAMENT"
        : "NO OVERALL MAJORITY";

  // The headline names one party; its color is always that party's.
  const headlineParty =
    r.government.kind === "majority"
      ? r.government.party
      : r.government.kind === "hung"
        ? r.government.largest
        : inGov
          ? game.playerParty
          : largest;
  const headline = headlineParty ? name(headlineParty) : "No majority";

  const replayDaily = () => {
    const today = dailyAssignment(utcDateString());
    if (today.scenarioId !== scenarioId) return;
    newGame(country.id, game.electionId, today.role, today.seed, difficulty);
  };

  const mapPreview = country.map ? (
    <svg viewBox={country.map.viewBox} preserveAspectRatio="xMidYMid meet">
      <InertLand paths={country.map.inert} />
      {Object.entries(country.map.shapes).map(([id, shape]) => (
        <path
          key={id}
          d={shape.d}
          fill={partyFill(partyColor(country, game.playerParty))}
          stroke="#0b1120"
          strokeWidth={0.8}
        />
      ))}
      <InsetFrames shapes={country.map.shapes} />
    </svg>
  ) : undefined;

  return (
    <div className="center" style={{ padding: "24px 16px" }}>
      <ElectionNightShell
        eyebrow={eyebrow}
        headline={headline}
        headlineColor={headlineParty ? partyColor(country, headlineParty) : undefined}
        winner={headlineParty && leaders[headlineParty] ? { name: leaders[headlineParty], color: partyColor(country, headlineParty) } : undefined}
        winnerLogo={headlineParty ? partyLogoFor(country.id, headlineParty, year) : null}
        subhead={
          won
            ? `You won ${country.label}.`
            : inGov
              ? "You're in government."
              : regional
                ? `${playerSeats} ${country.unitNamePlural} against ${regional.historical} in the real election.`
                : "You came up short."
        }
        subheadTone={won ? "win" : inGov ? "neutral" : regional ? (playerSeats > regional.historical ? "win" : playerSeats === regional.historical ? "neutral" : "loss") : "loss"}
        counterValue={playerSeats}
        counterLabel={`Your ${country.unitNamePlural}`}
        counterColor={partyColor(country, game.playerParty)}
        secondaryCounter={{
          value: popShare,
          label: "Vote share",
          decimals: 1,
          suffix: "%",
        }}
        swing={{
          value: seatMargin,
          maxAbs: Math.max(40, Math.abs(seatMargin) * 1.4),
          leftLabel: partyShort(country, leftParty),
          rightLabel: partyShort(country, rightParty),
          leftColor: partyColor(country, leftParty),
          rightColor: partyColor(country, rightParty),
          unitLabel: plurality ? "vs rival" : "vs maj.",
          words: plurality
            ? { ahead: "ahead", behind: "behind", level: "level" }
            : { ahead: "over", behind: "short", level: "exactly on" },
          caption: plurality ? `${country.unitNamePlural} vs top rival` : `${country.unitNamePlural} vs majority`,
        }}
        nextScenario={
          next && nextData
            ? {
                title: nextData.label,
                blurb: next.blurb,
                unlocked,
                ctaLabel: `Play ${nextData.year} →`,
                lockLabel: `Unlock ${nextData.year}`,
                onPlay: () => newGame(country.id, next.id, nextParty, String(Date.now()), difficulty),
                onUnlock: () => openStoreForScenario(packId),
                mapPreview,
                freeAlternative: freeChoice(unlocked, country.id, scenarioId),
              }
            : null
        }
        footer={
          <>
            <DailyResultPanel
              gameSeed={game.seed}
              scenarioId={scenarioId}
              engine="country"
              won={won}
              unitLine={`${playerSeats} ${country.unitNamePlural}`}
              score={score}
              facts={facts}
              evMargin={Math.round(facts.unitMargin)}
              popularVoteMargin={facts.popularMargin}
              onReplay={replayDaily}
            />
            <div className="card score-card">
              <div className="score-row">
                <div>
                  <div className="eyebrow score-eyebrow"><Trophy size={12} aria-hidden="true" /> Campaign score</div>
                  <div className="score-value num">
                    {score}<span className="score-max"> / 1000</span>
                  </div>
                  <div className="muted small">
                    {country.unitName} margin {facts.unitMargin >= 0 ? "+" : ""}{Math.round(facts.unitMargin)}{plurality ? " vs top rival" : ""} · popular{" "}
                    {facts.popularMargin >= 0 ? "+" : ""}{facts.popularMargin.toFixed(1)} pts
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {game.custom ? (
                    <span className="muted small">Custom campaigns are casual only and don't post to the leaderboard</span>
                  ) : DISTRIBUTION.preview ? (
                    <span className="muted small">{PREVIEW_SCORE_NOTE}</span>
                  ) : user ? (
                    <button className="primary" disabled={postState === "busy" || postState === "done" || serverDown} onClick={postScore}>
                      {postState === "done" ? "Posted ✓" : postState === "busy" ? "Posting…" : serverDown ? "Offline" : "Post to Leaderboard"}
                    </button>
                  ) : serverDown ? (
                    <span className="muted small">Play offline</span>
                  ) : (
                    <button className="primary" onClick={() => openModal("login")}>
                      <Lock size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Log in to post
                    </button>
                  )}
                  {postNote && <div className="muted small" style={{ marginTop: 6 }}>{postNote}</div>}
                </div>
              </div>
            </div>

            <WhyReport log={replay} won={inGov} />

            {replay && (
              <button className="ghost" style={{ width: "100%", padding: 10 }} onClick={() => setTimelineOpen(true)}>
                View campaign timeline
              </button>
            )}

            <div className="card">
              <h3>Biggest swings you caused</h3>
              {r.postMortem.length === 0 && <p className="muted small">No persuasive actions recorded. Other campaigns and events shaped the result.</p>}
              {r.postMortem.map((c, i) => (
                <div className="kv" key={i}>
                  <span className="k">{c.cause}</span>
                  <span className={c.marginDelta >= 0 ? "chip up" : "chip down"}>
                    {c.marginDelta > 0 ? "+" : ""}{(c.marginDelta * 100).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="row" style={{ gap: 8 }}>
              <button className="primary" style={{ flex: 1, padding: 12 }} onClick={reset}>New campaign</button>
              <button className="ghost" onClick={() => { reset(); onExit(); }}>All scenarios</button>
            </div>
          </>
        }
      >
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>{govText}</p>

        <MultipartySeatPanel
          segments={segments}
          total={majority.total}
          threshold={majority.threshold}
          plurality={plurality}
          government={r.government}
          nameOf={name}
          unitPlural={country.unitNamePlural}
          mathLabel={country.runoff ? "RUNOFF RESULT" : plurality ? "MOST VOTES WINS" : undefined}
        />

        <div className="card">
          <h3>Final standings</h3>
          {order.map((p) => (
            <div className="bloc" key={p}>
              <span className="name" style={{ color: p === game.playerParty ? partyInk(partyColor(country, p)) : undefined }}>
                <PartyLogo country={country.id} party={p} year={country.elections[game.electionId]?.year} color={partyColor(country, p)} size={14} />
                {partyShort(country, p)}
              </span>
              <span className="meta">{r.seats[p]} {r.seats[p] === 1 ? country.unitName : country.unitNamePlural} · {((r.voteShare[p] ?? 0) * 100).toFixed(1)}%</span>
              <div className="suppbar"><div style={{ width: `${(r.seats[p] / majority.total) * 100 * 1.6}%`, background: partyFill(partyColor(country, p)) }} /></div>
            </div>
          ))}
        </div>
      </ElectionNightShell>
      {timelineOpen && replay && <TimelineView log={replay} onClose={() => setTimelineOpen(false)} />}
    </div>
  );
}
