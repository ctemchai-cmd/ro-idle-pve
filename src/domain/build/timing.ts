import type { BattleCheckpoint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';

/** One authored profile for live gameplay, UI, forecasts and headless encounter builders. */
export function liveBattleTiming(content: ValidatedContent): NonNullable<BattleCheckpoint['timing']> {
  const rotation = content.documents['combat-rules.json']!.rotation as unknown as { live_timing?: NonNullable<BattleCheckpoint['timing']> };
  return structuredClone(rotation.live_timing ?? { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 });
}
