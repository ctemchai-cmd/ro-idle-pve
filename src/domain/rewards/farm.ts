import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { nextRandom } from '../../content/random.ts';
import { rollItemOptions } from '../build/item-options.ts';
import { farmCardDrop } from './card-drops.ts';

/** Pure integer accrual from a frozen rate/drop snapshot; never simulates kills. */
export function reserveFarm(input: AccountState, fromMs: number, nowMs: number, nowIso: string, claimId: string, content: ValidatedContent): AccountState {
  const state = structuredClone(input), farm = state.farm, snapshot = farm.rate_snapshot;
  const rules = (content.documents['save-contracts.json']!.farm) as unknown as { cap_seconds: number; queue_limit: number; quantization: { divisor: number; drop_interval_ms: number } };
  if (![fromMs, nowMs].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('INVALID_FARM_CLOCK');
  if (nowMs < fromMs) throw new Error('CLOCK_REGRESSION');
  if (!snapshot) throw new Error('FARM_NOT_SELECTED');
  if (state.pending_rewards.length >= rules.queue_limit) throw new Error('PENDING_REWARDS_FULL');
  const elapsed = Math.min(nowMs - fromMs, rules.cap_seconds * 1000);
  if (elapsed === 0) throw new Error('NO_FARM_ELAPSED');
  const vector = {} as AccountState['wallet'], divisor = BigInt(rules.quantization.divisor);
  for (const resource of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) {
    const total = BigInt(elapsed) * BigInt(snapshot.per_hour[resource]) + BigInt(farm.remainders[resource]);
    const amount = Number(total / divisor); if (!Number.isSafeInteger(amount)) throw new Error('RESOURCE_OVERFLOW');
    vector[resource] = amount; farm.remainders[resource] = Number(total % divisor);
  }
  const kinds = ['common','uncommon','rare','epic','legendary','immortal','supreme'] as const;
  const weightTotal = kinds.reduce((sum, k) => sum + BigInt(snapshot.rarity_weights[k]), 0n);
  if (weightTotal <= 0n || snapshot.definition_pool.some(id => content.items[id]?.kind !== 'equipment' || content.items[id]!.tier_level !== snapshot.gear_tier)) throw new Error('INVALID_FARM_SNAPSHOT');
  const dropElapsed = elapsed + farm.drop_carry_ms, drops = Math.floor(dropElapsed / rules.quantization.drop_interval_ms), items: AccountState['inventory'] = [];
  farm.drop_carry_ms = dropElapsed % rules.quantization.drop_interval_ms;
  for (let index = 0; index < drops; index++) {
    nextRandom(farm.loot_rng); const pick = BigInt(farm.loot_rng.state) * weightTotal / 4294967296n;
    let cumulative = 0n, rarity: typeof kinds[number] = 'common';
    for (const kind of kinds) { cumulative += BigInt(snapshot.rarity_weights[kind]); if (pick < cumulative) { rarity = kind; break; } }
    const definitionId = snapshot.definition_pool[Math.floor(nextRandom(farm.loot_rng) * snapshot.definition_pool.length)]!;
    // D-062: option lines are rolled from the same server loot RNG, right after the item's own draws.
    items.push({ instance_id: `${claimId}_gear_${index}`, definition_id: definitionId, kind: 'equipment', rarity_id: rarity, locked: false, training: false, options: rollItemOptions(rarity, () => nextRandom(farm.loot_rng), content) });
    if (snapshot.card_drops) {
      const card = farmCardDrop(snapshot.card_drops, () => nextRandom(farm.loot_rng),content);
      if (card) items.push({ instance_id: `${claimId}_card_${index}`, ...card, kind: 'card', level: 1, locked: false });
    }
  }
  farm.reserved_through = nowIso;
  if (items.length || Object.values(vector).some(n => n > 0)) state.pending_rewards.push({ claim_id: claimId, kind: 'farm', resource_vector: vector, items, content_version: snapshot.content_version, reserved_at: nowIso, source_keys: [`farm:${nowMs - elapsed}:${nowMs}`], status: 'pending' });
  return state;
}
