// D-067 (user, 20 Oct 2026): bosses of stages 5/10/15 cast an interruptible heavy Cataclysm; stun, freeze, silence or an
// interrupt effect cancels it, and every Class 1 tree owns such a skill by Lv.5 so no stage forces one class.
import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceUntil, createBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { shouldAdvanceBattleFrame } from '../../src/client/battle-frame.ts';
import { storyStages, storyBoss } from '../../src/domain/modes/story.ts';
import { interruptSkills } from '../../src/simulation/balance.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { probe, resolved } from './class-skills.ts';

const mode = { kind: 'story' as const, ref: 'heavy-cast', time_limit_ms: 20000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
/** A boss that only casts Cataclysm against one player who uses `skill` (chance forced to 1 so the rule, not luck, is tested). */
const HEAVY = ['enemy_cataclysm', 'enemy_doom', 'enemy_twin_hex'] as const;
test('1x/2x/4x frame clocks preserve exact events, interruptions and final state for all heavy casts and four interrupt types', () => {
  for (const heavy of HEAVY) for (const [skill, effect] of [['swordsman_bash', 'stun'], ['mage_cold_bolt', 'freeze'], ['acolyte_holy_light', 'silence'], ['sage_spell_breaker', 'interrupt']] as const) {
    const runs = [1, 2, 4].map(speed => {
      const own = resolved(skill, 10) as unknown as { definition: { effects: { type: string; status_id?: string; chance?: number }[] } };
      for (const e of own.definition.effects) if (e.type === 'interrupt' || e.status_id === effect) e.chance = 1;
      const player = probe('p', 'player', 'front_1', [own as never], false), boss = probe('e_boss', 'enemy', 'front_1', [resolved(heavy, 1)], false);
      player.stat_blueprint.derived_offsets.max_hp = boss.stat_blueprint.derived_offsets.max_hp = 100000;
      let state = unwrap(createBattle({ actors: [player, boss], mode }, content, 4)), logical = 0;
      const events = [];
      while (!state.terminal_result) {
        logical = Math.min(mode.time_limit_ms, logical + 17 * speed);
        if (shouldAdvanceBattleFrame(state.game_time_ms, logical, mode.time_limit_ms)) {
          const next = unwrap(advanceUntil(state, logical, content)); state = next.state; events.push(...next.events);
        }
      }
      assert.ok(events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'e_boss' && e.skill_id === heavy));
      return { events, state: serializeBattle(state) };
    });
    assert.deepEqual(runs[1], runs[0], `${heavy}/${effect}: 2x differs from1x`);
    assert.deepEqual(runs[2], runs[0], `${heavy}/${effect}: 4x differs from1x`);
  }
});
function duel(skill: string, statusOrEffect: string, heavy: string = 'enemy_cataclysm') {
  const own = resolved(skill, 10) as unknown as { definition: { effects: { type: string; status_id?: string; chance?: number }[] } };
  for (const effect of own.definition.effects) if (effect.type === 'interrupt' || effect.status_id === statusOrEffect) effect.chance = 1;
  const player = probe('p', 'player', 'front_1', [own as never], false); player.stat_blueprint.derived_offsets.max_hp = 100000;
  const boss = probe('e_boss', 'enemy', 'front_1', [resolved(heavy, 1)], false); boss.stat_blueprint.derived_offsets.max_hp = 100000;
  return unwrap(advanceUntil(unwrap(createBattle({ actors: [player, boss], mode }, content, 4)), 20000, content));
}

test('D-067/D-074: stun, freeze, silence and interrupt each cancel every heavy cast (Cataclysm, Doom, Twin Hex)', () => {
  for (const heavy of HEAVY) for (const [skill, effect] of [['swordsman_bash', 'stun'], ['mage_cold_bolt', 'freeze'], ['acolyte_holy_light', 'silence'], ['sage_spell_breaker', 'interrupt']] as const) {
    const run = duel(skill, effect, heavy), cut = run.events.filter(e => e.type === 'cast_interrupt' && e.actor_id === 'e_boss' && e.skill_id === heavy);
    const landed = run.events.filter(e => e.type === 'cast_resolve' && e.actor_id === 'e_boss' && e.skill_id === heavy);
    assert.ok(cut.length >= 1, `${heavy}: ${skill} (${effect}) cancelled ${cut.length} casts, ${landed.length} landed`);
    assert.ok(cut.every(e => e.detail === 'p'), `${skill}: the interrupt is credited to the player`);
  }
  const silence = (content.documents['status-effects.json']!.statuses as unknown as { id: string; restrictions: string[] }[]).find(s => s.id === 'silence')!;
  assert.ok(silence.restrictions.includes('interrupt_interruptible_cast'), 'silence cancels casts (user request)');
});

