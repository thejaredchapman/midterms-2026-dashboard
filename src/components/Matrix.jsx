import { useMemo, useState } from 'react';
import { filterCandidates, sortCandidates, nameMatchesFirst, PARTY_LABEL } from '../lib/filter.js';
import Avatar from './Avatar.jsx';
import Flag from './Flag.jsx';
import styles from './Matrix.module.css';

const Unv = () => <span className={styles.unv}>Unverified</span>;
const Text = ({ v }) => (v ? <span>{v}</span> : <Unv />);

const COLUMNS = [
  { key: 'name', label: 'Politician & Office', sticky: true },
  { key: 'rating', label: 'Polling & Competitiveness', sortable: true },
  { key: 'trump', label: 'Trump-backed', sortable: true },
  { key: 'medicaidCuts', label: 'Voted for Medicaid cuts (OBBB)', sortable: true },
  { key: 'medicalFundingCuts', label: 'Voted for other medical-funding cuts', sortable: true },
  { key: 'antiDei', label: 'Against DEI', sortable: true },
  { key: 'iran', label: 'Iran war stance & shift' },
  { key: 'epstein', label: 'Epstein files stance & shift' },
  { key: 'distancing', label: 'Distancing from Trump' },
  { key: 'strategy', label: 'Campaign strategy & messaging' },
  { key: 'dataCenters', label: 'Data centers stance & qualifications' },
  { key: 'truthfulness', label: 'Truthfulness %' },
  { key: 'alignment', label: 'Country vs. party' },
  { key: 'links', label: 'Links' },
];

const Links = ({ c }) => (
  <>
    {c.website ? <a href={c.website} target="_blank" rel="noreferrer noopener">Website</a> : <span className={styles.unv}>No site found</span>}
    {c.wikiUrl && <a href={c.wikiUrl} target="_blank" rel="noreferrer noopener">Wikipedia</a>}
    <a href={c.ballotpedia} target="_blank" rel="noreferrer noopener">Ballotpedia</a>
    {c.twitter && <a href={`https://x.com/${c.twitter}`} target="_blank" rel="noreferrer noopener">X</a>}
  </>
);

const DETAILS = [
  ['iran', 'Iran war'], ['epstein', 'Epstein files'], ['distancing', 'Distancing from Trump'],
  ['strategy', 'Campaign strategy'], ['dataCenters', 'Data centers'], ['truthfulness', 'Truthfulness %'], ['alignment', 'Country vs. party'],
];

const Card = ({ c, onSelect }) => (
  <article className={styles.card}>
    <button className={styles.cardHead} onClick={() => onSelect(c)} aria-label={`Open ${c.name} details`}>
      <Avatar c={c} />
      <span className={styles.cardWho}>
        <strong>{c.name}</strong>
        <span className={styles.sub}><span className={styles[`p${c.party}`]}>{PARTY_LABEL[c.party]}</span> · {c.office}{c.district ? ` ${c.state}-${c.district}` : ` · ${c.state}`}</span>
        <span className={styles.sub}>{c.status}</span>
      </span>
      <span className={styles.chev} aria-hidden="true">›</span>
    </button>
    <p className={styles.cardRating}><strong>{c.rating ?? '—'}</strong>{c.polling && <span className={styles.sub}> · {c.polling}</span>}</p>
    <dl className={styles.flags}>
      <div><dt>Trump</dt><dd><Flag value={c.trump} yes="Endorsed" no="Not endorsed" /></dd></div>
      <div><dt>Medicaid cuts</dt><dd><Flag value={c.medicaidCuts} yes="Voted yes" no="Voted no" /></dd></div>
      <div><dt>Other med. cuts</dt><dd><Flag value={c.medicalFundingCuts} yes="Voted yes" no="Voted no" /></dd></div>
      <div><dt>Against DEI</dt><dd><Flag value={c.antiDei} /></dd></div>
    </dl>
    <details className={styles.more}>
      <summary>Positions & stances</summary>
      <dl className={styles.stances}>
        {DETAILS.map(([k, l]) => <div key={k}><dt>{l}</dt><dd><Text v={c[k]} /></dd></div>)}
      </dl>
    </details>
    <div className={styles.cardLinks}><Links c={c} /></div>
  </article>
);

const Select = ({ label, value, onChange, options }) => (
  <label className={styles.sel}>
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);
const TRI = [['any', 'Any'], ['yes', 'Yes'], ['no', 'No'], ['unverified', 'Unverified']];

