import test from 'node:test';
import assert from 'node:assert/strict';
import rawJson from '../../src/generated/content.json';
import { createJobCatalog, jobAllowsSkill } from '../../src/content/jobs.ts';
import { validateContent } from '../../src/content/loader.ts';
import { content } from './combat-fixtures.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { allowedSkill, compileCharacterSkills, skillQuote, validateCharacterSkills } from '../../src/domain/progression/skills.ts';
import { skillDefinitionsForJob, skillCatalogJobs } from '../../src/client/skill-catalog.ts';
import { previewJobs, previewSkills } from '../../src/client/skill-preview.ts';
import type { SkillDefinition } from '../../src/contracts/index.ts';

const base = () => ({ class_tree: { swordsman: ['knight', 'crusader'], acolyte: ['monk'] }, promotion: { class2_min_level: 20 } });
const extensions = [
  { job_id: 'rune_knight', parent_job_id: 'lord_knight', minimum_level: 120 },
  { job_id: 'lord_knight', parent_job_id: 'knight', minimum_level: 70 },
  { job_id: 'paladin', parent_job_id: 'crusader', minimum_level: 70 },
];

test('job graph preserves current19 jobs/order and both catalogs match all current memberships', () => {
  const tree = content.documents['progression.json']!.class_tree as unknown as Record<string, string[]>;
  const order = Object.entries(tree).flatMap(([root, jobs]) => [root, ...jobs]);
  assert.equal(order.length, 19); assert.deepEqual(content.jobs.order.filter(j=>content.jobs.byId[j]!.stage<=2), order);
  const allJobs=content.jobs.order;assert.equal(allJobs.length,32);
  assert.deepEqual(skillCatalogJobs.map(j => j.id), allJobs); assert.deepEqual(previewJobs.map(j => j.id), allJobs);
  for (const [root, jobs] of Object.entries(tree)) for (const job of [root, ...jobs]) {
    assert.equal(content.jobs.byId[job]!.root, root);
    assert.deepEqual(content.jobs.byId[job]!.ancestors, job === root ? [root] : [root, job]);
    const expected = Object.values(content.skills).filter(s => s.class_id === root || s.class_id === job).map(s => String(s.id));
    assert.deepEqual(skillDefinitionsForJob(job).map(s => s.id), expected);
    assert.deepEqual(previewSkills(job).map(s => s.id), expected);
  }
  assert.equal(Object.isFrozen(content.jobs), true); assert.equal(Object.isFrozen(content.jobs.byId.knight!.ancestors), true);
});

test('job graph compiles unordered four-stage branches without sibling/cross-root leakage or input mutation', () => {
  const data = { ...base(), job_advancements: extensions }, before = structuredClone(data), jobs = createJobCatalog(data);
  assert.deepEqual(jobs.byId.rune_knight!.ancestors, ['swordsman', 'knight', 'lord_knight', 'rune_knight']);
  assert.equal(jobs.byId.rune_knight!.stage, 4); assert.equal(jobs.byId.lord_knight!.minimumLevel, 70);
  assert.deepEqual(jobs.byId.paladin!.ancestors, ['swordsman', 'crusader', 'paladin']);
  const actor = { job_id: 'lord_knight', root_job_id: 'swordsman' };
  for (const own of ['swordsman', 'knight', 'lord_knight']) assert.equal(jobAllowsSkill(jobs, actor, own), true);
  for (const other of ['crusader', 'paladin', 'rune_knight', 'monk', 'enemy', 'unknown']) assert.equal(jobAllowsSkill(jobs, actor, other), false);
  assert.equal(jobAllowsSkill(jobs, { ...actor, root_job_id: 'acolyte' }, 'swordsman'), false);
  assert.equal(jobAllowsSkill(jobs, { ...actor, job_id: 'unknown' }, 'swordsman'), false);
  assert.deepEqual(data, before);
});

test('job graph rejects malformed roots/parents/cycles/duplicates/decreasing levels and forged roots', () => {
  const cases: unknown[] = [
    null, {}, { ...base(), class_tree: {} }, { ...base(), class_tree: { swordsman: ['knight'], acolyte: ['knight'] } },
    { ...base(), class_tree: { swordsman: ['acolyte'], acolyte: ['monk'] } },
    { ...base(), promotion: { class2_min_level: 0 } }, { ...base(), job_advancements: {} },
    ...[
      [{ job_id: 'lord_knight', parent_job_id: 'missing', minimum_level: 70 }],
      [{ job_id: 'lord_knight', parent_job_id: 'lord_knight', minimum_level: 70 }],
      [{ job_id: 'a', parent_job_id: 'b', minimum_level: 70 }, { job_id: 'b', parent_job_id: 'a', minimum_level: 70 }],
      [extensions[1], extensions[1]], [{ job_id: 'knight', parent_job_id: 'monk', minimum_level: 70 }],
      [{ job_id: 'lord_knight', parent_job_id: 'swordsman', minimum_level: 70 }],
      [{ job_id: 'lord_knight', parent_job_id: 'knight', minimum_level: 19 }],
      [{ ...extensions[1], minimum_level: 70.5 }], [{ ...extensions[1], root_job_id: 'acolyte' }],
    ].map(job_advancements => ({ ...base(), job_advancements })),
  ];
  for (const value of cases) { const before = structuredClone(value); assert.throws(() => createJobCatalog(value), /INVALID_JOB_GRAPH/); assert.deepEqual(value, before); }
});

test('content loader rejects invalid advancement graphs at the progression document boundary', () => {
  const raw = structuredClone(rawJson);
  Object.assign(raw.documents['progression.json'], { job_advancements: [{ job_id: 'lord_knight', parent_job_id: 'missing', minimum_level: 70 }] });
  const result = validateContent(raw); assert.equal(result.ok, false);
  if (result.ok) throw Error('fixture');
  assert.ok(result.errors.some(e => e.source === 'progression.json' && e.message.includes('INVALID_JOB_GRAPH')));
});

test('Hi fixture quotes, validates and compiles existing ancestor skills/passives while rejecting siblings', () => {
  // A lineage fixture, not proof that hosted schemas or Hi-class gameplay are released.
  const progression = { ...structuredClone(content.documents['progression.json']!), job_advancements: [extensions[1]] };
  const rules = { ...content, jobs: createJobCatalog(progression) };
  const state = initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, '2026-10-23T00:00:00.000Z', '2026-10-23', 1);
  const actor = state.roster.find(a => a.character_id === 'main')!;
  actor.job_id = 'lord_knight' as typeof actor.job_id; actor.level = 70;
  actor.skill_levels = { swordsman_bash: 5, knight_pierce: 7, knight_veteran: 3 };
  actor.active_slots = ['swordsman_bash', 'knight_pierce', null, null];
  validateCharacterSkills(actor, rules);
  const before = structuredClone(actor), compiled = compileCharacterSkills(actor, rules);
  assert.equal(compiled.resolved_skills.knight_pierce!.level, 7);
  assert.equal(compiled.resolved_skills.knight_veteran!.definition.kind, 'passive');
  assert.deepEqual(compiled.active_slots, actor.active_slots);
  assert.ok(Number(skillQuote(actor, 'knight_pierce', 8, rules).skill_manual) > 0);
  assert.equal(allowedSkill(actor, content.skills.crusader_holy_cross as unknown as SkillDefinition, rules), false);
  assert.throws(() => skillQuote(actor, 'crusader_holy_cross', 1, rules), /SKILL_UNAVAILABLE/);
  assert.deepEqual(actor, before);
});
