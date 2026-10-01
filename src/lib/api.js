// Client-side data fetchers. News + summaries go through /api (server holds keys & rate-limits);
// Bluesky's public API is free, keyless and CORS-enabled so we call it directly.

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

// state + office let the server disambiguate common names (e.g. Senator vs. Fed president Susan Collins)
export const fetchNews = (name, state = '', office = '') =>
  fetch(`/api/news?name=${encodeURIComponent(name)}&state=${encodeURIComponent(state)}&office=${encodeURIComponent(office)}`).then(json);

export const fetchSummary = (payload) =>
  fetch('/api/summary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(json);

export async function fetchBlueskyPosts(handle, limit = 10) {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=${limit}&filter=posts_no_replies`;
  const data = await fetch(url).then(json);
  return (data.feed ?? [])
    .filter((f) => !f.reason) // skip reposts
    .map((f) => ({
      text: f.post.record?.text ?? '',
      date: f.post.record?.createdAt,
      url: `https://bsky.app/profile/${f.post.author.handle}/post/${f.post.uri.split('/').pop()}`,
    }))
    .filter((p) => p.text);
}
