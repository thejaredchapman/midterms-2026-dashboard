# TODO — finish, push to GitHub, deploy to Vercel

_Last updated 2026-10-01. Work through top to bottom._

## A. Blockers to settle BEFORE a public deploy
- [ ] **NewsAPI terms.** The free Developer plan is development/testing only (no staging/production); production starts at $449/mo.
      Decide: pay, switch news source, or keep the app local-only. (GDELT is the free keyless fallback but 429s from some networks.)
- [ ] **Google News supplement is personal-use only** (Google's feed notice). `NEWS_SUPPLEMENT=googlenews` is currently set in the local `.env` to fill Reuters/AP
      (NewsAPI has no Reuters, ~no AP). **Do not set it on Vercel for a public site.** Without it, Reuters/AP will mostly be empty.
- [ ] **Anthropic key is invalid** (API returns 401; the value in `.env` is 76 chars — likely truncated). Create a new key at console.anthropic.com,
      paste the whole value, restart `npm run dev`, then click "Summarize with Claude Haiku" on a candidate to confirm.
- [ ] **Public cost/abuse guard.** `/api/summary` and `/api/news` are open endpoints: anyone could burn the Anthropic/NewsAPI quota.
      Add rate limiting or a shared secret, or protect the deployment (Vercel password/Deployment Protection).
- [ ] **Vercel function time limits.** News can take several seconds (GDELT is queued ~5 s/request). Check `maxDuration` in a `vercel.json`
      against the plan's limit.

## B. Finish the product
- [ ] **Verify the new news panel in the browser** (outlet mode: Reuters · AP · Fox News · CNN). API output verified; UI not yet eyeballed.
- [ ] **Full candidate list** (paused; see `scripts/`):
  - [ ] Rerun `scripts/fetch-votes.mjs` (OBBB House roll 190 / Senate vote 372, Epstein, 2026 Iran war-powers rolls) and confirm it picked the right votes; scan may need to go past House 2026 roll 700.
  - [ ] Write the merge script: `scripts/lib/parse.mjs` (done, tested) + legislators-current + votes + `scripts/data/trump-endorsements.mjs` + existing `roster.mjs` overlay → `src/data/candidates.json`.
        Match incumbents by NAME (mid-decade redistricting broke district numbers in TX/CA/UT/AL/FL). Fill gaps (Alaska/California nominees).
  - [ ] Batch Wikipedia pageimages + Wikidata claims (50 titles/request) for challenger photos/sites/handles.
  - [ ] App changes for ~1,000 rows: state/district filter, Tilt/Safe ratings + PVI, incumbent-vs-challenger column, pagination/virtual rows, summary counts (currently hardcoded for 62).
  - [ ] Sanity counts: 435 House seats, 35 Senate races, 36 governor races. Territory delegates (5) are parsed but not voting members.
- [ ] **Unfilled columns** (no free structured source): Against DEI, data centers, strategy, truthfulness %, country-vs-party, distancing. Research competitive races first.
- [ ] Re-check race facts that came from search summaries (Maine, South Carolina, Alaska nominees) before sharing.
- [ ] Trump-endorsement list is from a secondary source (Washington Examiner tracker via a summarizing fetch tool) — spot-check a few.

## C. Push to GitHub
- [ ] Confirm repo name and **visibility (recommend private** until the terms issues in A are settled).
- [ ] This folder is not a git repo yet: `git init`, confirm `.env` is ignored (`git check-ignore .env`), review `git status` for secrets, commit.
- [ ] Create the GitHub repo and push (needs your OK — it publishes the code).
- [ ] Commit messages end with the `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` line.

## D. Deploy to Vercel
- [ ] `vercel link`, then set env vars in the Vercel project: `ANTHROPIC_API_KEY`, `NEWSAPI_KEY` (only if A is resolved), NOT `NEWS_SUPPLEMENT`.
- [ ] Deploy a **preview** first (`vercel`), test `/api/news?name=Susan%20Collins&state=ME&office=Senate` and a summary, then `vercel --prod`.
- [ ] Confirm `api/*.js` functions import `../server/*.js` correctly in the Vercel build (not yet tested on Vercel).
