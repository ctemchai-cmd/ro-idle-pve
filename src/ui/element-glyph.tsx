import type { DamageElement } from '../client/elements.ts';

const paths: Record<DamageElement, readonly string[]> = {
  neutral: ['M12 4 20 12 12 20 4 12 12 4Z', 'M9 12h6'],
  fire: ['M13 3c1 5-4 6-2 9 1-2 3-2 4-4 5 6 4 13-3 13C4 21 3 13 8 8c0 4 1 4 2 5-1-4 3-6 3-10Z'],
  water: ['M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z', 'M8 15a4 4 0 0 0 4 4'],
  earth: ['m3 19 6-12 4 7 3-9 5 14H3Z', 'm8 19 3-5 3 5'],
  wind: ['M3 8h12a3 3 0 1 0-3-3', 'M3 12h16a3 3 0 1 1-3 3', 'M3 16h6a3 3 0 1 1-3 3'],
  poison: ['M9 3h6m-5 0v6l-5 8a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-8V3', 'M8 14h8m-5 3h.1m3 1h.1'],
  holy: ['m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z'],
  dark: ['M19 16A9 9 0 0 1 8 4a9 9 0 1 0 11 12Z', 'm17 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z'],
  ghost: ['M5 20v-9a7 7 0 0 1 14 0v9l-4-2-3 2-3-2-4 2Z', 'M9 10v2m6-2v2'],
  undead: ['M8 17H6v-6a6 6 0 1 1 12 0v6h-2v4H8v-4Z', 'M9 11h.1m6 0h.1M11 21v-3m2 3v-3'],
  weapon: ['m5 3 4 1 10 11-4 4L4 8 5 3Z', 'm3 15 6 6m-5-1 4-4'],
};
export function ElementGlyph({ element }: { element: DamageElement }) {
  return <span className={`element-symbol element-${element}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[element].map((d,i)=><path key={i} d={d}/>)}</svg></span>;
}
