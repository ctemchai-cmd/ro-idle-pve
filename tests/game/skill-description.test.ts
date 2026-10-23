import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, SkillDefinition } from '../../src/contracts/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { characterSkillOptions, skillLevelComparison, skillUpgradeChanges } from '../../src/client/skills.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { fixedSpCost } from '../../src/domain/math/combat-modifiers.ts';
import { content } from './combat-fixtures.ts';

function option(id: string, level = 1) {
  const source = content.skills[id] as unknown as SkillDefinition;
  const root = content.jobs.byId[source.class_id]!.root as AccountState['roster'][number]['root_job_id'];
  const state = initializeAccount(content, { root_job_id: root, gender: 'male' }, '2026-10-22T00:00:00Z', '2026-10-22', 1), actor = state.roster[0]!;
  actor.level = content.jobs.byId[source.class_id]!.stage >= 3 ? 90 : 70; actor.job_id = source.class_id as typeof actor.job_id; if (level) actor.skill_levels[id] = level; else delete actor.skill_levels[id];
  return characterSkillOptions(actor, state).skills.find(s => s.id === id)!;
}
test('Call Spirit1–10 shows1–5 gained spheres then1.2–2% ATK per sphere, with exact upgrade deltas', () => {
  const skill = option('monk_call_spirits'), comparison = skillLevelComparison(skill);
  assert.equal(comparison.spOnly, false); assert.deepEqual(comparison.rows.map(r => r.sp), [27,26,25,24,23,22,21,20,19,18]);
  const counts=[1,2,3,4,5,5,5,5,5,5], percents=[1,1,1,1,1,1.2,1.4,1.6,1.8,2];
  for(const [i,row]of comparison.rows.entries()) {
    assert.ok(row.effects.join(' ').includes(`บอล +${counts[i]} ลูก`));
    assert.ok(row.effects.join(' ').includes(`${percents[i]}%/ลูก`));
    assert.ok(skill.notes!.join(' ').includes('หลังใช้สกิล'));
    if(i)assert.ok(skillUpgradeChanges(comparison.rows[i-1]!,row).length>=2);
  }
  assert.equal(comparison.rows[4]!.sp, 23); assert.equal(new Set(comparison.rows.map(r => JSON.stringify(r.effects))).size, 10);
});
test('Provoke1–10 scales4.5→7.5s/all-enemy target override and clearly excludes area/random; SP19→10', () => {
  const skill = option('swordsman_provoke'), comparison = skillLevelComparison(skill);
  assert.equal(skill.targetNote, 'ศัตรู · ทั้งหมด'); assert.equal(comparison.spOnly, false);
  assert.deepEqual(comparison.rows.map(r => r.sp), [19,18,17,16,15,14,13,12,11,10]);
  assert.match(skill.effects.join(' '), /4.5s/); assert.match(skill.notes!.join(' '), /ผู้ยั่วยุที่ยังมีชีวิต.*ท่าหมู่\/สุ่มเป้า/);
  assert.equal(comparison.rows[4]!.sp, 15); assert.equal(new Set(comparison.rows.map(r => JSON.stringify(r.effects))).size, 10);
});
test('actual sole endow names Fire/6.5s/team and scope; Enchant Poison only claims ATK', () => {
  const endow = option('sage_fire_endow'), poison = option('assassin_enchant_poison');
  assert.equal(endow.targetNote, 'ฝ่ายเรา · ทั้งหมด'); assert.match(endow.effects.join(' '), /6.5s.*อาวุธธาตุไฟ/);
  assert.match(endow.notes!.join(' '), /ตีปกติ\/สกิลตามอาวุธ.*ไม่เปลี่ยนสกิลธาตุตายตัวหรือเกราะ/);
  assert.match(poison.effects.join(' '), /เพิ่มพลังโจมตี/); assert.ok(!poison.effects.join(' ').includes('เปลี่ยนธาตุ'));
  const endows = Object.values(content.statuses).filter(s => typeof s.weapon_element === 'string');
  assert.deepEqual(endows.map(s => s.id), ['fire_endow']);
});
test('preview SP respects actual cost modifier and max/unlearned/capped levels remain read-only', () => {
  const skill = option('monk_call_spirits', 10); skill.previewSpPercent = .15;
  const rows = skillLevelComparison(skill).rows;
  assert.equal(rows[0]!.sp, fixedSpCost(27, { sp_cost_percent: .15 })); assert.equal(rows[9]!.sp, fixedSpCost(18, { sp_cost_percent: .15 }));
  for (const level of [0, 1, 5, 10]) { const s = option('monk_call_spirits', level); s.cap = 3; const before = JSON.stringify(s); assert.equal(skillLevelComparison(s).rows.length, 10); assert.equal(JSON.stringify(s), before); }
});
test('upgrade summary includes ACD as well as CT, SP and effect changes; all-current SP is readable', () => {
  const row = skillLevelComparison(option('mage_fire_bolt')).rows[0]!, next = { ...row, castMs: row.castMs - 100, afterCastMs: row.afterCastMs - 200, sp: row.sp! - 1, effects: ['เวท 300% MATK'] };
  const changes = skillUpgradeChanges(row, next).join(' '); assert.match(changes, /SP .* →/); assert.match(changes, /ร่าย .* →/); assert.match(changes, /พัก .* →/); assert.match(changes, /300% MATK/);
  const asura = option('monk_asura'); assert.match(asura.effects.join(' '), /ใช้ SP ทั้งหมด.*ขั้นต่ำ.*ใช้บอล/);
  assert.ok(skillLevelComparison(asura).rows.every(r => r.sp === null));
});
test('Passive proc chance is explicit and SpiritCombo15→35% upgrades produce a real visible delta', () => {
  const comparison = skillLevelComparison(option('monk_spirit_combo'));
  assert.match(comparison.rows[0]!.effects.join(' '), /ตีปกติโดน.*โอกาส 15%/);
  assert.match(comparison.rows[9]!.effects.join(' '), /โอกาส 35%/);
  assert.match(skillUpgradeChanges(comparison.rows[0]!, comparison.rows[1]!).join(' '), /โอกาส 15 → 17.22%/);
});
test('Spirit Combo description uses the same learned Call Spirit rank as the actor sphere bonus', () => {
  const s=option('monk_spirit_combo',10);
  s.previewSkills={...s.previewSkills,monk_call_spirits:{level:10,definition:structuredClone(resolveSkill('monk_call_spirits',10,content).definition)as SkillDefinition}};
  assert.match(skillLevelComparison(s).rows[0]!.effects.join(' '),/2%\/ลูก/);
});
test('all126 skill level previews use exact shared resolved data and never mutate content or emit NaN', () => {
  const before = JSON.stringify(content.skills); let count = 0;
  for (const source of Object.values(content.skills).filter(s => s.class_id !== 'enemy')) {
    const s = option(String(source.id)), comparison = skillLevelComparison(s); count++;
    for (const row of comparison.rows) {
      assert.deepEqual(row.definition, resolveSkill(s.id, row.level, content).definition);
      assert.ok(!row.effects.join(' ').includes('NaN'), s.id);
      if (row.definition.kind === 'active' && typeof row.definition.cost.sp === 'number') assert.equal(row.sp, fixedSpCost(row.definition.cost.sp, { sp_cost_percent: s.previewSpPercent }));
      if (row.level > 1 && JSON.stringify(row.definition) !== JSON.stringify(comparison.rows[row.level - 2]!.definition)) assert.ok(skillUpgradeChanges(comparison.rows[row.level - 2]!, row).length > 0, `${s.id} Lv.${row.level} changed silently`);
    }
  }
  assert.equal(count, 152); assert.equal(JSON.stringify(content.skills), before);
});

test('upgrade deltas omit unchanged clauses and preserve signed values, units and repeated changing numbers', () => {
  const row=skillLevelComparison(option('monk_call_spirits')).rows[0]!;
  const a={...row,sp:row.sp,effects:['บอล +5 ลูก · ATK +1%/ลูก']},b={...a,effects:['บอล +5 ลูก · ATK +1.2%/ลูก']};
  assert.deepEqual(skillUpgradeChanges(a,b),['ATK +1 → +1.2%/ลูก']);
  assert.deepEqual(skillUpgradeChanges({...a,effects:['ช้าลง -30% · 5s']},{...b,effects:['ช้าลง -20% · 5s']}),['ช้าลง -30 → -20%']);
  assert.deepEqual(skillUpgradeChanges({...a,effects:['เกราะ -5%']},{...b,effects:['เกราะ +5%']}),['เกราะ -5 → +5%']);
  assert.deepEqual(skillUpgradeChanges({...a,effects:['ฮีล 20% P.ATK + 20']},{...b,effects:['ฮีล 25% P.ATK + 30']}),['ฮีล 20 → 25% P.ATK + 20 → 30']);
});
