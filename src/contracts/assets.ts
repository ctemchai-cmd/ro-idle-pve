export interface RuntimeAsset {
  id: string;
  category: string;
  meta_path: string;
  media_path: string;
}
export interface SkillPresentation {
  id: string;
  icon_meta_path: string;
  visual: { type: string; reference_skill_id?: number };
  sound_meta_paths: string[];
}
export interface RuntimeRecipe {
  skill_id: number;
  name: string;
  family: string;
  color: string;
  duration_ms: number;
  native_effect: { meta: string; id?: string } | null;
  ready: boolean;
  icon?: { meta: string };
  sounds?: readonly string[];
}
export interface RuntimeAssetIndex {
  schema_version: number;
  pack_hash: string;
  base_url: string;
  assets: Readonly<Record<string, RuntimeAsset>>;
  files: readonly { path: string; bytes: number; sha256: string }[];
  skills: Readonly<Record<string, { presentation_id: string }>>;
  presentations: Readonly<Record<string, SkillPresentation>>;
  recipes: readonly RuntimeRecipe[];
  actor_jobs: readonly { job_id: string; presets: readonly ActorPreset[] }[];
  font: { id: string; file: string; meta: string };
  audio_events: Readonly<Record<string, { id: string; meta: string }>>;
  combat_visuals: CombatVisuals;
}
export interface ProjectileSpec {
  kind: 'projectile'; shape: 'arrow' | 'bullet' | 'orb' | 'spear'; travel_ms: number; release_ms: number;
  count: number; stagger_ms: number; arc_height: number; color: string;
  /** `sky`: falls onto the target from above (RO bolts) instead of flying from the caster. */
  path?: 'line' | 'sky';
}
/** Native RO STR effect played on each hit target (or once per affected target for non-damage skills). */
export interface ImpactEffect {
  meta: string; scale: number;
  /** Effect clock at the moment of impact; lets a long STR skip its empty lead-in. */
  start_ms: number;
  /** The effect begins this long before the impact (a sky strike is visible while it descends). */
  lead_ms: number;
  /** Without projectiles, hit N lands N × stagger after the first. */
  stagger_ms: number;
  /** Draw offset above the feet, in world pixels. */
  lift: number;
}
export interface CombatVisuals {
  schema_version: 1;
  numbers: { meta: string; digit_frames: readonly number[]; critical_meta: string; critical_frame: number; basis: string; reference: string };
  normal_attacks: Readonly<Record<string, { special_sfx: readonly ProjectileSpec[] }>>;
  skills: Readonly<Record<string, { special_sfx: readonly ProjectileSpec[] }>>;
  /** Keyed by skill presentation id, so copies (e.g. Rogue Plagiarism) share the original's effect. */
  impacts: Readonly<Record<string, ImpactEffect>>;
}
export interface ActorPreset {
  preset_id: string; gender: string; attack_source_action_index: number;
  /** Body frame where a projectile leaves the weapon; overrides the ACT sound frame (bows mark the draw). */
  attack_release_frame?: number;
  /** Body actions a normal attack cycles through; only poses that still draw the worn weapon. */
  attack_variant_indices?: readonly number[];
  body: { id: string; meta: string }; head?: { id: string; meta: string }; weapon?: { id: string; meta: string };
}
export interface AssetLocation {
  id: string;
  metaUrl: string;
  mediaUrl: string;
  collectionBaseUrl: string;
}
