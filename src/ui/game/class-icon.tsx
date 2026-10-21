import { rosterData as data, type RootJob } from '../../client/roster.ts';
import { jobNames } from './kit.tsx';

/** Authored class emblems (TASK-048, D-053): tree colour + job glyph; Class 2 adds a gold ring. Presentation only. */
const glyphs: Record<string, readonly string[]> = {
  swordsman: ['M19 5 9.5 14.5', 'M19 5l-3.5.5M19 5l-.5 3.5', 'M7 12l5 5', 'M9.5 14.5 5 19'],
  knight: ['M5 19 17 7', 'M19.5 4.5 13.5 6.5l4 4z', 'M8 13l3 3'],
  crusader: ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z', 'M12 8v8M9 11h6'],
  acolyte: ['M12 4v16', 'M7 9h10'],
  priest: ['M12 8v12', 'M8 12h8', 'M8 4.5a4 1.6 0 1 0 8 0a4 1.6 0 1 0-8 0'],
  monk: ['M7 11h10v5a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z', 'M7 11V8.5a1.5 1.5 0 0 1 3 0V11M10 11V7.5a1.5 1.5 0 0 1 3 0V11M13 11V8.5a1.5 1.5 0 0 1 3 0V11'],
  archer: ['M8 4c8 3 8 13 0 16', 'M8 4v16', 'M5 12h14', 'M19 12l-3-2.5M19 12l-3 2.5'],
  hunter: ['M5 12a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M12 12l8-8', 'M20 4h-3M20 4v3'],
  bard: ['M9 17V6l9-2v11', 'M9 17a2.4 2 0 1 1-4.8 0a2.4 2 0 1 1 4.8 0', 'M18 15a2.4 2 0 1 1-4.8 0a2.4 2 0 1 1 4.8 0'],
  dancer: ['M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z'],
  mage: ['M7 21 14.5 9.5', 'M14 7a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M5 6l1 2M3.5 9.5l2 .5'],
  wizard: ['M13 3 6 13h5l-1 8 8-11h-5z'],
  sage: ['M12 6c-2.5-1.5-5.5-1.5-8-.5v13c2.5-1 5.5-1 8 .5 2.5-1.5 5.5-1.5 8-.5v-13c-2.5-1-5.5-1-8 .5z', 'M12 6v13'],
  thief: ['M18 4 10.5 11.5', 'M18 4l-.5 3.5M18 4l-3.5.5', 'M8 9.5l4.5 4.5', 'M10.5 11.5 5 17'],
  assassin: ['M5 5l14 14', 'M19 5 5 19', 'M5 5l3.5.5M5 5l.5 3.5', 'M19 5l-3.5.5M19 5l-.5 3.5'],
  rogue: ['M3 9c3-2 6-1 9 1 3-2 6-3 9-1 0 4-3 6-6 5-1.5-.5-2.5-1.5-3-2-.5.5-1.5 1.5-3 2-3 1-6-1-6-5z', 'M7 11h2.5M14.5 11H17'],
  merchant: ['M9 4h6l-1.5 3h-3z', 'M10.5 7C6 9 5 13 5 15.5 5 18.5 7.5 20 12 20s7-1.5 7-4.5c0-2.5-1-6.5-5.5-8.5', 'M12 11v7M14 12.5c0-1.2-4-1.2-4 .3 0 1.7 4 1 4 2.7 0 1.3-4 1.3-4 0'],
  blacksmith: ['M13 4l7 7-2.5 2.5-7-7z', 'M14 10 5 19'],
  alchemist: ['M9.5 3h5', 'M10.5 3v6l-5 9c-.5 1 .2 2 1.5 2h10c1.3 0 2-1 1.5-2l-5-9V3', 'M7.5 15h9'],
};
const rootOf: Record<string, RootJob> = Object.fromEntries((Object.keys(data.class_tree) as RootJob[]).flatMap(root => [[root, root], ...data.class_tree[root].map(job => [job, root])]));
export function ClassIcon({ job, size = 20 }: { job: string; size?: number }) {
  const root = rootOf[job] ?? 'swordsman', second = root !== job;
  return <span className={`class-icon tree-${root} ${second ? 'second' : ''}`} style={{ width: size, height: size }} role="img" aria-label={jobNames[job] ?? job} title={jobNames[job] ?? job}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{(glyphs[job] ?? glyphs[root]!).map((d, i) => <path key={i} d={d} />)}</svg>
  </span>;
}
