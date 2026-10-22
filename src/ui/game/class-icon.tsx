import { useEffect, useState } from 'react';
import { rosterData as data, type RootJob } from '../../client/roster.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { shellVisuals } from '../../renderer/shell.ts';
import { jobNames } from './kit.tsx';

const rootOf: Record<string, RootJob> = Object.fromEntries((Object.keys(data.class_tree) as RootJob[]).flatMap(root => [[root, root], ...data.class_tree[root].map(job => [job, root])]));
/** Actual Origin profession emblems, keyed by the source catalog; never borrow skill/item art. */
export function ClassIcon({ job, pack, size = 20 }: { job: string; pack: AssetPack | null; size?: number }) {
  const root = rootOf[job] ?? 'swordsman', ref = pack ? shellVisuals(pack.index).class_icons?.[job] : undefined;
  const id = ref?.asset_id, [image, setImage] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => { let active = true; if (id && pack) void pack.iconUrl(id).then(url => { if (active) setImage({ id, url }); }).catch(() => {}); return () => { active = false; }; }, [id, pack]);
  return <span className={`class-icon native tree-${root} ${root !== job ? 'second' : ''}`} style={{ width: size, height: size }} role="img" aria-label={jobNames[job] ?? job} title={jobNames[job] ?? job} data-class-icon={job} data-asset-id={id}>
    {image?.id === id && image && <img src={image.url} alt="" />}
  </span>;
}