test('D-067: every Class 1 tree can interrupt by Lv.5 and the heavy cast is a long, readable telegraph', () => {
  const options = interruptSkills(content), byRoot = new Map<string, number>();
  for (const id of options.keys()) { const skill = content.skills[id] as unknown as { class_id: string; unlock_level: number }; if (['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'].includes(skill.class_id)) byRoot.set(skill.class_id, Math.min(byRoot.get(skill.class_id) ?? 99, skill.unlock_level)); }
  assert.deepEqual([...byRoot.keys()].sort(), ['acolyte', 'archer', 'mage', 'merchant', 'swordsman', 'thief'], 'each Class 1 root owns an interrupt option');
  assert.ok([...byRoot.values()].every(level => level <= 5), `unlocked by Lv.5: ${JSON.stringify(Object.fromEntries(byRoot))}`);
  for (const id of HEAVY) { const heavy = content.skills[id] as unknown as { timing: { cast_ms: number; interruptible: boolean }; tags: string[] }; assert.equal(heavy.timing.cast_ms, 4000, id); assert.ok(heavy.timing.interruptible && heavy.tags.includes('heavy_cast'), id); }
});

test('D-074: Doom hits only the weakest member ×2.5 (provoke can redirect it), Twin Hex two random members ×1.6, Cataclysm everyone ×1 — one calibration row fits all three', () => {
  type Def = { selectors: Record<string, { select: string; count: number | null }>; effects: { type: string; target: string; formula: { params: { attack_ratio: number } } }[] };
  const hit = (id: string) => { const d = content.skills[id] as unknown as Def, e = d.effects.find(x => x.type === 'damage')!; return { sel: d.selectors[e.target]!, ratio: e.formula.params.attack_ratio }; };
  const cat = hit('enemy_cataclysm'), doom = hit('enemy_doom'), hex = hit('enemy_twin_hex');
  assert.equal(cat.sel.select, 'all'); assert.deepEqual([doom.sel.select, doom.sel.count], ['lowest_hp_percent', null]); assert.deepEqual([hex.sel.select, hex.sel.count], ['random_n', 2]);
  assert.equal(doom.ratio / cat.ratio, 2.5); assert.equal(Math.round(hex.ratio / cat.ratio * 100) / 100, 1.6);
  // Landed casts hit exactly that many members in a real battle.
  for (const [id, count] of [['enemy_doom', 1], ['enemy_twin_hex', 2]] as const) {
    const party = ['a', 'b', 'c'].map(n => { const p = probe(n, 'player', 'front_1', [], false); p.stat_blueprint.derived_offsets.max_hp = 100000; return p; });
    const boss = probe('e_boss', 'enemy', 'front_1', [resolved(id, 1)], false); boss.stat_blueprint.derived_offsets.max_hp = 100000;
    const run = unwrap(advanceUntil(unwrap(createBattle({ actors: [...party, boss], mode }, content, 4)), 9000, content));
    const resolve = run.events.find(e => e.type === 'cast_resolve' && e.skill_id === id)!;
    const targets = new Set(run.events.filter(e => e.type === 'damage' && e.actor_id === 'e_boss' && e.skill_id === id && e.at_ms === resolve.at_ms).map(e => e.target_id));
    assert.equal(targets.size, count, id);
  }
});

test('D-067/D-074: Story bosses of stages 5, 10 and 15 open with a heavy cast (chapter 1 Cataclysm, then a rotation of all three); the others never cast one', () => {
  const used = new Set<string>();
  for (const stage of storyStages(content).filter(s=>s.chapter<=8)) {
    const slots = storyBoss(stage).active_slots, heavy = [5, 10, 15].includes(stage.index), casts = slots.filter(id => HEAVY.includes(id as never));
    assert.equal(HEAVY.includes(slots[0] as never), heavy, `${stage.id} first slot ${slots[0]}`);
    assert.equal(casts.length, heavy ? 1 : 0, `${stage.id}`);
    if (stage.chapter === 1 && heavy) assert.equal(slots[0], 'enemy_cataclysm', 'chapter 1 teaches with Cataclysm');
    if (heavy) used.add(slots[0]!);
    assert.equal(stage.time_limit_ms, 40000, `${stage.id} lasts 40 s (D-066)`);
  }
  assert.deepEqual([...used].sort(), [...HEAVY].sort());
});
