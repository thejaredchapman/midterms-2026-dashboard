import styles from './Flag.module.css';

// Tri-state badge. `bad` marks which value is the "concerning" one for colour (it is neutral about politics:
// colour only distinguishes yes/no/unverified, not good/bad).
export default function Flag({ value, yes = 'Yes', no = 'No' }) {
  if (value == null) return <span className={`${styles.f} ${styles.unk}`} title="No verified data yet">Unverified</span>;
  return <span className={`${styles.f} ${value ? styles.yes : styles.no}`}>{value ? yes : no}</span>;
}
