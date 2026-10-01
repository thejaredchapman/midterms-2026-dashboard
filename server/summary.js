// Summaries via Claude Haiku. Input is headlines + post text only (no article bodies), so the
// model is told to summarize strictly from what it is given and to say when evidence is thin.
const MODEL = 'claude-haiku-4-5-20251001';
const TTL = 60 * 60 * 1000;
const cache = new Map();

const SYSTEM = `You summarize political coverage neutrally for a voter-information dashboard.
Rules: use ONLY the headlines and posts provided; never add outside facts; do not guess at article content beyond the headline;
attribute framing to the outlet bucket (left/center/right); if a bucket is empty or thin, say so; no endorsements, no loaded language.
Respond with JSON only: {"posts": string, "left": string, "center": string, "right": string, "overall": string}.
Each value is 1-3 sentences. Use "No data." for an empty section.`;

export async function summarize({ name, office, party, posts = [], articles = [] }, apiKey) {
  if (!apiKey) throw new Error('AI summaries are not enabled on this deployment (ANTHROPIC_API_KEY is not set).');
  const key = JSON.stringify([name, posts.map((p) => p.text), articles.map((a) => a.url)]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;

  const byBias = (b) => articles.filter((a) => a.bias === b).map((a) => `- [${a.domain}] ${a.title}`).join('\n') || '(none)';
  const prompt = `Candidate: ${name} (${party}, ${office})

RECENT POSTS (candidate's own words):
${posts.map((p) => `- ${p.text.replace(/\s+/g, ' ').slice(0, 280)}`).join('\n') || '(none available)'}

LEFT-LEANING OUTLET HEADLINES:
${byBias('left')}

CENTER OUTLET HEADLINES:
${byBias('center')}

RIGHT-LEANING OUTLET HEADLINES:
${byBias('right')}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 700, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
  });
  if (r.status === 401) throw new Error('Anthropic rejected ANTHROPIC_API_KEY (invalid or incomplete). Create a new key at console.anthropic.com and paste the whole value into ANTHROPIC_API_KEY (.env locally, or Environment Variables on Vercel), then restart the dev server / redeploy.');
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data.content?.[0]?.text ?? '';
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  let v;
  try { v = JSON.parse(json); } catch { v = { overall: text }; }
  cache.set(key, { t: Date.now(), v });
  return v;
}
