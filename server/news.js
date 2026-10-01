// News search with three interchangeable providers (all return {title,url,domain,seendate}):
//   newsapi    — NewsAPI.org /v2/everything. Used automatically when NEWSAPI_KEY is set.
//   gdelt      — GDELT DOC 2.0, free, no key (default when no key). ~1 request / 5 s, so requests are queued.
//   googlenews — opt-in (NEWS_PROVIDER=googlenews); Google limits that feed to personal, non-commercial use.
import { biasOf } from './outlets.js';
import { STATE_NAMES } from './states.js';

// NewsAPI's free Developer plan allows only 100 requests/day, so its results are cached much longer.
const TTL = { newsapi: 6 * 60 * 60 * 1000, gdelt: 30 * 60 * 1000, googlenews: 30 * 60 * 1000 };
const cache = new Map();
let chain = Promise.resolve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function queued(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => sleep(5200), () => sleep(5200));
  return run;
}

async function gdelt(query) {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.search = new URLSearchParams({
    query: `${query} sourcelang:english sourcecountry:US`,
    mode: 'artlist',
    maxrecords: '100',
    format: 'json',
    sort: 'datedesc',
    timespan: '30d',
  });
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { lastErr = new Error('GDELT rate limit — try again in a few seconds'); await sleep(6000); continue; }
      if (!r.ok) throw new Error(`GDELT ${r.status}`);
      const text = await r.text();
      try { return JSON.parse(text).articles ?? []; } catch {
        // GDELT answers rate limits and bad queries with plain text (sometimes HTTP 200) — surface it, never report "0 articles".
        throw new Error(`GDELT: ${text.trim().slice(0, 120)}`);
      }
    } catch (e) {
      lastErr = e.name === 'TimeoutError' || e.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ? new Error('GDELT is slow or unreachable right now — try again shortly') : e;
      await sleep(3000);
    }
  }
  throw lastErr;
}

// Pick up to 10: 3 left, 3 center, 3 right, +1 from whichever bucket has the freshest leftover.
export function balance(articles, perBucket = 3, total = 10) {
  const seenTitle = new Set();
  const buckets = { left: [], center: [], right: [] };
  for (const a of articles) {
    const bias = biasOf(a.domain);
    const key = a.title?.toLowerCase().slice(0, 60);
    if (!bias || !key || seenTitle.has(key)) continue;
    seenTitle.add(key);
    buckets[bias].push({ title: a.title, url: a.url, domain: a.domain, date: a.seendate, bias });
  }
  const picked = [];
  for (const b of ['left', 'center', 'right']) picked.push(...buckets[b].slice(0, perBucket));
  const rest = ['left', 'center', 'right'].flatMap((b) => buckets[b].slice(perBucket)).sort((x, y) => (y.date > x.date ? 1 : -1));
  picked.push(...rest.slice(0, Math.max(0, total - picked.length)));
  const counts = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]));
  return { articles: picked, available: counts };
}

// opts: { provider?, newsApiKey? } — callers pass their env (Vite dev middleware / Vercel function) so no globals are needed.
export function pickProvider({ provider, newsApiKey } = {}) {
  const p = (provider ?? process.env.NEWS_PROVIDER ?? '').toLowerCase();
  if (p) return p;
  return (newsApiKey ?? process.env.NEWSAPI_KEY) ? 'newsapi' : 'gdelt';
}

