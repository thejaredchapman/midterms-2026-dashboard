# 2026 Midterms Tracker

Searchable React dashboard of the most competitive 2026 Senate, governor and House races: candidate matrix
(photo, links, Trump-backed, OBBB/Medicaid/medical-funding votes, DEI, Iran, Epstein, distancing, strategy, data centers,
truthfulness, country-vs-party, polling), a summary page, OBBB analysis table and Trump fact-check breakdown.
Click any candidate for left/center/right news, recent posts and a Claude Haiku summary.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # filter/search + news-balancing tests
npm run enrich     # refresh photos/sites/handles from Wikipedia, Wikidata, congress-legislators
npm run build
```

## Data
- `scripts/roster.mjs` — hand-curated candidates. **Anything not sourced is `null` and shows "Unverified".** Add a row, run `npm run enrich`.
- `src/data/candidates.json` — generated (roster + enrichment).
- `src/data/legislation.json`, `factcheck.json` — OBBB table and PolitiFact counts (retrieved 2026-10-01).

## Free services used (no keys)
congress-legislators (photos, sites, X handles) · Wikipedia/Wikidata (photos, links, Bluesky/X handles) ·
GDELT DOC 2.0 (news) · Bluesky public API (posts) · X embed widget (display-only).

## Keys / env (`.env.local`, see `.env.example`)
- `NEWSAPI_KEY` — uses [NewsAPI.org](https://newsapi.org) for the news panel (auto-selected when set; the key stays server-side).
  **Free Developer plan: 100 requests/day, ~1 month history, development/testing only per NewsAPI's terms** — fine on localhost,
  not for a deployed site (production plans start at $449/mo). Results are cached 6 h per candidate to save quota.
- `ANTHROPIC_API_KEY` — enables "Summarize with Claude Haiku" (claude-haiku-4-5). Summaries use headlines + post text only.
- `NEWS_PROVIDER=googlenews` — optional. GDELT rate-limits aggressively (and may 429 shared IPs). The Google News RSS provider works
  but Google's feed notice limits it to personal, non-commercial feed-reader use — opt in only if that fits.
  In dev run `NEWS_PROVIDER=googlenews npm run dev`; on Vercel set it as an env var.

## Deploy
`vercel` — `/api/news` and `/api/summary` run as serverless functions (same handlers the dev server uses).

## Known limits
- Outlet lean (`server/outlets.js`) is an approximate hand-kept snapshot modeled on AllSides, not a live feed.
- X/Twitter text can't be summarized for free (X API reads are paid); Bluesky posts can.
- Truthfulness %, country-vs-party, data-center stance and campaign-strategy columns are mostly unfilled pending sourcing.
