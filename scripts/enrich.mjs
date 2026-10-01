// Merges roster.mjs with free public data → src/data/candidates.json
//   - unitedstates/congress-legislators: bioguide id, photo, official site, social handles (sitting members)
//   - Wikipedia REST: thumbnail photo + page link (everyone)
//   - Wikidata: official website (P856), X/Twitter (P2002), Bluesky (P12361)
// Run: npm run enrich
import { readFile, writeFile } from 'node:fs/promises';
import { roster } from './roster.mjs';

const UA = { 'User-Agent': 'midterms-2026-dashboard/1.0 (personal project)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = async (url, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
      await sleep(1500 * (i + 1)); // 429 / 5xx → back off
    } catch {
      await sleep(1000);
    }
  }
  return null;
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '');
const lastName = (n) => norm(n).split(' ').filter(Boolean).pop();

const [legislators, social] = await Promise.all([
  getJson('https://unitedstates.github.io/congress-legislators/legislators-current.json'),
  getJson('https://unitedstates.github.io/congress-legislators/legislators-social-media.json'),
]);
if (!legislators) throw new Error('Could not download congress-legislators data');

const socialById = new Map((social ?? []).map((s) => [s.id.bioguide, s.social]));

function findMember(c) {
  const type = c.office === 'Senate' ? 'sen' : 'rep';
  return legislators.find((l) => {
    const term = l.terms.at(-1);
    if (term.type !== type || term.state !== c.state) return false;
    if (type === 'rep' && c.district && String(Number(term.district)) !== String(Number(c.district))) return false;
    return lastName(l.name.last) === lastName(c.name) || norm(l.name.official_full ?? '').includes(norm(c.name));
  });
}

// Candidates that are sitting members but running for a different office (e.g. Tiffany → Governor)
function findMemberLoose(c) {
  return legislators.find(
    (l) => l.terms.at(-1).state === c.state && lastName(l.name.last) === lastName(c.name) && norm(l.name.first) === norm(c.name.split(' ')[0]),
  );
}

async function wiki(title) {
  if (!title) return {};
  const [summary, wd] = await Promise.all([
    getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`),
    getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(title)}&props=claims&format=json&origin=*`),
  ]);
  const ent = wd?.entities ? Object.values(wd.entities)[0] : null;
  const claim = (p) => ent?.claims?.[p]?.at(-1)?.mainsnak?.datavalue?.value;
  return {
    photo: isPortrait(summary?.thumbnail?.source) ? summary.thumbnail.source : null,
    wikiUrl: summary?.content_urls?.desktop?.page,
    website: claim('P856'),
    twitter: claim('P2002'),
    bluesky: claim('P12361'),
  };
}

let prev = new Map();
try { prev = new Map(JSON.parse(await readFile(new URL('../src/data/candidates.json', import.meta.url), 'utf8')).map((p) => [p.id, p])); } catch {}
// Wikipedia sometimes returns a seal/logo/flag as the page thumbnail — never use those as a person's photo.
const isPortrait = (u) => u && !/\.svg|Seal_of|Flag_of|Logo|Coat_of_arms|Map_of/i.test(u);
const out = [];
for (const c of roster) {
  const member = findMember(c) ?? findMemberLoose(c);
  const bio = member?.id?.bioguide;
  const term = member?.terms?.at(-1);
  const old = prev.get(c.id);
  const complete = old?.photo && old?.website; // reruns only fill gaps (Wikimedia rate-limits aggressively)
  const w = complete ? {} : await wiki(c.wiki);
  if (!complete) await sleep(1500);
  const soc = bio ? socialById.get(bio) : null;

  const obbbYes = c.obbb === 'yes' ? true : c.obbb === 'no' ? false : null;
  out.push({
    ...c,
    obbb: undefined,
    bioguide: bio ?? null,
    photo: bio ? `https://unitedstates.github.io/images/congress/450x550/${bio}.jpg` : (w.photo ?? prev.get(c.id)?.photo ?? null),
    photoFallback: w.photo ?? prev.get(c.id)?.photoFallback ?? null,
    website: term?.url ?? w.website ?? prev.get(c.id)?.website ?? null,
    wikiUrl: w.wikiUrl ?? (c.wiki ? `https://en.wikipedia.org/wiki/${c.wiki}` : null),
    ballotpedia: `https://ballotpedia.org/${encodeURIComponent(c.name.replaceAll(' ', '_'))}`,
    twitter: soc?.twitter ?? w.twitter ?? prev.get(c.id)?.twitter ?? null,
    bluesky: w.bluesky ?? prev.get(c.id)?.bluesky ?? null,
    // Roll-call-derived flags (null when the person has no relevant vote)
    votedObbb: obbbYes,
    medicaidCuts: obbbYes, // OBBB cuts Medicaid (CBO); see Legislation page for the numbers
    medicalFundingCuts: obbbYes, // OBBB also ends enhanced ACA subsidies/defunds Planned Parenthood for 1 yr
    antiDei: c.antiDei ?? null,
    trump: c.trump ?? null,
  });
  process.stdout.write(`${c.name.padEnd(28)} ${bio ?? '-'.padEnd(8)} photo:${out.at(-1).photo ? 'y' : 'n'} site:${out.at(-1).website ? 'y' : 'n'} tw:${out.at(-1).twitter ?? '-'} bsky:${out.at(-1).bluesky ?? '-'}\n`);
}

await writeFile(new URL('../src/data/candidates.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(`\nWrote ${out.length} candidates`);