export async function getNews(name, extra = '', opts = {}) {
  const provider = pickProvider(opts);
  const key = `${provider}|${name}|${extra}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < (TTL[provider] ?? TTL.gdelt)) return hit.v;
  let raw;
  if (provider === 'newsapi') raw = await newsApi(name, extra, opts.newsApiKey ?? process.env.NEWSAPI_KEY);
  else if (provider === 'googlenews') raw = await googleNews(name);
  else raw = await queued(() => gdelt(`"${name}"${extra ? ` (${extra})` : ''}`));
  const v = { ...balance(raw), provider, fetchedAt: new Date().toISOString() };
  cache.set(key, { t: Date.now(), v });
  return v;
}

// NewsAPI /v2/everything → common shape. The Developer plan only reaches back ~1 month, so ask for 29 days.
export function parseNewsApi(json) {
  return (json.articles ?? [])
    .filter((a) => a.title && a.url && a.title !== '[Removed]')
    .map((a) => {
      let domain = '';
      try { domain = new URL(a.url).hostname.replace(/^www\./, ''); } catch {}
      return { title: a.title, url: a.url, domain, seendate: (a.publishedAt ?? '').replace(/[-:]/g, '') };
    });
}

async function newsApi(name, extra, apiKey) {
  if (!apiKey) throw new Error('NEWSAPI_KEY is not set');
  const from = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const url = new URL('https://newsapi.org/v2/everything');
  url.search = new URLSearchParams({
    q: `"${name}"${extra ? ` AND (${extra})` : ''}`,
    language: 'en', sortBy: 'publishedAt', pageSize: '100', from,
  });
  const r = await fetch(url, { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(20000) });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.status === 'error') {
    const hint = { apiKeyInvalid: 'NewsAPI key is invalid', apiKeyMissing: 'NewsAPI key missing', rateLimited: 'NewsAPI daily limit reached (free plan: 100 requests/day)', maximumResultsReached: 'NewsAPI result limit reached' }[json.code];
    throw new Error(hint ?? `NewsAPI ${r.status}: ${json.message ?? 'request failed'}`);
  }
  return parseNewsApi(json);
}

const decode = (t) => t.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Parses Google News RSS into the same shape GDELT articles use ({title,url,domain,seendate}).
export function parseGoogleRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const get = (tag) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1];
    const src = item.match(/<source url="([^"]+)"/)?.[1];
    const pub = get('pubDate');
    let title = decode(get('title') ?? '');
    const publisher = decode(get('source') ?? '');
    if (publisher && title.endsWith(` - ${publisher}`)) title = title.slice(0, -(publisher.length + 3));
    return {
      title,
      url: decode(get('link') ?? ''),
      domain: src ? new URL(src).hostname.replace(/^www\./, '') : '',
      seendate: pub ? new Date(pub).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') : '',
    };
  });
}

async function googleNews(name) {
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${name}" when:30d`)}&hl=en-US&gl=US&ceid=US:en`, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Google News RSS ${r.status}`);
  return parseGoogleRss(await r.text());
}

// ───────────── Outlet mode: news from specific outlets (default: Reuters, AP, Fox News, CNN) ─────────────
export const OUTLETS = [
  { id: 'reuters', label: 'Reuters', domain: 'reuters.com' },
  { id: 'ap', label: 'AP', domain: 'apnews.com' },
  { id: 'fox', label: 'Fox News', domain: 'foxnews.com' },
  { id: 'cnn', label: 'CNN', domain: 'cnn.com' },
];
const MIN_PER_OUTLET = 3;

// Disambiguates common names (e.g. Senator Susan Collins vs. Fed president Susan Collins) by requiring state/office words.
export function contextTerms(state, office) {
  const words = [STATE_NAMES[state], ...({ Senate: ['Senate', 'senator'], Governor: ['governor', 'gubernatorial'], House: ['Congress', 'congressman', 'congresswoman', 'House'] }[office] ?? [])].filter(Boolean);
  return words.length ? `(${words.map((w) => (w.includes(' ') ? `"${w}"` : w)).join(' OR ')})` : '';
}

// Up to `total` articles: `perOutlet` from each outlet first (newest first), then fill with the newest leftovers.
export function pickByOutlet(articles, outlets = OUTLETS, perOutlet = 3, total = 10) {
  const seen = new Set();
  const groups = Object.fromEntries(outlets.map((o) => [o.id, []]));
  for (const a of [...articles].sort((x, y) => (y.seendate > x.seendate ? 1 : -1))) {
    const o = outlets.find((x) => a.domain === x.domain || a.domain?.endsWith(`.${x.domain}`));
    const key = a.title?.toLowerCase().slice(0, 60);
    if (!o || !key || seen.has(key)) continue;
    seen.add(key);
    groups[o.id].push({ title: a.title, url: a.url, domain: o.domain, date: a.seendate, outlet: o.label, bias: biasOf(o.domain) });
  }
  const picked = outlets.flatMap((o) => groups[o.id].slice(0, perOutlet));
  const rest = outlets.flatMap((o) => groups[o.id].slice(perOutlet)).sort((x, y) => (y.date > x.date ? 1 : -1));
  picked.push(...rest.slice(0, Math.max(0, total - picked.length)));
  picked.sort((x, y) => outlets.findIndex((o) => o.label === x.outlet) - outlets.findIndex((o) => o.label === y.outlet) || (y.date > x.date ? 1 : -1));
  return { articles: picked, available: Object.fromEntries(outlets.map((o) => [o.id, groups[o.id].length])) };
}