export default function Matrix({ data, onSelect, initialQuery = '' }) {
  const [f, setF] = useState({ query: initialQuery, party: 'all', office: 'all', rating: 'all', trump: 'any', medicaid: 'any', medical: 'any', dei: 'any' });
  const [sort, setSort] = useState({ key: 'rating', dir: 'asc' });
  const [filtersOpen] = useState(() => window.matchMedia('(min-width: 761px)').matches);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const ratings = useMemo(() => [...new Set(data.map((c) => c.rating).filter(Boolean))], [data]);
  const rows = useMemo(() => nameMatchesFirst(sortCandidates(filterCandidates(data, f), sort.key, sort.dir), f.query), [data, f, sort]);
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const anyFilter = Object.entries(f).some(([k, v]) => v && v !== 'all' && v !== 'any');

  return (
    <section aria-label="Candidate matrix">
      <div className={styles.controls}>
        <input
          className={styles.search} type="search" value={f.query} onChange={(e) => set('query')(e.target.value)}
          placeholder="Search name, state, race, stance, party…" aria-label="Search candidates"
        />
        <details className={styles.filterBox} open={filtersOpen}>
        <summary>Filters{anyFilter ? ' (active)' : ''}</summary>
        <div className={styles.filters}>
          <Select label="Office" value={f.office} onChange={set('office')} options={[['all', 'All'], ['Senate', 'Senate'], ['Governor', 'Governor'], ['House', 'House']]} />
          <Select label="Party" value={f.party} onChange={set('party')} options={[['all', 'All'], ['R', 'Republican'], ['D', 'Democratic'], ['I', 'Independent']]} />
          <Select label="Rating" value={f.rating} onChange={set('rating')} options={[['all', 'All'], ...ratings.map((r) => [r, r])]} />
          <Select label="Trump-backed" value={f.trump} onChange={set('trump')} options={TRI} />
          <Select label="Medicaid cuts" value={f.medicaid} onChange={set('medicaid')} options={TRI} />
          <Select label="Medical-funding cuts" value={f.medical} onChange={set('medical')} options={TRI} />
          <Select label="Against DEI" value={f.dei} onChange={set('dei')} options={TRI} />
          {anyFilter && <button className={styles.clear} onClick={() => setF({ query: '', party: 'all', office: 'all', rating: 'all', trump: 'any', medicaid: 'any', medical: 'any', dei: 'any' })}>Clear</button>}
        </div>
        </details>
        <p className={styles.count} role="status">{rows.length} of {data.length} candidates · tap a candidate for news, posts & summaries</p>
      </div>

      <div className={styles.cards}>
        {rows.map((c) => <Card key={c.id} c={c} onSelect={onSelect} />)}
        {!rows.length && <p className={styles.empty}>No candidates match these filters.</p>}
      </div>

      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={c.sticky ? styles.sticky : ''} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortable ? (
                    <button onClick={() => toggleSort(c.key)}>{c.label}{sort.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(c)}>
                <td className={styles.sticky}>
                  <div className={styles.who}>
                    <Avatar c={c} />
                    <div>
                      <strong>{c.name}</strong>
                      <div className={styles.sub}><span className={styles[`p${c.party}`]}>{PARTY_LABEL[c.party]}</span> · {c.office}{c.district ? ` ${c.state}-${c.district}` : ` · ${c.state}`}</div>
                      <div className={styles.sub}>{c.status}</div>
                    </div>
                  </div>
                </td>
                <td><strong>{c.rating ?? '—'}</strong><div className={styles.sub}>{c.polling ?? ''}</div></td>
                <td><Flag value={c.trump} yes="Endorsed" no="Not endorsed" /></td>
                <td><Flag value={c.medicaidCuts} yes="Voted yes" no="Voted no" /></td>
                <td><Flag value={c.medicalFundingCuts} yes="Voted yes" no="Voted no" /></td>
                <td><Flag value={c.antiDei} /></td>
                <td className={styles.long}><Text v={c.iran} /></td>
                <td className={styles.long}><Text v={c.epstein} /></td>
                <td className={styles.long}><Text v={c.distancing} /></td>
                <td className={styles.long}><Text v={c.strategy} /></td>
                <td className={styles.long}><Text v={c.dataCenters} /></td>
                <td><Text v={c.truthfulness} /></td>
                <td><Text v={c.alignment} /></td>
                <td className={styles.links} onClick={(e) => e.stopPropagation()}>
                  <Links c={c} />
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={COLUMNS.length} className={styles.empty}>No candidates match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
