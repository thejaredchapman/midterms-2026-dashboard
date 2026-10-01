// Pure search / filter / sort logic for the candidate matrix.

const TEXT_FIELDS = ['name', 'state', 'district', 'race', 'office', 'party', 'status', 'rating', 'iran', 'epstein', 'distancing', 'strategy', 'dataCenters', 'polling'];

export const PARTY_LABEL = { R: 'Republican', D: 'Democratic', I: 'Independent' };

const haystack = (c) => TEXT_FIELDS.map((f) => c[f] ?? '').join(' ').concat(' ', PARTY_LABEL[c.party] ?? '').toLowerCase();

// tri-state flags: true | false | null (unverified)
const triMatch = (value, want) => {
  if (!want || want === 'any') return true;
  if (want === 'yes') return value === true;
  if (want === 'no') return value === false;
  if (want === 'unverified') return value == null;
  return true;
};

export function filterCandidates(list, f = {}) {
  const terms = (f.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((c) => {
    if (terms.length) {
      const h = haystack(c);
      if (!terms.every((t) => h.includes(t))) return false;
    }
    if (f.party && f.party !== 'all' && c.party !== f.party) return false;
    if (f.office && f.office !== 'all' && c.office !== f.office) return false;
    if (f.rating && f.rating !== 'all' && c.rating !== f.rating) return false;
    return (
      triMatch(c.trump, f.trump) &&
      triMatch(c.medicaidCuts, f.medicaid) &&
      triMatch(c.medicalFundingCuts, f.medical) &&
      triMatch(c.antiDei, f.dei)
    );
  });
}

const RATING_ORDER = ['Toss-up', 'Lean D', 'Lean R', 'Likely D', 'Likely R', 'Safe D', 'Safe R'];
const OFFICE_ORDER = { Senate: 0, Governor: 1, House: 2 };

export function sortCandidates(list, key = 'race', dir = 'asc') {
  const val = (c) => {
    if (key === 'rating') return c.rating ? RATING_ORDER.indexOf(c.rating) : null;
    if (key === 'office') return OFFICE_ORDER[c.office] ?? 9;
    const v = c[key];
    return typeof v === 'boolean' ? Number(v) : (v ?? '');
  };
  const sign = dir === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const x = val(a), y = val(b);
    const nullX = x === '' || x == null, nullY = y === '' || y == null;
    if (nullX !== nullY) return nullX ? 1 : -1; // blanks always last
    return (x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name)) * sign;
  });
}

export function summarizeSet(list) {
  const count = (fn) => list.filter(fn).length;
  const byRating = {};
  for (const c of list) byRating[c.rating ?? 'Unrated'] = (byRating[c.rating ?? 'Unrated'] ?? 0) + 1;
  return {
    total: list.length,
    byOffice: { Senate: count((c) => c.office === 'Senate'), Governor: count((c) => c.office === 'Governor'), House: count((c) => c.office === 'House') },
    byParty: { R: count((c) => c.party === 'R'), D: count((c) => c.party === 'D'), I: count((c) => c.party === 'I') },
    byRating,
    trumpEndorsed: count((c) => c.trump === true),
    votedObbb: count((c) => c.votedObbb === true),
    votedAgainstObbb: count((c) => c.votedObbb === false),
    distancing: count((c) => /^yes|^partial/i.test(c.distancing ?? '')),
  };
}

// When searching, candidates whose own name matches come first (stable), so "collins" lists Susan Collins
// above anyone whose profile text merely mentions her.
export function nameMatchesFirst(list, query = '') {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return list;
  const hit = (c) => terms.every((t) => c.name.toLowerCase().includes(t));
  return [...list.filter(hit), ...list.filter((c) => !hit(c))];
}
