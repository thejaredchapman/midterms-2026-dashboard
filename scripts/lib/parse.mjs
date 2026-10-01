// Pure parsers for Wikipedia wikitext of the 2026 election pages. No network here, so they are unit-testable.

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
export const STATE_BY_NAME = Object.fromEntries(Object.entries(STATES).map(([k, v]) => [v, k]));

export const partyCode = (raw = '') => {
  const p = raw.toLowerCase();
  if (p.includes('republican')) return 'R';
  if (p.includes('democrat')) return 'D';
  if (p.includes('libertarian')) return 'L';
  if (p.includes('green')) return 'G';
  return 'I';
};

const clean = (s = '') => s.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, '').replace(/\{\{efn[\s\S]*?\}\}\}?/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();

// "[[Page|Shown]]" | "[[Page]]" | "Plain" → { name, wiki }
export function parseLink(s = '') {
  const m = s.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (m) return { wiki: m[1].trim().replace(/ /g, '_'), name: (m[2] ?? m[1]).replace(/\s*\([^)]*\)$/, '').trim() };
  return { wiki: null, name: s.replace(/\{\{[^}]*\}\}|<[^>]+>|''+/g, '').replace(/\s*\([^)]*\)\s*$/, '').trim() };
}

// "Likely|R", "Tossup", "Solid|D", "Lean|D|flip"  →  "Likely R" | "Toss-up" | "Safe D" | "Lean D"
export function parseRating(cell = '') {
  const m = cell.match(/USRaceRating\|([A-Za-z]+)(?:\|([RDI]))?/i);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  if (kind === 'tossup') return 'Toss-up';
  const side = (m[2] ?? '').toUpperCase();
  const label = { solid: 'Safe', safe: 'Safe', likely: 'Likely', lean: 'Lean', tilt: 'Tilt' }[kind] ?? m[1];
  return side ? `${label} ${side}` : label;
}

const pvi = (s) => {
  const m = s.match(/shading PVI\|([RD])\|(\d+)/i);
  if (m) return `${m[1].toUpperCase()}+${m[2]}`;
  return /shading PVI\|EVEN/i.test(s) ? 'EVEN' : null;
};

// ── House: one row per district in the national page ──
export function parseHouseDistricts(wikitext) {
  const start = wikitext.search(/^==\s*Alabama\s*==/m);
  const body = start >= 0 ? wikitext.slice(start) : wikitext;
  const re = /\n\|-[^\n]*\n!(?:[^\n{|]*\|)?\s*\{\{ushr\|([A-Z]{2})\|(\w+)\|[^}]*\}\}/g;
  const marks = [...body.matchAll(re)];
  return marks.map((m, i) => {
    const row = body.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : undefined);
    const incumbent = row.match(/\{\{sortname\|([^|}]+)\|([^|}]+)/);
    const cells = row.split('\n').filter((l) => /^\|(?!-)/.test(l));
    const status = clean((cells.find((c) => /incumbent|open seat|vacant|retiring|seeking|lost|resign|withdrew|defeated/i.test(c.replace(/\{\{sortname[^}]*\}\}/, ''))) ?? '').replace(/^\|\s*(style="[^"]*"\s*\|)?\s*/, ''));
    const candidates = [...row.matchAll(/^\*\s*\{\{Party stripe\|[^}]*\}\}\s*(.+)$/gm)].map(([, rest]) => {
      const party = rest.match(/\(([^)]*)\)\s*(?:''.*)?$/)?.[1] ?? '';
      const { name, wiki } = parseLink(rest.replace(/\s*\([^)]*\)\s*(?:''.*)?$/, ''));
      return { name, wiki, party: partyCode(party), partyRaw: party };
    }).filter((c) => c.name);
    return {
      state: m[1], district: /^\d+$/.test(m[2]) ? String(Number(m[2])).padStart(2, '0') : '00',
      pvi: pvi(row), incumbentName: incumbent ? `${incumbent[1].trim()} ${incumbent[2].trim()}` : null, status, candidates,
    };
  });
}

// ── House ratings page → Map("PA-07" → "Toss-up") using the first (Cook) column ──
export function parseHouseRatings(wikitext) {
  const out = new Map();
  const re = /\n\|-[^\n]*\n!(?:[^\n{|]*\|)?\s*\{\{ushr\|([A-Z]{2})\|(\w+)\|[^}]*\}\}/g;
  const marks = [...wikitext.matchAll(re)];
  marks.forEach((m, i) => {
    const row = wikitext.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : undefined);
    const rating = parseRating(row);
    if (rating) out.set(`${m[1]}-${/^\d+$/.test(m[2]) ? String(Number(m[2])).padStart(2, '0') : '00'}`, rating);
  });
  return out;
}

// ── Senate / Governor: rating table rows (state → Cook rating, PVI) ──
export function parseStateRatings(wikitext) {
  const out = new Map();
  // Rows look like:  ! [[2026 United States Senate election in Alabama|Alabama]]   or   ! [[2026 Alabama gubernatorial election|Alabama]]
  const re = /\n\|-[^\n]*\n!\s*\[\[2026 [^\]|]*election[^\]|]*\|([^\]]+)\]\]/g;
  const marks = [...wikitext.matchAll(re)];
  marks.forEach((m, i) => {
    const row = wikitext.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : undefined);
    const key = m[1].trim();
    const next = { rating: parseRating(row), pvi: pvi(row) };
    const prev = out.get(key);
    // The page repeats state rows in other tables without ratings — never let those overwrite a real rating.
    out.set(key, { rating: prev?.rating ?? next.rating, pvi: prev?.pvi ?? next.pvi });
  });
  return out;
}

// ── Senate / Governor: "== State ==" sections with an {{Infobox election}} listing nominees ──
export function parseStateSections(wikitext, { from, to }) {
  const a = wikitext.search(from), b = wikitext.search(to);
  const body = wikitext.slice(a >= 0 ? a : 0, b > a ? b : undefined);
  const heads = [...body.matchAll(/^==\s*([^=\n]+?)\s*==\s*$/gm)];
  return heads.map((h, i) => {
    const sec = body.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : undefined);
    const info = sec.match(/\{\{Infobox election[\s\S]*?\n\}\}/i)?.[0] ?? '';
    const field = (k) => info.match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^\\n]*)`))?.[1]?.trim() ?? '';
    const nominees = [];
    for (let n = 1; n <= 8; n++) {
      const raw = field(`nominee${n}`);
      if (!raw) continue;
      const { name, wiki } = parseLink(raw);
      if (name) nominees.push({ name, wiki, party: partyCode(field(`party${n}`)), partyRaw: field(`party${n}`) });
    }
    const before = field('before_election');
    return { section: h[1].trim(), incumbent: before ? parseLink(before) : null, incumbentParty: partyCode(field('before_party')), nominees };
  });
}