async function newsApiDomains(name, domains, apiKey, ctx = '') {
  if (!apiKey) throw new Error('NEWSAPI_KEY is not set');
  const from = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const url = new URL('https://newsapi.org/v2/everything');
  url.search = new URLSearchParams({ q: `"${name}"${ctx ? ` AND ${ctx}` : ''}`, language: 'en', sortBy: 'publishedAt', pageSize: '100', from, domains: domains.join(',') });
  const r = await fetch(url, { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(20000) });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.status === 'error') throw new Error(json.code === 'apiKeyInvalid' ? 'NewsAPI key is invalid' : json.code === 'rateLimited' ? 'NewsAPI daily limit reached (free plan: 100 requests/day)' : `NewsAPI ${r.status}: ${json.message ?? 'request failed'}`);
  return parseNewsApi(json);
}

async function googleNewsSite(name, domain, ctx = '') {
  const q = `"${name}" ${ctx} site:${domain} when:30d`.replace(/\s+/g, ' ');
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Google News RSS ${r.status}`);
  return onlyAbout(name, parseGoogleRss(await r.text()));
}

// Google's site: search is loose (it returned 100 unrelated items per outlet), so keep only headlines that name the candidate.
export function onlyAbout(name, articles) {
  const last = name.replace(/\b(jr|sr|ii|iii|iv)\.?$/i, '').trim().split(/\s+/).pop().toLowerCase();
  const re = new RegExp(`\\b${last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return articles.filter((a) => re.test(a.title ?? ''));
}

// opts: { newsApiKey?, supplement? }  supplement==='googlenews' fills outlets that NewsAPI has too little of
// (NewsAPI carries no Reuters and almost no AP). Google limits that feed to personal, non-commercial use.
export async function getOutletNews(name, opts = {}, outlets = OUTLETS) {
  const ctx = contextTerms(opts.state, opts.office);
  const apiKey = opts.newsApiKey ?? process.env.NEWSAPI_KEY;
  const supplement = (opts.supplement ?? process.env.NEWS_SUPPLEMENT ?? '').toLowerCase() === 'googlenews';
  const key = `outlets|${outlets.map((o) => o.id)}|${supplement}|${name}|${ctx}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL.newsapi) return hit.v;

  let raw = [];
  const notes = [];
  if (apiKey) raw = await newsApiDomains(name, outlets.map((o) => o.domain), apiKey, ctx);
  const count = (o) => raw.filter((a) => a.domain === o.domain || a.domain?.endsWith(`.${o.domain}`)).length;
  const thin = outlets.filter((o) => count(o) < MIN_PER_OUTLET);
  const supplemented = [];
  if (thin.length && supplement) {
    for (const o of thin) {
      try { raw.push(...(await googleNewsSite(name, o.domain, ctx))); supplemented.push(o.label); }
      catch (e) { notes.push(`${o.label}: Google News lookup failed (${e.message})`); }
    }
  } else if (!apiKey) {
    notes.push('Live news search is not enabled on this deployment.');
  } else if (thin.length) {
    for (const o of thin) notes.push(`${o.label}: only ${count(o)} article(s) found in the news index.`);
  }
  const v = { mode: 'outlets', ...pickByOutlet(raw, outlets), supplemented, notes, provider: apiKey ? 'newsapi' : 'none', fetchedAt: new Date().toISOString() };
  cache.set(key, { t: Date.now(), v });
  return v;
}
