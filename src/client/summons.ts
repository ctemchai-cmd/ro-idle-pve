import type { Effect } from '../contracts/index.ts';
import type { DeepReadonly } from '../content/value.ts';
import type { ValidatedContent } from '../content/model.ts';

type SummonEffect = Extract<Effect, { type: 'summon' }>;
interface SummonDefinition {
  id: string;
  derived_scale: number;
  action: { interval_ms: number; tick_on_spawn: boolean; effects: Effect[] };
}

/** Display summon coefficients against the caster's stats, using the actual actor catalog.
 * The engine rounds the inherited stat before resolving a hit; these are nominal coefficients.
 * Flat terms do not inherit attack scaling. No gameplay definition is modified here.
 */
export function summonPresentation(effect: DeepReadonly<SummonEffect>, content: ValidatedContent) {
  const actors = content.documents['summon-actors.json']!.actors as unknown as readonly SummonDefinition[];
  const actor = actors.find(row => row.id === effect.actor_definition_id);
  if (!actor) return null;
  const scale = actor.derived_scale * (effect.power_scale === undefined ? 1 : Number(effect.power_scale));
  const effects = structuredClone(actor.action.effects);
  for (const action of effects) {
    if (!('formula' in action)) continue;
    const formula = action.formula;
    if ((formula.id === 'physical_power' || formula.id === 'magical_power' || formula.id === 'healing_power') && typeof formula.params.attack_ratio === 'number') {
      // Remove binary multiplication noise before the shared two-decimal percent formatter.
      formula.params.attack_ratio = Number((formula.params.attack_ratio * scale).toFixed(12));
    }
  }
  return { effects, intervalMs: actor.action.interval_ms, immediate: actor.action.tick_on_spawn };
}
