import type { BattleActor, BattleCheckpoint, StatBlueprint } from './index.ts';
export interface ActorInput {
  actor_id: string;
  team: 'player' | 'enemy';
  kind: BattleActor['kind'];
  position: BattleActor['position'];
  stat_blueprint: StatBlueprint;
  active_slots: BattleActor['active_slots'];
  resolved_skills: BattleActor['resolved_skills'];
  tags: string[];
  build_hash: string;
  normal_attack_enabled: boolean;
  targetable?: boolean;
  counts_for_terminal?: boolean;
  spatial?: Pick<NonNullable<BattleActor['spatial']>, 'x' | 'y' | 'move_speed' | 'radius' | 'normal_range'>;
}
export interface BattleInput { actors: ActorInput[]; mode: BattleCheckpoint['mode']; timing?: BattleCheckpoint['timing']; arena?: BattleCheckpoint['arena'] }
