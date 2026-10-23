import type { RuntimeAssetIndex } from '../contracts/assets.ts';
import { locateAsset } from './asset-locator.ts';

/** Presentation-only shell selection carried inside the runtime pack manifest. */
export interface ShellIconRef { asset_id: string; meta_path: string; source_name: string }
export interface FarmSkin { name: string; label: string; asset_id: string; meta_path: string }
export interface ShellVisuals {
  schema_version: 1;
  ui_icons: Readonly<Record<string, ShellIconRef>>;
  element_icons?: Readonly<Record<string, Pick<ShellIconRef, 'asset_id' | 'meta_path'>>>;
  class_icons?: Readonly<Record<string, ShellIconRef & { game_job_id: number; source_icon_name: string }>>;
  resource_icons: Readonly<Record<string, ShellIconRef>>;
  feature_icons: Readonly<Record<string, ShellIconRef>>;
  farm: {
    presentation_only: true; mobs_per_wave: readonly [number, number]; walk_ms: number; rest_ms: number; wave_time_limit_ms: number;
    derived_from_boss_when_no_adds: Readonly<Record<'max_hp' | 'physical_attack' | 'magical_attack', number>>;
    chapters: Readonly<Record<string, readonly FarmSkin[]>>;
  };
  boss_pools?: { chapters: Readonly<Record<string, readonly FarmSkin[]>> };
  wardrobe?: {
    job_class_sprite: Readonly<Record<string, string>>;
    head: Readonly<Record<string, Readonly<Record<'male' | 'female', { asset_id: string; meta_path: string }>>>>;
    garment: Readonly<Record<string, { folder: string; rows: Readonly<Record<string, { asset_id: string; meta_path: string }>> }>>;
  };
}
/** Boss look for a non-final Story stage (D-056); stats and skills stay the stage's boss row. */
export function bossSkin(index: RuntimeAssetIndex, chapter: number, stageIndex: number): FarmSkin | null {
  const pool = shellVisuals(index).boss_pools?.chapters[String(chapter)] ?? [];
  return pool.length ? pool[(stageIndex - 1) % pool.length]! : null;
}
/** Visible equipment tiers carried on appearances/looks; stats never read these. */
export interface WardrobeTiers { head_tier?: number | null; garment_tier?: number | null }
/** Headgear/garment sidecars for a job/gender at the equipped item tiers (D-055); missing rows simply draw nothing. */
export function wardrobeRefs(index: RuntimeAssetIndex, job: string, gender: string, tiers: WardrobeTiers): { headgear: string | null; garment: string | null } {
  const wardrobe = shellVisuals(index).wardrobe, sex = gender === 'female' ? 'female' : 'male';
  if (!wardrobe) return { headgear: null, garment: null };
  const head = tiers.head_tier ? wardrobe.head[String(tiers.head_tier)]?.[sex]?.asset_id ?? null : null;
  const sprite = wardrobe.job_class_sprite[job], garment = tiers.garment_tier && sprite ? wardrobe.garment[String(tiers.garment_tier)]?.rows[`${sprite}|${sex}`]?.asset_id ?? null : null;
  return { headgear: head, garment };
}
export function shellVisuals(index: RuntimeAssetIndex): ShellVisuals {
  const shell = (index as RuntimeAssetIndex & { shell?: ShellVisuals }).shell;
  if (!shell || shell.schema_version !== 1) throw new Error('SHELL_VISUALS_MISSING');
  return shell;
}
/** Direct media URL for small flat icons; never used for packed actor atlases. */
export function shellIconUrl(index: RuntimeAssetIndex, group: 'ui_icons' | 'resource_icons' | 'feature_icons', key: string): string | null {
  const ref = shellVisuals(index)[group][key];
  return ref ? locateAsset(index, ref.asset_id).mediaUrl : null;
}
export function farmSkins(index: RuntimeAssetIndex, chapter: number): readonly FarmSkin[] {
  const chapters = shellVisuals(index).farm.chapters;
  return chapters[String(chapter)] ?? chapters['1'] ?? [];
}
