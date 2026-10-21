/** One source of an actor's output: a skill id, or `normal_attack`. Passive procs count damage with 0 uses. */
export interface SkillCombatStatistics { skill_id: string; damage: number; healing: number; uses: number }
export interface ActorCombatStatistics {
  actor_id: string; team: 'player' | 'enemy';
  damage: number; dps: number; healing: number; hps: number;
  hp_received: number; shield_received: number; tank: number;
  /** Per-skill split of damage/healing (summons fold into their owner). Sums equal `damage`/`healing`. */
  skills: readonly SkillCombatStatistics[];
}
export interface CombatStatistics { elapsed_ms: number; actors: readonly ActorCombatStatistics[] }
