import { summarize } from '../server/summary.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    res.status(200).json(await summarize(req.body ?? {}, process.env.ANTHROPIC_API_KEY));
  } catch (e) {
    res.status(e.message.includes('not enabled') ? 501 : 502).json({ error: e.message });
  }
}
