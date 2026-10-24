/** Events cross the presentation boundary as data; animation never calls combat rules. */
export interface BattlePresentationEvent {
  at_ms: number; phase: number; sequence: number;
  type: 'cast_start' | 'cast_resolve' | 'cast_interrupt' | 'sp_skip' | 'sphere_skip' | 'normal_attack' | 'damage' | 'miss' | 'death' | 'terminal' | 'regen' | 'heal' | 'shield' | 'resource_change' | 'status_applied' | 'status_resisted' | 'status_removed' | 'status_expired' | 'proc' | 'proc_rejected' | 'revive' | 'summon' | 'despawn';
  actor_id: string; skill_id?: string; target_id?: string; amount?: number; detail?: string;
  /** Resolved cast duration at cast_start; presentation never recomputes cast speed. */
  cast_duration_ms?: number;
  action_id?: string; source_instance_id?: string; effect_id?: string; hit_index?: number;
  raw?: number; mitigated?: number; absorbed?: number; origin?: string; redirect_source_instance_id?: string;
  world_source?: readonly [number, number]; world_target?: readonly [number, number];
  status_change?: { instance_id: string; status_id: string; params: Record<string, number>; applied_at: number; expires_at: number; control_resistance_after: number; active_instances_after: number };
}
export interface ActorRenderView {
  actor_id: string; name: string; team: 'player' | 'enemy'; position: string;
  hp: number; max_hp: number; sp: number; max_sp: number; level: number;
  phase: 'skill_interval' | 'casting' | 'after_cast' | 'normal_only' | 'dead';
  phase_started_at: number; phase_ready_at: number | null; phase_duration_ms: number;
  cast: { skill_id: string; interruptible: boolean } | null;
  next_slot: number; slots: readonly (string | null)[]; status_ids: readonly string[];
  /** Read-only live status projection, grouped for display; each stack keeps its own expiry/source. */
  statuses?: readonly StatusRenderGroup[];
  /** True only while this living recipient has an active periodic heal status. */
  healing_aura?: boolean;
  spirit_spheres?: number; spirit_sphere_capacity?: number; spirit_attack_bonus?: number; spirit_attack_per_sphere?: number;
  /** Owner of a summoned actor (plants etc.); party/enemy rows never carry it. */
  summon_of?: string; summon_kind?: string;
  spatial?: { x: number; y: number; previous_x: number; previous_y: number; updated_at: number; moving: boolean; target_id: string | null; normal_range: number };
}
export interface StatusRenderInstance {
  instance_id: string; status_id: string; name: string; source_actor_id: string;
  applied_at: number | null; expires_at: number; description: string;
  link_color?:string;
  field_color?:string;
}
export interface StatusRenderGroup {
  id: string; name: string; polarity: 'buff' | 'debuff'; icon_skill_id: string | null;
  stacks: number; next_expiry_at: number; instances: readonly StatusRenderInstance[];
}
export interface BattleRenderView {
  game_time_ms: number; time_limit_ms: number; actors: readonly ActorRenderView[];
  arena?: { width: number; height: number };
  terminal: { kind: string; at_ms: number } | null;
}
/** Read-only projection from the shared engine; timestamps use battle time. */
export interface SkillTimelineEntry {
  id: string; actor_id: string; skill_id: string; slot: number;
  start_ms: number; end_ms: number; recovery_end_ms: number;
  outcome: 'resolved' | 'interrupted' | 'sp_skip' | 'sphere_skip' | 'pending';
  /** Casts this entry's action interrupted, and the entry whose action interrupted this one (if any). */
  interrupts?: readonly { actor_id: string; skill_id: string; at_ms: number }[]; interrupted_by?: string;
}
export interface BattleTimeline {
  entries: readonly SkillTimelineEntry[]; through_ms: number;
}
export interface ActorAppearance {
  actor_id: string; job_id?: string; gender?: string; show_weapon?: boolean; body_meta?: string;
  facing: 'left' | 'right'; scale: number;
}
export interface BattleScene {
  title: string; subtitle: string; background_meta: string; music_meta: string;
  actors: readonly ActorAppearance[]; skill_labels: Readonly<Record<string, string>>;
  enemy_recipes: Readonly<Record<string, number>>;
}
