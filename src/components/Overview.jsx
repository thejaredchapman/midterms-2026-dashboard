import { summarizeSet } from '../lib/filter.js';
import styles from './Page.module.css';

const A = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;

// Findings below come from sources linked inline (retrieved 2026-10-01). Counts are computed from the dataset.
const FINDINGS = [
  <>Cook rates <strong>7 Senate toss-ups</strong> — AK, IA, ME, MI, NH, OH, TX (<A href="https://www.cookpolitical.com/ratings/senate-race-ratings">Cook, Sep 23</A>). Cook also shifted 15 House races toward Democrats on Sep 25 (<A href="https://www.washingtonpost.com/elections/2026/09/25/cook-political-report-moves-15-house-races-into-democrats-favor/">WaPo</A>).</>,
  <><strong>Iran war powers split the GOP.</strong> Senate: passed 50-48 on Jun 24 (Cassidy, Collins, Murkowski, Paul joined Democrats), then failed 49-50 on Sep 24 (Paul, Collins, Murkowski, Tillis) (<A href="https://thehill.com/homenews/senate/5876248-senate-vote-war-powers-iran/">The Hill</A>). House: passed 215-208 (Jun 3) and 214-208 (Jul 23) with Massie, Fitzpatrick, Barrett and Davidson (<A href="https://time.com/article/2026/07/23/war-powers-resolution-iran-trump-senate-house-republicans/">TIME</A>).</>,
  <><strong>Gas prices are the pressure point.</strong> Iowa Senate nominee Ashley Hinson: Iowans “shouldn’t have to foot the bill at the pump… for the war in Iran”; Rep. Massie cited “$5 gallon gas.” Trump’s approval has regularly dipped below 40% (<A href="https://spectrumlocalnews.com/us/snplus/politics/2026/09/22/republican-candidates-distance-themselves-from-trump-before-midterms">Spectrum News</A>).</>,
  <><strong>Distancing, with limits.</strong> Sununu (NH) disagrees with Trump on Iran and tariffs; he and Collins (ME) are skipping Trump’s midterm convention. Trump’s team is reportedly letting battleground Republicans keep distance (<A href="https://www.ms.now/news/trump-republicans-midterm-strategy-politics-2026">MS NOW</A>).</>,
  <><strong>Candidate changes:</strong> Paxton beat Sen. Cornyn in the Texas runoff with Trump’s endorsement and trails Talarico 44–47 (<A href="https://thehill.com/homenews/campaign/5902035-texas-senate-race-poll/">The Hill</A>); Troy Jackson replaced Graham Platner as Maine’s Democratic nominee (<A href="https://www.npr.org/2026/07/26/nx-s1-5906372/troy-jackson-replaces-graham-platner-as-democratic-candidate-in-maines-senate-race">NPR</A>); South Carolina’s GOP nominee is appointee Darline Graham (<A href="https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_South_Carolina">Wikipedia</A>).</>,
];

const FIELDS = [
  ['rating', 'Race rating'], ['trump', 'Trump endorsement'], ['votedObbb', 'OBBB vote'], ['antiDei', 'DEI position'], ['iran', 'Iran stance'],
  ['epstein', 'Epstein stance'], ['distancing', 'Distancing'], ['strategy', 'Campaign strategy'], ['dataCenters', 'Data centers'],
  ['truthfulness', 'Truthfulness %'], ['alignment', 'Country vs. party'],
];

export default function Overview({ data, go }) {
  const s = summarizeSet(data);
  const coverage = FIELDS.map(([k, l]) => [l, Math.round((data.filter((c) => c[k] != null).length / data.length) * 100)]);
  const tiles = [
    ['Candidates tracked', s.total], ['Senate', s.byOffice.Senate], ['Governor', s.byOffice.Governor], ['House', s.byOffice.House],
    ['Trump-endorsed', s.trumpEndorsed], ['Voted for OBBB', s.votedObbb], ['Voted against OBBB', s.votedAgainstObbb], ['Distancing from Trump', s.distancing],
  ];
  return (
    <div className={styles.page}>
      <h2>Summary</h2>
      <p className={styles.lede}>As of Oct 1, 2026 · 33 days to the Nov 3 election. This dashboard tracks the most competitive Senate, governor and House races, not every candidate in the country.</p>
      <div className={styles.tiles}>{tiles.map(([l, v]) => <div key={l} className={styles.tile}><strong>{v}</strong><span>{l}</span></div>)}</div>

      <h3>Key developments</h3>
      <ul className={styles.bullets}>{FINDINGS.map((f, i) => <li key={i}>{f}</li>)}</ul>

      <h3>Race ratings in this set</h3>
      <p>{Object.entries(s.byRating).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>

      <h3>How complete is the data?</h3>
      <p className={styles.note}>Fields that could not be verified from a cited source are left <em>Unverified</em> rather than guessed. Coverage by column:</p>
      <div className={styles.cov}>
        {coverage.map(([l, p]) => (
          <div key={l}><span>{l}</span><div className={styles.bar} role="img" aria-label={`${l}: ${p}% filled`}><i style={{ width: `${p}%` }} /></div><b>{p}%</b></div>
        ))}
      </div>
      <p><button className={styles.cta} onClick={() => go('candidates')}>Open the candidate matrix →</button></p>
    </div>
  );
}
