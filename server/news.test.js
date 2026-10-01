import { describe, it, expect } from 'vitest';
import { balance, parseGoogleRss, parseNewsApi, pickProvider, pickByOutlet, onlyAbout, contextTerms } from './news.js';
import { biasOf } from './outlets.js';

const art = (domain, n, date = '20260930T120000Z') => ({ domain, url: `https://${domain}/${n}`, title: `Story ${domain} ${n}`, seendate: date });

describe('biasOf', () => {
  it('maps known domains and subdomains, drops unknown ones', () => {
    expect(biasOf('www.foxnews.com')).toBe('right');
    expect(biasOf('edition.cnn.com')).toBe('left');
    expect(biasOf('reuters.com')).toBe('center');
    expect(biasOf('random-blog.example')).toBeNull();
  });
});

describe('balance', () => {
  it('picks 3 per bucket then fills to 10 with leftovers', () => {
    const list = [
      ...[1, 2, 3, 4, 5].map((n) => art('cnn.com', n)),
      ...[1, 2, 3, 4].map((n) => art('reuters.com', n)),
      ...[1, 2, 3, 4].map((n) => art('foxnews.com', n)),
    ];
    const { articles, available } = balance(list);
    expect(articles).toHaveLength(10);
    expect(available).toEqual({ left: 5, center: 4, right: 4 });
    for (const b of ['left', 'center', 'right']) expect(articles.filter((a) => a.bias === b).length).toBeGreaterThanOrEqual(3);
  });
  it('does not pad a missing bucket with other leans', () => {
    const { articles, available } = balance([art('cnn.com', 1), art('reuters.com', 1)]);
    expect(available.right).toBe(0);
    expect(articles.some((a) => a.bias === 'right')).toBe(false);
    expect(articles).toHaveLength(2);
  });
  it('skips unknown outlets and duplicate headlines', () => {
    const dup = art('cnn.com', 1);
    const { articles } = balance([dup, { ...dup, url: 'https://cnn.com/other' }, art('mystery.example', 1)]);
    expect(articles).toHaveLength(1);
  });
});

describe('parseGoogleRss', () => {
  it('extracts title (minus publisher suffix), link, source domain and date', () => {
    const xml = `<rss><channel><item><title>Collins faces tough race - Reuters</title><link>https://news.google.com/rss/articles/abc</link>
      <pubDate>Tue, 22 Sep 2026 07:00:00 GMT</pubDate><source url="https://www.reuters.com">Reuters</source></item></channel></rss>`;
    const [a] = parseGoogleRss(xml);
    expect(a).toEqual({ title: 'Collins faces tough race', url: 'https://news.google.com/rss/articles/abc', domain: 'reuters.com', seendate: '20260922T070000Z' });
    expect(biasOf(a.domain)).toBe('center');
  });
});

describe('NewsAPI provider', () => {
  it('maps /v2/everything articles to the common shape and drops removed items', () => {
    const out = parseNewsApi({ status: 'ok', articles: [
      { title: 'Collins leads in poll', url: 'https://www.reuters.com/a/1', publishedAt: '2026-09-30T12:00:00Z', source: { name: 'Reuters' } },
      { title: '[Removed]', url: 'https://removed.com', publishedAt: '2026-09-30T12:00:00Z' },
    ] });
    expect(out).toEqual([{ title: 'Collins leads in poll', url: 'https://www.reuters.com/a/1', domain: 'reuters.com', seendate: '20260930T120000Z' }]);
    expect(biasOf(out[0].domain)).toBe('center');
  });
  it('selects newsapi automatically when a key is present, else gdelt; explicit provider wins', () => {
    expect(pickProvider({ newsApiKey: 'k' })).toBe('newsapi');
    expect(pickProvider({})).toBe('gdelt');
    expect(pickProvider({ provider: 'GoogleNews', newsApiKey: 'k' })).toBe('googlenews');
  });
});

describe('pickByOutlet', () => {
  const mk = (domain, n, d = '20260930T120000Z') => ({ domain, url: `https://${domain}/${n}`, title: `${domain} story ${n}`, seendate: d });
  it('takes up to 3 per outlet, fills to 10, labels outlet + bias, ignores other outlets', () => {
    const list = [
      ...[1, 2, 3, 4, 5].map((n) => mk('foxnews.com', n)), ...[1, 2, 3, 4].map((n) => mk('cnn.com', n)),
      mk('reuters.com', 1), mk('apnews.com', 1), mk('nytimes.com', 1),
    ];
    const { articles, available } = pickByOutlet(list);
    expect(articles).toHaveLength(10);
    expect(available).toEqual({ reuters: 1, ap: 1, fox: 5, cnn: 4 });
    expect(articles.every((a) => ['Reuters', 'AP', 'Fox News', 'CNN'].includes(a.outlet))).toBe(true);
    expect(articles.find((a) => a.outlet === 'Reuters').bias).toBe('center');
    expect(articles.find((a) => a.outlet === 'CNN').bias).toBe('left');
    expect(articles.find((a) => a.outlet === 'Fox News').bias).toBe('right');
  });
  it('matches subdomains (us.cnn.com) and never invents articles for empty outlets', () => {
    const { articles, available } = pickByOutlet([mk('us.cnn.com', 1)]);
    expect(articles).toHaveLength(1);
    expect(available.reuters).toBe(0);
  });
});

describe('onlyAbout', () => {
  it('keeps headlines naming the candidate surname and drops unrelated ones', () => {
    const list = [{ title: 'Collins leads Jackson in new Maine poll' }, { title: 'Liberty to host the Lynx on Tuesday' }, { title: 'Collinsville council votes' }];
    expect(onlyAbout('Susan Collins', list).map((a) => a.title)).toEqual(['Collins leads Jackson in new Maine poll']);
    expect(onlyAbout('Thomas Kean Jr.', [{ title: 'Kean defends NJ-7 seat' }])).toHaveLength(1);
  });
});

describe('contextTerms', () => {
  it('builds state + office disambiguation terms', () => {
    expect(contextTerms('ME', 'Senate')).toBe('(Maine OR Senate OR senator)');
    expect(contextTerms('NH', 'Governor')).toBe('("New Hampshire" OR governor OR gubernatorial)');
    expect(contextTerms('PA', 'House')).toContain('Pennsylvania');
    expect(contextTerms(undefined, undefined)).toBe('');
  });
});
