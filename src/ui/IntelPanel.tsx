import { useGameStore } from "@store/gameStore";
import { partyInk } from "@ui/colors";
import { nationalPoll } from "@engine/index";
import { liveIssueIds } from "@content/issues";
import { pct } from "./format";

export function IntelPanel() {
  const game = useGameStore((s) => s.game)!;
  const natl = nationalPoll(game);
  // This election's issues, by current national salience. Older saves carry
  // every axis, so near-zero ones (covid before 2020) stay hidden.
  const issues = liveIssueIds(game).filter((id) => game.salience[id] >= 0.08).sort((a, b) => game.salience[b] - game.salience[a]);
  const issueName = (id: (typeof issues)[number]) => game.issues[id]?.name ?? id;

  const opp = game.playerCandidate === "dem" ? "rep" : "dem";
  const oppLocId = game.locations?.[opp];
  const oppLoc = oppLocId ? game.states.find((s) => s.id === oppLocId) : null;

  return (
    <div className="card scroll">
      <h3>National Intel</h3>
      <div className="kv"><span className="k">National poll (2-party)</span><span>{game.candidates.dem.shortName} {pct(natl)} · {game.candidates.rep.shortName} {pct(1 - natl)}</span></div>
      <div className="kv" title="Short-term campaign energy. Runs from -100 to +100 and fades each week."><span className="k">Your momentum</span><span>{game.resources[game.playerCandidate].nationalMomentum.toFixed(0)}</span></div>
      <div className="kv" title="How favorable the current coverage is to your campaign, from -100 to +100."><span className="k">Media narrative</span><span>{game.resources[game.playerCandidate].mediaNarrative.toFixed(0)}</span></div>
      <div className="kv"><span className="k">{game.candidates[opp].shortName}'s last stop</span><span style={{ color: partyInk(game.candidates[opp].color) }}>{oppLoc ? oppLoc.name : "·"}</span></div>

      <h3 style={{ marginTop: 14 }} title="The share of voter attention on each issue, not support for either ticket.">Issue Salience</h3>
      {issues.map((id) => (
        <div className="bloc issue-row" key={id} aria-label={`${issueName(id)} salience ${pct(game.salience[id], 0)}`}>
          <span className="name" title={game.issues[id]?.blurb}>{issueName(id)}</span>
          <span className="meta">{pct(game.salience[id], 0)}</span>
          <div className="suppbar"><div className="d" style={{ width: `${game.salience[id] * 100}%`, background: "var(--gold)" }} /></div>
        </div>
      ))}
    </div>
  );
}
