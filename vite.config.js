import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { getNews, getOutletNews } from './server/news.js';
import { summarize } from './server/summary.js';

// Serves /api/* in dev with the same handlers Vercel runs in production (see /api).
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res) => {
        const q = new URL(req.url, 'http://x').searchParams;
        try {
          const opts = { provider: env.NEWS_PROVIDER, newsApiKey: env.NEWSAPI_KEY, supplement: env.NEWS_SUPPLEMENT, state: q.get('state'), office: q.get('office') };
          const data = q.get('mode') === 'balanced' ? await getNews(q.get('name') ?? '', q.get('extra') ?? '', opts) : await getOutletNews(q.get('name') ?? '', opts);
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use('/api/summary', async (req, res) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        try {
          const data = await summarize(JSON.parse(body || '{}'), env.ANTHROPIC_API_KEY);
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = e.message.includes('not enabled') ? 501 : 502;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
  test: { environment: 'node' },
}));
