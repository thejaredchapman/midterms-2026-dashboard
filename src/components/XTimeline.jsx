import { useEffect, useRef, useState } from 'react';

// Free, display-only X timeline via the official widget. Often blocked/blank (logged-out limits, ad blockers),
// so we always show a plain link too and never depend on it for summaries.
let loader;
const loadWidgets = () =>
  (loader ??= new Promise((resolve, reject) => {
    if (window.twttr?.widgets) return resolve(window.twttr);
    const s = document.createElement('script');
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true;
    s.onload = () => resolve(window.twttr);
    s.onerror = () => { loader = null; reject(new Error('blocked')); };
    document.head.appendChild(s);
  }));

export default function XTimeline({ handle }) {
  const ref = useRef(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    el.innerHTML = '';
    setState('loading');
    loadWidgets()
      .then((t) => t.widgets.createTimeline({ sourceType: 'profile', screenName: handle }, el, { height: 420, dnt: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }))
      .then((node) => !cancelled && setState(node ? 'ok' : 'empty'))
      .catch(() => !cancelled && setState('blocked'));
    return () => { cancelled = true; el.innerHTML = ''; };
  }, [handle]);

  return (
    <div>
      <div ref={ref} />
      {state === 'loading' && <p style={{ color: 'var(--muted)' }}>Loading X timeline…</p>}
      {(state === 'empty' || state === 'blocked') && <p style={{ color: 'var(--muted)' }}>The X widget didn’t render (blocked or rate-limited).</p>}
      <p style={{ fontSize: '.8rem' }}><a href={`https://x.com/${handle}`} target="_blank" rel="noreferrer noopener">Open @{handle} on X ↗</a></p>
    </div>
  );
}
