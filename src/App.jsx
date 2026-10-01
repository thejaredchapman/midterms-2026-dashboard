import { useEffect, useState } from 'react';
import candidates from './data/candidates.json';
import Overview from './components/Overview.jsx';
import Matrix from './components/Matrix.jsx';
import Legislation from './components/Legislation.jsx';
import FactCheck from './components/FactCheck.jsx';
import Sources from './components/Sources.jsx';
import Drawer from './components/Drawer.jsx';
import styles from './App.module.css';

const VIEWS = [
  ['overview', 'Summary'],
  ['candidates', 'Candidate matrix'],
  ['legislation', 'Big Beautiful Bill'],
  ['factcheck', 'Fact-check'],
  ['sources', 'Sources & method'],
];

const fromHash = () => (VIEWS.find(([k]) => `#${k}` === location.hash)?.[0] ?? 'overview');

export default function App() {
  const [view, setView] = useState(fromHash);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const on = () => setView(fromHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const go = (k) => { location.hash = k; setMenu(false); scrollTo(0, 0); };

  return (
    <>
      <header className={styles.banner}>
        <button className={styles.burger} aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
        <div>
          <h1>2026 Midterms Tracker</h1>
          <p>Senate · Governor · House — searchable candidate matrix with news and posts</p>
        </div>
        <nav className={`${styles.nav} ${menu ? styles.open : ''}`} aria-label="Sections">
          {VIEWS.map(([k, l]) => <a key={k} href={`#${k}`} className={view === k ? styles.active : ''} onClick={(e) => { e.preventDefault(); go(k); }}>{l}</a>)}
        </nav>
      </header>
      <main className={styles.main}>
        {view === 'overview' && <Overview data={candidates} go={go} />}
        {view === 'candidates' && <Matrix data={candidates} onSelect={setSelected} />}
        {view === 'legislation' && <Legislation />}
        {view === 'factcheck' && <FactCheck />}
        {view === 'sources' && <Sources />}
      </main>
      <footer className={styles.footer}>Informational only. Data is hand-curated from the sources listed under “Sources & method”; fields shown as Unverified are not yet sourced. Not affiliated with any campaign or party.</footer>
      {selected && <Drawer c={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
