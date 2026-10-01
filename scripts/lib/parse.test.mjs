import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHouseDistricts, parseHouseRatings, parseStateRatings, parseStateSections, parseRating, parseLink, partyCode } from './parse.mjs';

const cache = (f) => readFileSync(new URL(`../cache/${f}`, import.meta.url), 'utf8');

describe('small helpers', () => {
  it('parseRating normalizes Wikipedia rating templates', () => {
    expect(parseRating('{{USRaceRating|Solid|R}}')).toBe('Safe R');
    expect(parseRating('{{USRaceRating|Tossup}}')).toBe('Toss-up');
    expect(parseRating('{{USRaceRating|Lean|D|flip}}')).toBe('Lean D');
    expect(parseRating('nothing')).toBeNull();
  });
  it('parseLink handles piped, plain and disambiguated links', () => {
    expect(parseLink('[[Brian Fitzpatrick (American politician)|Brian Fitzpatrick]]')).toEqual({ wiki: 'Brian_Fitzpatrick_(American_politician)', name: 'Brian Fitzpatrick' });
    expect(parseLink('Bob Harvie')).toEqual({ wiki: null, name: 'Bob Harvie' });
  });
  it('partyCode maps names', () => {
    expect(['Republican Party (United States)', 'Democratic Party (United States)', 'Libertarian', 'Independent'].map(partyCode)).toEqual(['R', 'D', 'L', 'I']);
  });
});

describe('real cached Wikipedia pages', () => {
  it('finds every House seat (435 + non-voting delegates excluded)', () => {
    const rows = parseHouseDistricts(cache('2026_United_States_House_of_Representatives_elections.wikitext'));
    const keys = new Set(rows.map((r) => `${r.state}-${r.district}`));
    expect(keys.size).toBeGreaterThanOrEqual(430);
    const pa1 = rows.find((r) => r.state === 'PA' && r.district === '01');
    expect(pa1.candidates.map((c) => c.name)).toEqual(['Brian Fitzpatrick', 'Bob Harvie']);
    expect(pa1.candidates.map((c) => c.party)).toEqual(['R', 'D']);
    expect(pa1.pvi).toBe('D+1');
  });
  it('reads Cook House ratings for competitive districts', () => {
    const m = parseHouseRatings(cache('house_ratings.wikitext'));
    expect(m.size).toBeGreaterThan(100);
    expect(m.get('PA-07')).toBe('Toss-up');
  });
  it('reads Senate ratings and nominees', () => {
    const wt = cache('2026_United_States_Senate_elections.wikitext');
    const ratings = parseStateRatings(wt);
    expect(ratings.get('Alabama').rating).toBe('Safe R');
    expect(ratings.get('Alaska').rating).toBe('Toss-up');
    const secs = parseStateSections(wt, { from: /^==\s*Alabama\s*==/m, to: /^==\s*See also/m });
    const tx = secs.find((s) => s.section === 'Texas');
    const gov = parseStateRatings(cache('2026_United_States_gubernatorial_elections.wikitext'));
    expect(gov.get('Alabama').rating).toBe('Safe R');
    expect(gov.get('Alaska').rating).toBe('Toss-up');
    expect(tx.nominees.map((n) => n.name)).toEqual(['Ken Paxton', 'James Talarico']);
  });
});
