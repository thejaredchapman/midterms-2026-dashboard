import { describe, it, expect } from 'vitest';
import { filterCandidates, sortCandidates, summarizeSet, nameMatchesFirst } from './filter.js';

const data = [
  { id: 1, name: 'Susan Collins', office: 'Senate', state: 'ME', party: 'R', rating: 'Toss-up', race: 'Maine', trump: null, medicaidCuts: false, medicalFundingCuts: false, antiDei: null, iran: 'Voted YES on war powers', distancing: 'Yes — skipping convention' },
  { id: 2, name: 'Ken Paxton', office: 'Senate', state: 'TX', party: 'R', rating: 'Toss-up', race: 'Texas', trump: true, medicaidCuts: null, medicalFundingCuts: null, antiDei: true },
  { id: 3, name: 'Adam Gray', office: 'House', state: 'CA', district: '13', party: 'D', rating: 'Toss-up', race: 'CA-13', trump: false, medicaidCuts: false, medicalFundingCuts: false, antiDei: null },
  { id: 4, name: 'Greg Abbott', office: 'Governor', state: 'TX', party: 'R', rating: 'Lean R', race: 'Texas', trump: true, medicaidCuts: null, medicalFundingCuts: null, antiDei: null },
  { id: 5, name: 'Tom Barrett', office: 'House', state: 'MI', party: 'R', rating: null, race: 'MI-07', trump: null, medicaidCuts: true, medicalFundingCuts: true, antiDei: null },
];

describe('filterCandidates', () => {
  it('searches across name, state and text fields, all terms must match', () => {
    expect(filterCandidates(data, { query: 'collins' }).map((c) => c.id)).toEqual([1]);
    expect(filterCandidates(data, { query: 'texas republican' }).map((c) => c.id)).toEqual([2, 4]);
    expect(filterCandidates(data, { query: 'war powers' }).map((c) => c.id)).toEqual([1]);
    expect(filterCandidates(data, { query: 'nonexistent' })).toEqual([]);
  });
  it('filters by party, office, rating', () => {
    expect(filterCandidates(data, { party: 'D' }).map((c) => c.id)).toEqual([3]);
    expect(filterCandidates(data, { office: 'Governor' }).map((c) => c.id)).toEqual([4]);
    expect(filterCandidates(data, { rating: 'Toss-up' }).map((c) => c.id)).toEqual([1, 2, 3]);
  });
  it('treats tri-state flags correctly (yes / no / unverified)', () => {
    expect(filterCandidates(data, { trump: 'yes' }).map((c) => c.id)).toEqual([2, 4]);
    expect(filterCandidates(data, { trump: 'unverified' }).map((c) => c.id)).toEqual([1, 5]);
    expect(filterCandidates(data, { medicaid: 'yes' }).map((c) => c.id)).toEqual([5]);
    expect(filterCandidates(data, { medicaid: 'no' }).map((c) => c.id)).toEqual([1, 3]);
    expect(filterCandidates(data, { dei: 'yes' }).map((c) => c.id)).toEqual([2]);
  });
  it('combines filters with AND', () => {
    expect(filterCandidates(data, { party: 'R', trump: 'yes', office: 'Senate' }).map((c) => c.id)).toEqual([2]);
  });
});

describe('sortCandidates', () => {
  it('sorts by rating competitiveness with unrated last in both directions', () => {
    // ties within a rating fall back to name order: Adam Gray, Ken Paxton, Susan Collins
    expect(sortCandidates(data, 'rating', 'asc').map((c) => c.id)).toEqual([3, 2, 1, 4, 5]);
    expect(sortCandidates(data, 'rating', 'desc').at(-1).id).toBe(5);
  });
  it('sorts by office order Senate > Governor > House', () => {
    expect(sortCandidates(data, 'office').map((c) => c.office)).toEqual(['Senate', 'Senate', 'Governor', 'House', 'House']);
  });
  it('does not mutate input', () => {
    const copy = [...data];
    sortCandidates(data, 'name', 'desc');
    expect(data).toEqual(copy);
  });
});

describe('summarizeSet', () => {
  it('counts offices, parties, endorsements', () => {
    const s = summarizeSet(data);
    expect(s.total).toBe(5);
    expect(s.byOffice).toEqual({ Senate: 2, Governor: 1, House: 2 });
    expect(s.trumpEndorsed).toBe(2);
    expect(s.byRating['Toss-up']).toBe(3);
    expect(s.byRating.Unrated).toBe(1);
    expect(s.distancing).toBe(1);
  });
});

describe('nameMatchesFirst', () => {
  it('ranks name matches above text-only matches, keeping order otherwise', () => {
    const list = [{ name: 'Dan Sullivan', iran: 'Collins crossed over' }, { name: 'Susan Collins' }];
    expect(nameMatchesFirst(list, 'collins').map((c) => c.name)).toEqual(['Susan Collins', 'Dan Sullivan']);
    expect(nameMatchesFirst(list, '')).toBe(list);
  });
});
