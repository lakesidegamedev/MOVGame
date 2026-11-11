import { useEffect, useState } from "react";
import {
  api,
  type LeaderboardEntry,
  type MyRanking,
  type DailyBoard,
  type DailyChampions,
} from "@lib/api";
import { SCENARIO_REGISTRY, SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { dailyAssignment, utcDateString } from "@lib/daily";
import { useAuthStore } from "@store/authStore";
import { ChevronLeft, Trophy, CalendarDays } from "lucide-react";
import { SkeletonRows } from "./Skeleton";

const DIFFS = ["all", "easy", "normal", "hard"] as const;

// ── Daily Challenge view: all-time champions + today's board ──────────────
function DailyView() {
  const user = useAuthStore((s) => s.user);
  const [champions, setChampions] = useState<DailyChampions | null>(null);
  const [today, setToday] = useState<DailyBoard | null>(null);
  const [error, setError] = useState("");
  const assignment = dailyAssignment(utcDateString());
  const meta = SCENARIOS_BY_ID[assignment.scenarioId];

  useEffect(() => {
    setError("");
    api.dailyChampions().then(setChampions).catch((e) => setError(e instanceof Error ? e.message : "Server unreachable"));
    api.dailyBoard(assignment.date).then(setToday).catch(() => {});
  }, [assignment.date]);

  return (
    <>
      <div className="card">
        <h3><Trophy size={13} aria-hidden="true" /> Daily Champions {champions ? <span className="muted small" style={{ fontWeight: 500 }}>· {champions.totalDays} day{champions.totalDays === 1 ? "" : "s"} played</span> : null}</h3>
        {error && <p className="lb-error" role="status">Could not load the leaderboard ({error}). Check your connection and open this page again.</p>}
        {!error && champions === null && <SkeletonRows rows={5} cols={6} />}
        {champions && champions.entries.length === 0 && (
          <p className="muted small">No daily results yet. Play today's challenge and post your score to start the board.</p>
        )}
        {champions && champions.entries.length > 0 && (
          <table className="data-table lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th className="num">Wins</th>
                <th className="num">Podiums</th>
                <th className="num">Played</th>
                <th className="num">Total pts</th>
              </tr>
            </thead>
            <tbody>
              {champions.entries.map((e) => {
                const isMe = user && e.username === user.username;
                return (
                  <tr key={`${e.rank}-${e.username}`} className={isMe ? "is-player" : undefined}>
                    <td><RankBadge rank={e.rank} /></td>
                    <td className={isMe ? "lb-me" : undefined}>{e.username}{isMe && " (you)"}</td>
                    <td className="num lb-score">{e.wins}</td>
                    <td className="num">{e.podiums}</td>
                    <td className="num muted">{e.played}</td>
                    <td className="num">{e.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Today · {meta?.flag} {meta?.label ?? assignment.scenarioId}</h3>
        {today === null && <SkeletonRows rows={3} cols={4} />}
        {today && today.entries.length === 0 && <p className="muted small">No entries yet today. Be the first to post.</p>}
        {today && today.entries.length > 0 && (
          <table className="data-table lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th className="num">Score</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {today.entries.map((e) => {
                const isMe = user && e.username === user.username;
                return (
                  <tr key={`${e.rank}-${e.username}`} className={isMe ? "is-player" : undefined}>
                    <td><RankBadge rank={e.rank} /></td>
                    <td className={isMe ? "lb-me" : undefined}>{e.username}{isMe && " (you)"}</td>
                    <td className="num lb-score">{Math.round(e.score)}</td>
                    <td className="muted">{e.difficulty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return <span className={`lb-rank num${rank <= 3 ? ` top${rank}` : ""}`}>{rank}</span>;
}

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<"scenario" | "daily">("scenario");
  const [scenarioId, setScenarioId] = useState("us-2024");
  const [difficulty, setDifficulty] = useState<(typeof DIFFS)[number]>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [mine, setMine] = useState<MyRanking[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setEntries(null);
    setError("");
    api.leaderboard(scenarioId, difficulty === "all" ? undefined : difficulty, 20)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not reach the server"));
  }, [scenarioId, difficulty]);

  useEffect(() => {
    if (!user) { setMine([]); return; }
    api.myRankings().then((r) => setMine(r.rankings)).catch(() => {});
  }, [user]);

  const meta = SCENARIOS_BY_ID[scenarioId];

  return (
    <div className="center">
      <div className="setup lb">
        <div className="lb-top">
          <div className="setup-eyebrow">
            <span className="mark"><Trophy size={16} /></span>LEADERBOARD
          </div>
          <button className="ghost small" onClick={onBack}><ChevronLeft size={14} /> Back</button>
        </div>
        <div className="title">Hall of Campaigns</div>
        <p className="sub">Best score per player, per scenario. Post yours from the results screen.</p>

        <div className="segmented lb-modes" role="tablist" aria-label="Leaderboard">
          <button role="tab" aria-selected={mode === "scenario"} onClick={() => setMode("scenario")}>
            <Trophy size={13} aria-hidden="true" />By scenario
          </button>
          <button role="tab" aria-selected={mode === "daily"} onClick={() => setMode("daily")}>
            <CalendarDays size={13} aria-hidden="true" />Daily Challenge
          </button>
        </div>

        {mode === "daily" ? <DailyView /> : <>
        <div className="lb-filters">
          <div className="field lb-scenario">
            <label>Scenario</label>
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {SCENARIO_REGISTRY.map((s) => (
                <option key={s.scenarioId} value={s.scenarioId}>{s.flag} {s.label}</option>
              ))}
            </select>
          </div>
          <div className="field lb-difficulty">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as (typeof DIFFS)[number])}>
              {DIFFS.map((d) => <option key={d} value={d}>{d === "all" ? "All difficulties" : d}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          {error && <p className="lb-error" role="status">Could not load the leaderboard ({error}). Check your connection and open this page again.</p>}
          {!error && entries === null && <SkeletonRows rows={5} cols={6} />}
          {entries !== null && entries.length === 0 && (
            <p className="muted small">No scores yet for {meta?.label ?? scenarioId}. Be the first to finish a campaign and post one.</p>
          )}
          {entries !== null && entries.length > 0 && (
            <table className="data-table lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th className="num">Score</th>
                  <th className="num">{meta?.country === "US" ? "EV margin" : "Unit margin"}</th>
                  <th className="num">Popular</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const isMe = user && e.username === user.username;
                  return (
                    <tr key={`${e.rank}-${e.username}`} className={isMe ? "is-player" : undefined}>
                      <td><RankBadge rank={e.rank} /></td>
                      <td className={isMe ? "lb-me" : undefined}>
                        {e.username}{isMe && " (you)"}
                      </td>
                      <td className="num lb-score">{Math.round(e.score)}</td>
                      <td className="num">{e.evMargin !== null ? (e.evMargin >= 0 ? `+${e.evMargin}` : e.evMargin) : "·"}</td>
                      <td className="num">{e.popularVoteMargin !== null ? `${e.popularVoteMargin >= 0 ? "+" : ""}${Number(e.popularVoteMargin).toFixed(1)}` : "·"}</td>
                      <td className="muted">{e.difficulty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {user && mine.length > 0 && (
          <div className="card">
            <h3>Your rankings</h3>
            {mine.map((r) => (
              <div className="kv" key={r.scenarioId}>
                <span className="k">{SCENARIOS_BY_ID[r.scenarioId]?.label ?? r.scenarioId}</span>
                <span>#{r.rank} · {Math.round(r.score)} pts · {r.difficulty}</span>
              </div>
            ))}
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
