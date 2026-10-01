import styles from './Page.module.css';

const ROWS = [
  ['Photos, official sites, X handles (sitting members)', 'unitedstates/congress-legislators', 'https://unitedstates.github.io/congress-legislators/', 'Free'],
  ['Photos, profile links, campaign sites, Bluesky/X handles (everyone else)', 'Wikipedia REST + Wikidata', 'https://www.wikidata.org/', 'Free'],
  ['News search', 'GDELT DOC 2.0', 'https://github.com/gdelt/gdelt.github.io', 'Free, ~1 req / 5 s, last 30 days'],
  ['Outlet lean (left / center / right)', 'Approximation of AllSides ratings', 'https://www.allsides.com/media-bias', 'Hand-maintained snapshot'],
  ['Recent posts', 'Bluesky public API', 'https://docs.bsky.app/docs/advanced-guides/api-directory', 'Free, no key'],
  ['X / Twitter feed', 'Official embed widget (display only)', 'https://publish.twitter.com/', 'Free but unreliable; X API reads are now paid per post'],
  ['Summaries', 'Claude Haiku 4.5', 'https://docs.claude.com/', 'Needs ANTHROPIC_API_KEY (small per-call cost)'],
  ['Votes & bills', 'Congress.gov', 'https://www.congress.gov/', 'Free (verification source)'],
  ['Race ratings', 'Cook Political Report, Sabato, Inside Elections', 'https://www.cookpolitical.com/ratings', 'Public ratings pages'],
  ['Fact-check ratings', 'PolitiFact', 'https://www.politifact.com/', 'Public scorecards'],
];
const NEXT = [
  ['FEC / openFEC', 'Fundraising and top donors — often the best predictor of positions', 'https://api.open.fec.gov/developers/'],
  ['Voteview (DW-NOMINATE)', 'Objective ideology scores for the “country vs. party” column', 'https://voteview.com/'],
  ['Lugar Center Bipartisan Index', 'Bipartisanship ranking for sitting members', 'https://www.thelugarcenter.org/'],
  ['Vote Smart', 'Issue positions, speeches and interest-group ratings', 'https://justfacts.votesmart.org/'],
  ['Washington Post Fact Checker / FactCheck.org', 'Second and third fact-checking opinions', 'https://www.factcheck.org/'],
  ['C-SPAN video library', 'Primary-source statements and debates', 'https://www.c-span.org/'],
];

export default function Sources() {
  return (
    <div className={styles.page}>
      <h2>Sources & method</h2>
      <p className={styles.lede}>Everything the app pulls live is free. Subjective columns are filled only from cited sources; otherwise they show <em>Unverified</em>.</p>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead><tr><th>Used for</th><th>Source</th><th>Cost / limits</th></tr></thead>
          <tbody>{ROWS.map(([use, name, url, cost]) => <tr key={name}><td>{use}</td><td><a href={url} target="_blank" rel="noreferrer noopener">{name}</a></td><td>{cost}</td></tr>)}</tbody>
        </table>
      </div>
      <h3>How the vote-based columns are derived</h3>
      <ul>
        <li><strong>Voted for Medicaid cuts / other medical-funding cuts</strong>: a YES on final passage of H.R. 1 (OBBBA). CBO scores the law as cutting federal Medicaid/CHIP spending by ~$1.02T through 2034; supporters dispute the “cut” framing (<a href="https://www.factcheck.org/2026/05/kennedy-denies-the-one-big-beautiful-bill-acts-spending-cuts-to-medicaid/">FactCheck.org</a>). No bill literally “ended” Medicaid. Candidates who are not members of Congress show <em>Unverified</em>.</li>
        <li><strong>Trump-backed</strong>: marked only where an endorsement is confirmed; blank otherwise.</li>
        <li><strong>Against DEI</strong>: marked only with a documented position; blank otherwise.</li>
        <li><strong>Truthfulness % and Country-vs-party</strong>: planned from PolitiFact per-person scorecards and Voteview / Lugar Center, shown only when sourced.</li>
      </ul>
      <h3>Other sources worth adding</h3>
      <ul>{NEXT.map(([n, why, url]) => <li key={n}><a href={url} target="_blank" rel="noreferrer noopener">{n}</a> — {why}</li>)}</ul>
    </div>
  );
}
