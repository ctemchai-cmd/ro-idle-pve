import type { ImpactEffect, RuntimeAssetIndex, RuntimeRecipe } from '../contracts/assets.ts';
import type { ActorAppearance, BattleScene } from '../contracts/presentation.ts';
import { locateAsset, locateSkillVisual } from './asset-locator.ts';
import type { ActorParts, NativeAsset, NativeMeta } from './native.mjs';
import { BattleAudio, type AudioLevels } from './audio.ts';
import { wardrobeRefs, type WardrobeTiers } from './shell.ts';
import { validateCombatVisuals } from './projectiles.ts';
import { presetSwing } from './actor-animation.ts';

async function json<T>(url: string): Promise<T> { const response = await fetch(url); if (!response.ok) throw new Error(`ASSET_HTTP_${response.status}:${url}`); return response.json() as Promise<T>; }
export class AssetPack {
  readonly errors: string[] = [];
  readonly actors = new Map<string, ActorParts>();
  readonly visuals = new Map<string, { recipe: RuntimeRecipe; native: NativeAsset | null; sound_paths: readonly string[] }>();
  readonly icons = new Map<string, string>();
  /** Native per-hit STR effect by skill id (resolved through the skill's presentation id). */
  readonly impacts = new Map<string, { config: ImpactEffect; asset: NativeAsset }>();
  background: NativeAsset | null = null;
  /** Last prepared scene; lets the shell switch music with the visible field. */
  currentScene: BattleScene | null = null;
  numberFont: NativeAsset | null = null;
  criticalFont: NativeAsset | null = null;
  private readonly assets = new Map<string, Promise<NativeAsset>>();
  private readonly cropped = new Map<string, Promise<string>>();
  private readonly images = new Map<string, Promise<HTMLImageElement>>();
  private readonly audioMixer: BattleAudio;
  private fontReady: Promise<void> | null = null;
  get soundEnabled() { return this.audioMixer.snapshot().enabled; }
  audioState() { return this.audioMixer.snapshot(); }
  setAudioLevels(levels: AudioLevels) { this.audioMixer.setLevels(levels); }
  setAudioHidden(hidden: boolean) { return this.audioMixer.setHidden(hidden); }
  private constructor(readonly index: RuntimeAssetIndex) { this.audioMixer = new BattleAudio(ref => locateAsset(this.index, ref).mediaUrl); }
  static async open(expectedPackHash?: string | null): Promise<AssetPack> {
    const index = await json<RuntimeAssetIndex>('/ro/manifest.json');
    if (index.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(index.pack_hash) || index.base_url !== `/ro/${index.pack_hash}/`) throw new Error('INVALID_RUNTIME_ASSET_MANIFEST');
    validateCombatVisuals(index.combat_visuals, Object.keys(index.skills), Object.values(index.skills).map(skill => skill.presentation_id));
    if (expectedPackHash !== undefined && expectedPackHash !== index.pack_hash) throw new Error('INCOMPATIBLE_RUNTIME_ASSET_PACK');
    return new AssetPack(index);
  }
  asset(id: string): Promise<NativeAsset> {
    if (!this.assets.has(id)) this.assets.set(id, (async () => {
      const location = locateAsset(this.index, id), meta = await json<NativeMeta>(location.metaUrl);
      if (meta.id !== location.id || meta.missing_dependencies?.length) throw new Error(`INVALID_ASSET_METADATA:${id}`);
      if (!this.images.has(location.mediaUrl)) this.images.set(location.mediaUrl, (async () => {
        const image = new Image(); image.src = location.mediaUrl; await image.decode(); return image;
      })());
      return { meta, image: await this.images.get(location.mediaUrl)! };
    })());
    return this.assets.get(id)!;
  }
  private async actor(appearance: ActorAppearance): Promise<ActorParts> {
    if (appearance.body_meta) return { body: await this.asset(appearance.body_meta) };
    const job = this.index.actor_jobs.find(row => row.job_id === appearance.job_id);
    const preset = job?.presets.find(row => row.gender === (appearance.gender ?? 'male')) ?? job?.presets[0];
    if (!preset) throw new Error(`MISSING_ACTOR_PRESET:${appearance.job_id}`);
    const worn = wardrobeRefs(this.index, appearance.job_id ?? '', appearance.gender ?? 'male', appearance as ActorAppearance & WardrobeTiers);
    const [body, head, weapon, headgear, garment] = await Promise.all([this.asset(preset.body.meta), preset.head ? this.asset(preset.head.meta) : null, appearance.show_weapon !== false && preset.weapon ? this.asset(preset.weapon.meta) : null, worn.headgear ? this.asset(worn.headgear) : null, worn.garment ? this.asset(worn.garment) : null]);
    return { body, ...(head ? { head } : {}), ...(weapon ? { weapon } : {}), ...(headgear ? { headgear } : {}), ...(garment ? { garment } : {}), ...presetSwing(preset) };
  }
  async prepare(scene: BattleScene, skillIds: readonly string[]): Promise<void> {
    this.numberFont ??= await this.asset(this.index.combat_visuals.numbers.meta);
    this.criticalFont ??= await this.asset(this.index.combat_visuals.numbers.critical_meta);
    this.fontReady ??= (async () => { const fontLocation = locateAsset(this.index, this.index.font.id); const font = new FontFace('ROThai', `url("${fontLocation.mediaUrl}")`); await font.load(); document.fonts.add(font); })();
    await this.fontReady;
    this.background = await this.asset(scene.background_meta);
    this.currentScene = scene;
    await Promise.all(scene.actors.map(async appearance => this.actors.set(appearance.actor_id, await this.actor(appearance))));
    await Promise.all([...new Set(skillIds)].map(async id => {
      if (Object.hasOwn(scene.enemy_recipes, id)) {
        const recipe = this.index.recipes.find(row => row.skill_id === scene.enemy_recipes[id]);
        if (!recipe?.ready) throw new Error(`MISSING_ENEMY_RECIPE:${id}`);
        this.visuals.set(id, { recipe, native: recipe.native_effect ? await this.asset(recipe.native_effect.meta) : null, sound_paths: recipe.sounds ?? [] });
        if (recipe.icon) this.icons.set(id, await this.iconUrl(recipe.icon.meta));
      } else {
        const visual = locateSkillVisual(this.index, id);
        this.icons.set(id, await this.iconUrl(visual.icon.id));
        this.visuals.set(id, { recipe: visual.recipe, native: visual.nativeEffect ? await this.asset(visual.nativeEffect.id) : null, sound_paths: visual.sounds.map(sound => sound.id) });
        const impact = this.index.combat_visuals.impacts?.[this.index.skills[id]!.presentation_id];
        if (impact) this.impacts.set(id, { config: impact, asset: await this.asset(impact.meta) });
      }
    }));
  }
  /**
   * Icon image cropped to its sprite frame. Skill icon atlases keep a 1px border plus 5–6 spare columns on the right,
   * so showing the whole file pushes the art left of centre (user report, 21 Oct 2026). Plain images pass through.
   */
  iconUrl(id: string): Promise<string> {
    if (!this.cropped.has(id)) this.cropped.set(id, this.asset(id).then(asset => {
      const rect = asset.meta.sprite_sheet?.frames[0], image = asset.image;
      if (!rect || (rect[0] === 0 && rect[1] === 0 && rect[2] === image.naturalWidth && rect[3] === image.naturalHeight)) return image.src;
      const canvas = document.createElement('canvas'); canvas.width = rect[2]!; canvas.height = rect[3]!;
      canvas.getContext('2d')!.drawImage(image, rect[0]!, rect[1]!, rect[2]!, rect[3]!, 0, 0, rect[2]!, rect[3]!);
      return canvas.toDataURL('image/png');
    }));
    return this.cropped.get(id)!;
  }
  /** Loads only skill icons (e.g. a timeline preview) without replacing the visible scene. */
  async prepareIcons(skillIds: readonly string[]): Promise<void> {
    await Promise.all([...new Set(skillIds)].filter(id => !this.icons.has(id)).map(async id => { try { this.icons.set(id, await this.iconUrl(locateSkillVisual(this.index, id).icon.id)); } catch { /* Missing icon only hides the picture. */ } }));
  }
  enableAudio(enabled: boolean, scene: BattleScene): Promise<void> { return this.audioMixer.enable(enabled, scene.music_meta); }
  sound(ref: string, channel?: string): Promise<void> { return this.audioMixer.sound(ref, channel); }
  stopSound(channel: string): void { this.audioMixer.stopSound(channel); }
  dispose(): void { this.audioMixer.dispose(); }
  async validateMedia(): Promise<{ images: number; audio: number; font: boolean }> {
    const seen = new Set<string>(); let images = 0, audio = 0;
    const decoder = new AudioContext();
    try {
      for (const asset of Object.values(this.index.assets)) {
        const location = locateAsset(this.index, asset.id); if (seen.has(location.mediaUrl)) continue; seen.add(location.mediaUrl);
        if (/\.(webp|png)$/.test(location.mediaUrl)) { await this.asset(asset.id); images++; }
        else if (/\.(wav|mp3|ogg)$/.test(location.mediaUrl)) { const response = await fetch(location.mediaUrl); if (!response.ok) throw new Error('AUDIO_HTTP'); await decoder.decodeAudioData(await response.arrayBuffer()); audio++; }
      }
      return { images, audio, font: document.fonts.check('16px ROThai') };
    } finally { await decoder.close(); }
  }
}
