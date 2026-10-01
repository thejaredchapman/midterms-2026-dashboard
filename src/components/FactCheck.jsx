import data from '../data/factcheck.json';
import styles from './Page.module.css';

const COLORS = { true: '#1e7a46', 'mostly-true': '#6aa84f', 'half-true': '#d4a017', 'mostly-false': '#e08a3c', false: '#c23a35', 'pants-fire': '#7a1410' };

export default function FactCheck() {
  const total = data.ratings.reduce((n, r) => n + r.count, 0);
  const pct = (n) => ((n / total) * 100).toFixed(1);
  const sum = (keys) => data.ratings.filter((r) => keys.includes(r.key)).reduce((n, r) => n + r.count, 0);
  const trueish = sum(['true', 'mostly-true']), falseish = sum(['mostly-false', 'false', 'pants-fire']), half = sum(['half-true']);
  return (
    <div className={styles.page}>
      <h2>Fact-check: {data.person}</h2>
      <p className={styles.lede}>{total.toLocaleString()} statements rated by <a href={data.sourceUrl} target="_blank" rel="noreferrer noopener">{data.source}</a> (retrieved {data.retrieved}).</p>
      <div className={styles.stack} role="img" aria-label={data.ratings.map((r) => `${r.label} ${pct(r.count)}%`).join(', ')}>
        {data.ratings.map((r) => <i key={r.key} style={{ width: `${pct(r.count)}%`, background: COLORS[r.key] }} title={`${r.label}: ${r.count}`} />)}
      </div>
      <table className={styles.table}>
        <thead><tr><th>Rating</th><th>Statements</th><th>Share</th></tr></thead>
        <tbody>{data.ratings.map((r) => <tr key={r.key}><td><span className={styles.dot} style={{ background: COLORS[r.key] }} />{r.label}</td><td>{r.count}</td><td>{pct(r.count)}%</td></tr>)}</tbody>
      </table>
      <div className={styles.tiles}>
        <div className={styles.tile}><strong>{pct(trueish)}%</strong><span>True or Mostly True ({trueish})</span></div>
        <div className={styles.tile}><strong>{pct(half)}%</strong><span>Half True ({half})</span></div>
        <div className={styles.tile}><strong>{pct(falseish)}%</strong><span>Mostly False, False or Pants on Fire ({falseish})</span></div>
        <div className={styles.tile}><strong>{(falseish / trueish).toFixed(1)} : 1</strong><span>false-ish to true-ish ratings</span></div>
      </div>
      <h3>Read this before quoting the ratio</h3>
      <ul>{data.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
    </div>
  );
}
