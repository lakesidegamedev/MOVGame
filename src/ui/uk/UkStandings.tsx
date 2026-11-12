import { useUkStore } from "@store/ukStore";
import { partyInk, partyFill } from "@ui/colors";
import { majorityForUk, ukGameIssues } from "@engine/ukGame";
import { partyColor, partyShort, sortBySeats } from "./parties";
import { partyName } from "./parties";
import { MpPollBlock } from "@ui/MpPollBlock";

const GOV_LABEL: Record<string, string> = {
  majority: "Majority government",
  minority: "Minority government",
  coalition: "Coalition",
  confidence_supply: "Confidence & supply",
  hung: "Hung parliament",
};

// National party standings + projected government + issue salience — the UK
// analog of the U.S. National Intel panel.
export function UkStandings() {
  const game = useUkStore((s) => s.game)!;
  const live = useUkStore((s) => s.liveProjection)();
  if (!live) return null;
  const order = sortBySeats(live.seats);
  const maj = majorityForUk(game);
  const liveIssues = ukGameIssues(game);
  const issues = liveIssues.filter((i) => i.salience >= 0.1).sort((a, b) => b.salience - a.salience).map((i) => i.id);
  const issueName = (id: string) => liveIssues.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="card scroll">
      <h3>National Standings</h3>
      <div className="kv"><span className="k">Projected government</span><span style={{ color: partyInk(partyColor(live.largestParty)) }}>{GOV_LABEL[live.government.kind]}</span></div>
      <div className="kv"><span className="k">Largest party</span><span style={{ color: partyInk(partyColor(live.largestParty)) }}>{partyName(live.largestParty)}</span></div>
      <div className="kv"><span className="k">Your momentum</span><span>{game.resources[game.playerParty].momentum.toFixed(0)}</span></div>

      <MpPollBlock
        seed={game.seed}
        turn={game.turn}
        regions={game.regions}
        parties={order}
        playerParty={game.playerParty}
        partyLabel={partyShort}
        partyColor={partyColor}
      />

      <h3 className="section-gap">Seats</h3>
      {order.map((p) => (
        <div className="bloc" key={p}>
          <span className="name" style={{ color: p === game.playerParty ? partyInk(partyColor(p)) : undefined, fontWeight: p === game.playerParty ? 700 : 500 }}>
            <span className="swatch" style={{ "--party": partyFill(partyColor(p)) } as React.CSSProperties} />
            {partyShort(p)}
          </span>
          <span className="meta">{live.seats[p]} seats · {((live.voteShare[p] ?? 0) * 100).toFixed(1)}%</span>
          <div className="suppbar"><div style={{ width: `${(live.seats[p] / maj.total) * 100 * 2}%`, background: partyColor(p) }} /></div>
        </div>
      ))}

      <h3 className="section-gap">Issue Salience</h3>
      {issues.map((id) => (
        <div className="bloc issue-row" key={id} aria-label={`${issueName(id)} salience ${(game.salience[id] * 100).toFixed(0)}%`}>
          <span className="name">{issueName(id)}</span>
          <span className="meta">{(game.salience[id] * 100).toFixed(0)}%</span>
          <div className="suppbar"><div style={{ width: `${game.salience[id] * 100}%`, background: "var(--gold)" }} /></div>
        </div>
      ))}
    </div>
  );
}
