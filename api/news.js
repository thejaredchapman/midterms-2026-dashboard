import { getNews, getOutletNews } from '../server/news.js';

export default async function handler(req, res) {
  const { name = '', extra = '', mode = 'outlets' } = req.query;
  const opts = { provider: process.env.NEWS_PROVIDER, newsApiKey: process.env.NEWSAPI_KEY, supplement: process.env.NEWS_SUPPLEMENT, state: req.query.state, office: req.query.office };
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(mode === 'balanced' ? await getNews(name, extra, opts) : await getOutletNews(name, opts));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
