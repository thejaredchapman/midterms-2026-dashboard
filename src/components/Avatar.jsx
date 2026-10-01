import { useState } from 'react';
import styles from './Avatar.module.css';

const initials = (n) => n.split(' ').filter((p) => /^[A-Z]/.test(p)).map((p) => p[0]).slice(0, 2).join('');

// Photo → fallback photo → initials, so a broken image never leaves a hole in the table.
export default function Avatar({ c, size = 44 }) {
  const sources = [c.photo, c.photoFallback].filter(Boolean);
  const [i, setI] = useState(0);
  const style = { width: size, height: size, '--ring': `var(--${c.party === 'R' ? 'rep' : c.party === 'D' ? 'dem' : 'ind'})` };
  return sources[i] ? (
    <img className={styles.img} style={style} src={sources[i]} alt={c.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setI(i + 1)} />
  ) : (
    <span className={styles.fallback} style={style} aria-label={c.name}>{initials(c.name)}</span>
  );
}
