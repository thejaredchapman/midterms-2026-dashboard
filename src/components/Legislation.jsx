import data from '../data/legislation.json';
import styles from './Page.module.css';

export default function Legislation() {
  return (
    <div className={styles.page}>
      <h2>Legislative analysis: the “Big Beautiful Bill”</h2>
      <p className={styles.lede}>{data.name}. {data.passed}.</p>
      <div className={styles.tiles}>
        {data.headline.map((h) => <a key={h.label} href={h.url} target="_blank" rel="noreferrer noopener" className={styles.tile}><strong>{h.value}</strong><span>{h.label}</span></a>)}
      </div>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead><tr><th>Provision</th><th>What it does</th><th>Window</th><th>2027</th><th>2028</th><th>Beyond</th><th>Who benefits / caveat</th></tr></thead>
          <tbody>
            {data.provisions.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><div className={styles.tag}>{p.category}</div></td>
                <td>{p.details}</td>
                <td>{p.window}</td>
                <td>{p.y2027}</td><td>{p.y2028}</td>
                <td>{p.beyond}</td>
                <td>{p.winners}<div className={styles.caveat}>{p.caveat}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{data.note}</p>
      <h3>Sources</h3>
      <ul>{data.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a></li>)}</ul>
    </div>
  );
}
