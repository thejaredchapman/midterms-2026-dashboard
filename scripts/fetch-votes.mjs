// Scans official roll-call XML (no API key) for the votes this app cares about and stores per-member positions.
//   House:  https://clerk.house.gov/evs/{year}/roll{NNN}.xml
//   Senate: https://www.senate.gov/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{NNNNN}.xml
// Output: scripts/cache/votes.json  → { [topic]: { meta, house: {bioguide: 'Yea'|'Nay'|...}, senate: {...} } }
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = new URL('./cache/votes.json', import.meta.url);
const UA = { 'User-Agent': 'midterms-2026-dashboard/1.0 (personal project)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = async (url) => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (r.status === 404) return null;
      if (r.ok) return await r.text();
    } catch {}
    await sleep(800 * (i + 1));
  }
  return null;
};
const pool = async (items, n, fn) => {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
};

const tag = (x, t) => x.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1]?.trim();

function parseHouse(xml) {
  const votes = {};
  for (const m of xml.matchAll(/<recorded-vote><legislator name-id="([A-Z]\d+)"[^>]*>[^<]*<\/legislator><vote>([^<]+)<\/vote>/g)) votes[m[1]] = m[2];
  return { desc: [tag(xml, 'legis-num'), tag(xml, 'vote-question'), tag(xml, 'vote-desc')].join(' | '), date: tag(xml, 'action-date'), votes };
}
function parseSenate(xml) {
  const votes = {};
  for (const m of xml.matchAll(/<member>([\s\S]*?)<\/member>/g)) {
    const id = tag(m[1], 'lis_member_id');
    votes[`${tag(m[1], 'last_name')}|${tag(m[1], 'state')}`] = tag(m[1], 'vote_cast');
    void id;
  }
  return { desc: [tag(xml, 'document_name'), tag(xml, 'vote_question_text') ?? tag(xml, 'question'), tag(xml, 'vote_title')].join(' | '), date: tag(xml, 'vote_date'), votes };
}

const pad = (n, w) => String(n).padStart(w, '0');

// ── House: scan every 2026 roll + the 2025 rolls around Nov 18 (Epstein) and Jul 3 (OBBB) ──
const houseTargets = [
  ...Array.from({ length: 20 }, (_, i) => ['2025', 190 + i - 10]), // OBBB neighbourhood (roll 190 confirmed)
  ...Array.from({ length: 80 }, (_, i) => ['2025', 260 + i]),       // Epstein neighbourhood
  ...Array.from({ length: 700 }, (_, i) => ['2026', 1 + i]),
];
const houseHits = [];
await pool(houseTargets, 8, async ([year, n]) => {
  const xml = await text(`https://clerk.house.gov/evs/${year}/roll${pad(n, 3)}.xml`);
  if (!xml) return;
  const p = parseHouse(xml);
  const d = p.desc.toLowerCase();
  if (/h r 1 \||big beautiful|h r 4405|epstein|war powers|h con res|h j res|iran/.test(d)) houseHits.push({ year, n, ...p });
});
// ── Senate: 2025 s1 (OBBB = 372) and 2026 s2 scan for war powers ──
const senateHits = [];
const senateTargets = [['1', 372], ...Array.from({ length: 450 }, (_, i) => ['2', 1 + i])];
await pool(senateTargets, 6, async ([sess, n]) => {
  const xml = await text(`https://www.senate.gov/legislative/LIS/roll_call_votes/vote119${sess}/vote_119_${sess}_${pad(n, 5)}.xml`);
  if (!xml) return;
  const p = parseSenate(xml);
  if (/h\.r\. 1\b|war powers|s\.j\.res|iran|epstein/i.test(p.desc)) senateHits.push({ session: sess, n, ...p });
});

await mkdir(new URL('./cache/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify({ house: houseHits.sort((a, b) => a.year.localeCompare(b.year) || a.n - b.n), senate: senateHits.sort((a, b) => a.session.localeCompare(b.session) || a.n - b.n) }));
for (const h of houseHits) console.log('HOUSE', h.year, h.n, h.date, '|', h.desc.slice(0, 110), '|', Object.keys(h.votes).length);
for (const h of senateHits) console.log('SENATE', h.session, h.n, h.date, '|', h.desc.slice(0, 110), '|', Object.keys(h.votes).length);
