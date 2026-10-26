import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hiContent } from './hi-content-fixtures.ts';
import { actor, content, unwrap, type Active } from './combat-fixtures.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { createBattle, advanceUntil, type BattleState } from '../../src/domain/combat/index.ts';
import { characterSkillCap, skillQuote } from '../../src/domain/progression/skills.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import type { AccountState, BattleCheckpoint } from '../../src/contracts/index.ts';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import modernBindings from '../../scripts/modern-icon-bindings.json';
import goldens from './fixtures/hi-skill-goldens.json';
const future = hiContent();
const highs = future.jobs.order.filter(job => future.jobs.byId[job]!.stage === 3);
const newSkills = Object.values(future.skills).filter(s => (s.tags as string[]).includes('hi_class'));
function run(id: string, rank: number) {
  const definition = structuredClone(resolveSkill(id, rank, future).definition) as Active;
  definition.timing.after_cast_ms = 60000;
  const healer = actor('caster', 'player', [definition]); healer.stat_blueprint.derived_offsets.max_sp = 2000;
  const stats = resolveStats(healer.stat_blueprint, future);
  healer.stat_blueprint.derived_offsets.physical_attack += 1000 - stats.physical_attack;
  healer.stat_blueprint.derived_offsets.magical_attack += 1000 - stats.magical_attack;
  const friend = actor('friend', 'player'), foes = ['boss', 'add1', 'add2'].map(id => actor(id, 'enemy'));
  const input = { actors: [healer, friend, ...foes], mode: { kind: 'story' as const, ref: 'hi-rule-test', time_limit_ms: 90000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } };
  const initial = structuredClone(unwrap(createBattle(input, future, 17))) as BattleCheckpoint;
  if(Number(definition.cost.spirit_spheres)>0)initial.actors.find(a => a.actor_id === 'caster')!.spirit_spheres = 5;
  for (const a of initial.actors.filter(a => a.team === 'player')) a.hp -= 500000;
  return { initial, result: unwrap(advanceUntil(initial, 14000, future)) };
}
test('13 High jobs add exactly two typed skills each while retaining all126 current IDs and definitions', () => {
  assert.equal(highs.length, 13); assert.equal(newSkills.length, 26);
  for (const job of highs) assert.deepEqual(newSkills.filter(s => s.class_id === job).map(s => s.unlock_level), [70, 80]);
  for (const [id, definition] of Object.entries(content.skills)) assert.deepEqual(future.skills[id], definition);
  assert.equal(content.jobs.order.length, 32); assert.equal(Object.values(content.skills).filter(s => s.class_id !== 'enemy').length, 152);
  assert.ok(content.skills.lord_knight_aura_blade);
});
test('first High skill ranks unlock70..88 and second80..89; prices and max gates use shared quotes', () => {
  for (const row of newSkills) {
    const definition = row as unknown as Active, job = future.jobs.byId[definition.class_id]!;
    const state = initializeAccount(future, { root_job_id: job.root as AccountState['roster'][number]['root_job_id'], gender: job.id === 'gypsy' ? 'female' : 'male' }, '2026-10-23T00:00:00.000Z', '2026-10-23', 17);
    const a = state.roster[0]!; a.job_id = job.id as typeof a.job_id;
    const fullAt = definition.unlock_level === 70 ? 88 : 89;
    a.level = definition.unlock_level - 1; assert.equal(characterSkillCap(a, definition), 0);
    a.level = definition.unlock_level; assert.equal(characterSkillCap(a, definition), 1);
    assert.deepEqual(skillQuote(a, definition.id, 1, future), { gold: 2500, skill_manual: 100 });
    assert.throws(() => skillQuote(a, definition.id, 2, future), /SKILL_CAP_REACHED/);
    a.level = fullAt - 1; assert.equal(characterSkillCap(a, definition), 9);
    a.level = fullAt; assert.equal(characterSkillCap(a, definition), 10);
    assert.deepEqual(skillQuote(a, definition.id, 10, future), { gold: 56500, skill_manual: 2800 });
  }
});
test('all26 new programs resolve every rank, spend actual SP/balls and create their authored damage/support effects', () => {
  for (const row of newSkills) for (let rank = 1; rank <= 10; rank++) {
    const { result } = run(String(row.id), rank), events = result.events.filter(e => e.skill_id === row.id);
    assert.equal(events.filter(e => e.type === 'cast_resolve').length, 1, `${row.id}:${rank}`);
    const casts = events.filter(e => e.type === 'cast_start'); assert.equal(casts.length, 1);
    const definition = resolveSkill(String(row.id), rank, future).definition as Active;
    assert.equal(casts[0]!.amount, definition.cost.sp);
    for (const effect of definition.effects) {
      if(effect.when){if(effect.type==='interrupt'){assert.ok(!events.some(e=>e.type==='cast_interrupt'),'idle targets cannot be interrupted');continue;}if(effect.type==='apply_status'&&['fate_physical','fate_magical'].includes(effect.status_id)&&!events.some(e=>e.effect_id===effect.id))continue;}
      const type = effect.type==='sacrifice_damage'?'damage':effect.type === 'apply_status' ? 'status_applied' : effect.type === 'remove_status' ? 'status_removed' : effect.type;
      if (effect.type === 'apply_status' && Number(effect.chance) < 1) continue;
      assert.ok(events.some(e => e.effect_id === effect.id && e.type === type), `${row.id}:${rank}:${effect.id}`);
    }
  }
});
test('1x/2x/4x and serialized continuation give identical High skill state, event order and seeded CC', () => {
  for (const row of newSkills) {
    const { initial, result: expected } = run(String(row.id), 10);
    for (const speed of [1, 2, 4]) {
      let state: BattleState = structuredClone(initial); const events: BattlePresentationEvent[] = [];
      for (let to = 250 * speed; to < 14000; to += 250 * speed) { const part = unwrap(advanceUntil(state, to, future)); state = JSON.parse(JSON.stringify(part.state)); events.push(...part.events); }
      const final = unwrap(advanceUntil(state, 14000, future)); events.push(...final.events);
      assert.deepEqual(events, expected.events, String(row.id)); assert.deepEqual(final.state, expected.state, String(row.id));
    }
  }
});
test('78 separately stored rank1/5/10 numeric goldens match actual effect events at equal1000ATK/MATK', () => {
  assert.equal(goldens.cases.length, 78);
  for (const row of goldens.cases) {
    const {result,initial}=run(row.skill_id,row.rank);
    for(const effect of row.effects){
      const events=result.events.filter(e=>e.skill_id===row.skill_id&&e.effect_id===effect.effect_id);
      if('raw_power_at_1000' in effect&&typeof effect.raw_power_at_1000==='number'){
        const own=events.filter(e=>['damage','heal','shield'].includes(e.type));assert.ok(own.length,row.skill_id);
        const definition=resolveSkill(row.skill_id,row.rank,future).definition as Active;
        const sphereFactor=Number(definition.cost.spirit_spheres)>0?1+(5-Number(definition.cost.spirit_spheres))*.01:1;
        for(const event of own){const raw=event.type==='damage'?event.raw:event.amount!+Number(event.type==='heal'?event.detail?.split(':')[1]??0:0);const paid='sacrifice_actual_hp_factor'in effect&&effect.sacrifice_actual_hp_factor===true?-(events.find(e=>e.type==='resource_change'&&e.detail==='hp_sacrifice')?.amount??0):0;const hpFactor=1+paid/initial.actors.find(a=>a.actor_id==='caster')!.stats.max_hp;const expected=event.type==='damage'?effect.raw_power_at_1000*sphereFactor*hpFactor:Math.floor(effect.raw_power_at_1000);assert.ok(Math.abs(raw!-expected)<.00001,`${row.skill_id}:${row.rank}:${raw}`);}
      }
      if('status_id'in effect&&effect.chance===1){if('conditional'in effect&&effect.conditional&&!events.some(e=>e.type==='status_applied'))continue;const status=events.find(e=>e.type==='status_applied')!.status_change!;assert.deepEqual(status.params,effect.params);assert.equal(status.expires_at-status.applied_at,effect.duration_ms);}
    }
  }
});
test('native pack contains20user-selected modern and6native High skill icons,13 authentic job emblems and24 High body presets within32MiB', () => {
  const pack = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8'));
  for (const job of highs) {
    const preset = pack.actor_jobs.find((j: {job_id: string}) => j.job_id === job);
    assert.equal(preset.presets.length, ['clown', 'gypsy'].includes(job) ? 1 : 2);
    assert.equal(pack.shell.class_icons[job].asset_id, 'ui.job-' + job);
  }
  for (const row of newSkills) {
    const p = pack.presentations[String(row.presentation_id)]; if(modernBindings.v2_entries.some(r=>r.target===row.id)){assert.equal(p.icon_meta_path,'assets/ro/skills/modern-'+row.id+'.meta.json');}else{assert.ok(p.icon_meta_path.includes('/library/skills/skill_icon/'));const root=content.jobs.byId[String(row.class_id)]!.root,d=JSON.parse(readFileSync('plan/data/presentations/'+root+'.json','utf8')),source=[...d.presentations,...d.hi_class_presentations??[]].find((r:any)=>r.id===p.id);assert.equal(source.provenance.icon_basis,'Exact local native Hi-class skill icon');assert.equal(p.provenance,undefined);}
  }
  const raw = pack.files.reduce((n: number, f: {bytes: number}) => n + f.bytes, 0) + Buffer.byteLength(JSON.stringify(pack));
  assert.ok(raw <= 32 * 1024 * 1024, String(raw));
});
