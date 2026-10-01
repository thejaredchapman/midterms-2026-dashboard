import { useEffect, useState } from 'react';
import { fetchBlueskyPosts, fetchNews, fetchSummary } from '../lib/api.js';
import { PARTY_LABEL } from '../lib/filter.js';
import Avatar from './Avatar.jsx';
import Flag from './Flag.jsx';
import XTimeline from './XTimeline.jsx';
import styles from './Drawer.module.css';

const OUTLETS = [['reuters', 'Reuters'], ['ap', 'AP'], ['fox', 'Fox News'], ['cnn', 'CNN']];
const BIAS = { left: 'Left / Lean Left', center: 'Center', right: 'Right / Lean Right' };
const fmtDate = (d) => {
  if (!d) return '';
  const iso = /^\d{8}T/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function Drawer({ c, onClose }) {
  const [news, setNews] = useState({ status: 'loading' });
  const [posts, setPosts] = useState({ status: 'idle' });
  const [handle, setHandle] = useState(c.bluesky ?? '');
  const [sum, setSum] = useState({ status: 'idle' });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    setNews({ status: 'loading' });
    setSum({ status: 'idle' });
    fetchNews(c.name, c.state, c.office)
      .then((d) => live && setNews({ status: 'ok', ...d }))
      .catch((e) => live && setNews({ status: 'error', error: e.message }));
    return () => { live = false; };
  }, [c.id]);

  useEffect(() => {
    let live = true;
    setHandle(c.bluesky ?? '');
    if (!c.bluesky) { setPosts({ status: 'none' }); return; }
    setPosts({ status: 'loading' });
    fetchBlueskyPosts(c.bluesky)
      .then((p) => live && setPosts({ status: 'ok', items: p }))
      .catch((e) => live && setPosts({ status: 'error', error: e.message }));
    return () => { live = false; };
  }, [c.id]);

  const tryHandle = (e) => {
    e.preventDefault();
    const h = handle.trim().replace(/^@/, '');
    if (!h) return;
    setPosts({ status: 'loading' });
    fetchBlueskyPosts(h).then((p) => setPosts({ status: 'ok', items: p })).catch((err) => setPosts({ status: 'error', error: err.message }));
  };

  const summarize = async () => {
    setSum({ status: 'loading' });
    try {
      const r = await fetchSummary({ name: c.name, office: c.office, party: PARTY_LABEL[c.party], posts: posts.items ?? [], articles: news.articles ?? [] });
      setSum({ status: 'ok', ...r });
    } catch (e) {
      setSum({ status: 'error', error: e.message });
    }
  };

  const grouped = (b) => (news.articles ?? []).filter((a) => a.bias === b);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label={`${c.name} profile`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
        <header className={styles.head}>
          <Avatar c={c} size={88} />
          <div>
            <h2>{c.name}</h2>
            <p>{PARTY_LABEL[c.party]} · {c.office} {c.district ? `${c.state}-${c.district}` : c.state} · {c.status}</p>
            <p className={styles.links}>
              {c.website && <a href={c.website} target="_blank" rel="noreferrer noopener">Website ↗</a>}
              {c.wikiUrl && <a href={c.wikiUrl} target="_blank" rel="noreferrer noopener">Wikipedia ↗</a>}
              <a href={c.ballotpedia} target="_blank" rel="noreferrer noopener">Ballotpedia ↗</a>
            </p>
          </div>
        </header>

        <section className={styles.facts}>
          <div><span>Race rating</span><strong>{c.rating ?? '—'}</strong></div>
          <div><span>Trump-backed</span><Flag value={c.trump} yes="Endorsed" no="Not endorsed" /></div>
          <div><span>Medicaid cuts (OBBB)</span><Flag value={c.medicaidCuts} yes="Voted yes" no="Voted no" /></div>
          <div><span>Against DEI</span><Flag value={c.antiDei} /></div>
        </section>
        {c.iran && <p><strong>Iran:</strong> {c.iran}</p>}
        {c.distancing && <p><strong>Distancing from Trump:</strong> {c.distancing}</p>}
        {c.sources?.length > 0 && (
          <details className={styles.sources}><summary>Sources for this profile ({c.sources.length})</summary>
            <ul>{c.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a></li>)}</ul>
          </details>
        )}

        <section>
          <div className={styles.row}>
            <h3>AI summary</h3>
            <button className={styles.btn} onClick={summarize} disabled={sum.status === 'loading' || news.status === 'loading'}>
              {sum.status === 'loading' ? 'Summarizing…' : 'Summarize with Claude Haiku'}
            </button>
          </div>
          {sum.status === 'idle' && <p className={styles.muted}>Summarizes the candidate’s recent posts and the headlines below, by left / center / right outlet. Uses headlines only — read the articles for detail.</p>}
          {sum.status === 'error' && <p className={styles.err}>{sum.error}</p>}
          {sum.status === 'ok' && (
            <dl className={styles.sum}>
              {sum.overall && <><dt>Overall</dt><dd>{sum.overall}</dd></>}
              {sum.posts && <><dt>Their own posts</dt><dd>{sum.posts}</dd></>}
              {['left', 'center', 'right'].map((b) => sum[b] && <div key={b}><dt className={styles[b]}>{BIAS[b]}</dt><dd>{sum[b]}</dd></div>)}
            </dl>
          )}
        </section>

        <section>
          <h3>News <small>(Reuters · AP · Fox News · CNN)</small></h3>
          {news.status === 'loading' && <p className={styles.muted}>Searching news…</p>}
          {news.status === 'error' && <p className={styles.err}>{news.error}</p>}
          {news.status === 'ok' && news.mode === 'outlets' && (
            <>
              <p className={styles.muted}>
                Last 30 days: {OUTLETS.map(([id, label]) => `${label} ${news.available[id] ?? 0}`).join(' · ')}. Showing {news.articles.length}.
                {news.supplemented?.length > 0 && ` ${news.supplemented.join(' & ')} filled in from Google News.`}
              </p>
              {OUTLETS.map(([id, label]) => {
                const items = news.articles.filter((a) => a.outlet === label);
                return items.length > 0 && (
                  <div key={id}>
                    <h4 className={styles[items[0].bias ?? 'center']}>{label} <small>({BIAS[items[0].bias] ?? 'unrated'})</small></h4>
                    <ul className={styles.list}>
                      {items.map((a) => <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer noopener">{a.title}</a><span>{fmtDate(a.date)}</span></li>)}
                    </ul>
                  </div>
                );
              })}
              {news.notes?.map((n) => <p key={n} className={styles.err}>{n}</p>)}
              {!news.articles.length && <p className={styles.muted}>No articles from these outlets in the last 30 days.</p>}
            </>
          )}
          {news.status === 'ok' && news.mode !== 'outlets' && (
            <>
              <p className={styles.muted}>Found {news.available.left} left, {news.available.center} center, {news.available.right} right articles in the last 30 days; showing {news.articles.length}.</p>
              {['left', 'center', 'right'].map((b) => grouped(b).length > 0 && (
                <div key={b}>
                  <h4 className={styles[b]}>{BIAS[b]}</h4>
                  <ul className={styles.list}>
                    {grouped(b).map((a) => <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer noopener">{a.title}</a><span>{a.domain} · {fmtDate(a.date)}</span></li>)}
                  </ul>
                </div>
              ))}
            </>
          )}
          <p className={styles.fine}>Outlet lean is approximate, modeled on AllSides ratings.</p>
        </section>

        <section>
          <h3>Recent posts</h3>
          <h4>Bluesky <small>(free, summarizable)</small></h4>
          {posts.status === 'loading' && <p className={styles.muted}>Loading…</p>}
          {posts.status === 'error' && <p className={styles.err}>{posts.error}</p>}
          {posts.status === 'none' && <p className={styles.muted}>No Bluesky account on file.</p>}
          {posts.status === 'ok' && (posts.items.length ? (
            <ul className={styles.list}>{posts.items.map((p) => <li key={p.url}><a href={p.url} target="_blank" rel="noreferrer noopener">{p.text.slice(0, 240)}</a><span>{fmtDate(p.date)}</span></li>)}</ul>
          ) : <p className={styles.muted}>No recent posts.</p>)}
          <form onSubmit={tryHandle} className={styles.handle}>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Bluesky handle, e.g. name.bsky.social" aria-label="Bluesky handle" />
            <button className={styles.btn}>Load</button>
          </form>
          {c.twitter ? (<><h4>X / Twitter <small>(free embed, display-only — not included in AI summary)</small></h4><XTimeline handle={c.twitter} /></>) : <p className={styles.muted}>No X account on file.</p>}
        </section>
      </aside>
    </div>
  );
}
