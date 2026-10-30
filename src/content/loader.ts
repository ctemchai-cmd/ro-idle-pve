import type { ContentIssue, DefinitionLocation, RawContent, Result, ValidatedContent } from './model.ts';
import type { Json, ObjectValue } from './value.ts';
import { arrayAt, canonical, freeze, isObject, objectAt } from './value.ts';
import { ContentValidator, demand, InvalidContent } from './validation.ts';
import { createJobCatalog, type JobCatalog } from './jobs.ts';
import { projectContentDocuments } from './extensions.ts';
import { validateTowerRewardSchedule } from './tower-rewards.ts';

const object = (value: Json | undefined) => objectAt(value, 'content');
const list = (value: Json | undefined) => arrayAt(value, 'content');
const CLASS_ROOTS = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'];
const FIXED = ['progression', 'combat-rules', 'stat-definitions', 'status-effects', 'class-status-effects', 'effect-primitives', 'formula-registry', 'equipment', 'cards', 'slot-progress', 'economy', 'loot', 'gacha', 'stages', 'enemies', 'tower', 'daily-bosses', 'summon-actors', 'save-contracts', 'simulation-contracts'];
const SCHEMAS = ['account-state', 'battle-checkpoint', 'command', 'common', 'effect', 'formula-call', 'item', 'modifier', 'patch', 'predicate', 'receipt', 'selector', 'simulation-scenario', 'skill', 'status', 'trigger'];

export function validateContent(raw: unknown): Result<ValidatedContent> {
  const errors: ContentIssue[] = [];
  const attempt = (location: DefinitionLocation, fn: () => void) => {
    try { fn(); } catch (error) { errors.push(error instanceof InvalidContent ? error.issue : { ...location, code: 'invalid_content', message: String(error) }); }
  };
  const root = { source: 'content bundle', path: '' };
  let bundle: RawContent;
  try {
    canonical(raw);
    demand(isObject(raw) && isObject(raw.documents) && isObject(raw.schemas) && isObject(raw.manifest), 'bundle_shape', root);
    bundle = structuredClone(raw) as unknown as RawContent;
    bundle.documents = projectContentDocuments(bundle.documents);
    demand(bundle.manifest.schema_version === 1 && bundle.manifest.content_version === 'class2-v1.0.0' && bundle.manifest.rules_version === 'combat-baseline-v1', 'version', root);
    for (const key of ['content_hash', 'engine_data_hash', 'schema_hash', 'implementation_hash'] as const) demand(/^[a-f0-9]{64}$/.test(bundle.manifest[key]), 'version_hash', { ...root, path: `/manifest/${key}` });
    demand(canonical(Object.keys(bundle.schemas).sort()) === canonical([...SCHEMAS].sort()), 'schema_catalog', root);
    for (const file of [...FIXED.map(name => `${name}.json`), ...CLASS_ROOTS.map(name => `skills/${name}.json`), 'strings.th.json', 'actor-presentations.json']) demand(isObject(bundle.documents[file]), 'missing_document', { source: file, path: '' });
  } catch (error) { return { ok: false, errors: [error instanceof InvalidContent ? error.issue : { ...root, code: 'bundle_shape', message: String(error) }] }; }
  let validator: ContentValidator;
  try { validator = new ContentValidator(bundle.schemas); } catch (error) { return { ok: false, errors: [{ ...root, code: 'schema_catalog', message: String(error) }] }; }
  const skills: Record<string, ObjectValue> = Object.create(null), items: Record<string, ObjectValue> = Object.create(null), actors: Record<string, ObjectValue> = Object.create(null);
  const rows: { kind: 'skill' | 'item' | 'status'; value: ObjectValue; location: DefinitionLocation }[] = [];
  function register(file: string, key: string, registry: Record<string, ObjectValue>, kind?: 'skill' | 'item' | 'status') {
    const sourceData = bundle.documents[file]!;
    attempt({ source: file, path: `/${key}` }, () => {
      for (const [index, value] of list(sourceData[key]).entries()) {
        const row = object(value), id = String(row.id), at = { source: file, definition_id: id, path: `/${key}/${index}` };
        attempt(at, () => {
          demand(typeof row.id === 'string' && row.id.length > 0, 'invalid_id', at);
          demand(!(id in registry), 'duplicate_id', at, `Duplicate ID ${id}`);
          registry[id] = row;
          if (kind) rows.push({ kind, value: row, location: at });
        });
      }
    });
  }
  for (const file of ['status-effects.json', 'class-status-effects.json']) register(file, 'statuses', validator.statuses, 'status');
  register('stat-definitions.json', 'stats', validator.stats);
  register('summon-actors.json', 'actors', actors);
  register('enemies.json', 'actors', actors);
  for (const id of Object.keys(actors)) validator.actorIds.add(id);
  for (const name of CLASS_ROOTS) register(`skills/${name}.json`, 'skills', skills, 'skill');
  register('enemies.json', 'skills', skills, 'skill');
  for(const id of Object.keys(skills))validator.skillIds.add(id);
  for (const file of ['equipment.json', 'cards.json']) register(file, 'definitions', items, 'item');
  for (const row of rows) attempt(row.location, () => validator.definition(row.kind, row.value, row.location));
  for (const name of CLASS_ROOTS) {
    const variants = bundle.documents[`skills/${name}.json`]!.awakened_variants;
    if (isObject(variants)) for (const [id, value] of Object.entries(variants)) attempt({source:`skills/${name}.json`,definition_id:id,path:`/awakened_variants/${id}`},()=>{
      const row=object(value),base=skills[id];
      // Closed High variants are still validated as typed programs, but not admitted to play.
      const authoredBase=base??list(bundle.documents[`skills/${name}.json`]!.hi_class_skills??[]).map(object).find(s=>s.id===id);
      demand(authoredBase&&row.id===id&&row.class_id===authoredBase.class_id&&row.presentation_id===authoredBase.presentation_id,'invalid_awaken_variant',{source:`skills/${name}.json`,path:`/awakened_variants/${id}`});
      validator.definition('skill',row,{source:`skills/${name}.json`,definition_id:id,path:`/awakened_variants/${id}`});
    });
  }
  attempt({ source: 'stat-definitions.json', path: '/combat_resources' }, () => validator.resourceModifiers(list(bundle.documents['stat-definitions.json']!.combat_resources), skills, { source: 'stat-definitions.json', path: '/combat_resources' }));
  const docAt = (file: string) => ({ source: file, path: '' });
  attempt(docAt('economy.json'),()=>{
    const shop=object(bundle.documents['economy.json']!.shop),offers=list(shop.offers),at={source:'economy.json',path:'/shop'},resources=new Set(list(bundle.documents['economy.json']!.resources).map(r=>String(object(r).id)));
    const buy=list(bundle.schemas.command!.oneOf).map(object).find(row=>object(object(row.properties).type).const==='shop.buy');
    demand(buy,'shop_command_missing',at);
    const params=object(object(buy!.properties).params),quantity=object(object(params.properties).quantity);
    demand(Number.isSafeInteger(shop.max_quantity_per_command)&&Number(shop.max_quantity_per_command)>=1&&Number(shop.max_quantity_per_command)<=Number(quantity.maximum),'shop_batch_limit',at);
    const seen=new Set<string>();
    for(const value of offers){const offer=object(value),id=String(offer.id),price=object(offer.price),grant=object(offer.grant),consumables=object(offer.consumable_grant??{}),crafting=object(offer.crafting_grant??{});
      demand(/^[a-z][a-z0-9_]*$/.test(id)&&!seen.has(id),'shop_offer_id',at);seen.add(id);
      demand(Number.isSafeInteger(offer.daily_limit)&&Number(offer.daily_limit)>=1,'shop_daily_limit',at);
      for(const vector of[price,grant])for(const[key,amount]of Object.entries(vector))demand(resources.has(key)&&Number.isSafeInteger(amount)&&Number(amount)>=0,'shop_resource_amount',at);
      demand(Object.values(price).some(n=>Number(n)>0)&&([...Object.values(grant),...Object.values(consumables),...Object.values(crafting)].some(n=>Number(n)>0)),'shop_empty_offer',at);
      for(const amount of Object.values(consumables))demand(Number.isSafeInteger(amount)&&Number(amount)>0,'shop_consumable_amount',at);
      for(const[key,n]of Object.entries(crafting))demand(['option_stone','rarity_stone'].includes(key)&&Number.isSafeInteger(n)&&Number(n)>0,'shop_crafting_amount',at);
    }
  });
  attempt(docAt('equipment.json'),()=>{
    const value=bundle.documents['equipment.json']!.crafting;if(value===undefined)return;
    const rules=object(value),at={source:'equipment.json',path:'/crafting'},materials=object(rules.materials),cost=object(rules.option_roll_cost);
    demand(canonical(Object.keys(materials).sort())===canonical(['option_stone','rarity_stone']),'crafting_materials',at);
    demand(Number.isSafeInteger(cost.option_stone)&&Number(cost.option_stone)>0,'crafting_roll_cost',at);
    const rarity=list(bundle.documents['equipment.json']!.rarities).map(object),steps=list(rules.rarity_steps);
    demand(steps.length===rarity.length-1,'crafting_rarity_steps',at);
    steps.forEach((v,i)=>{const s=object(v);demand(s.from===rarity[i]!.id&&s.to===rarity[i+1]!.id&&['stones','gold'].every(k=>Number.isSafeInteger(s[k])&&Number(s[k])>0),'crafting_rarity_step',at);});
  });
  attempt(docAt('slot-progress.json'), () => {
    const slots = bundle.documents['slot-progress.json']!, refine = object(object(slots.refine).per_step_modifiers), enchant = object(object(slots.enchant).slot_lines);
    const config=object(slots.refine),max=config.max,chances=object(config.success_chance_by_target),pity=object(config.pity),prices=list(config.upgrade_rows);
    const at=docAt('slot-progress.json'),prob=(n:Json|undefined)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1;
    demand(typeof max==='number'&&Number.isSafeInteger(max)&&max>=1,'refine_max',at);
    demand(Object.keys(chances).length===max&&prices.length===max,'refine_levels',at);
    for(let level=1;level<=Number(max);level++){
      demand(prob(chances[String(level)]),'refine_chance',at);
      const row=object(prices[level-1]);demand(row.from===level-1&&row.to===level&&['gold','refine_ore'].every(k=>typeof row[k]==='number'&&Number.isSafeInteger(row[k])&&Number(row[k])>=0),'refine_price',at);
    }
    demand(prob(pity.bonus_per_failure)&&prob(pity.cap),'refine_pity',at);
    if(pity.bonus_per_failure_by_target!==undefined)for(const[target,bonus]of Object.entries(object(pity.bonus_per_failure_by_target)))demand(/^[1-9]\d*$/.test(target)&&Number(target)<=Number(max)&&prob(bonus),'refine_pity_target',at);
    const capacities=list(object(slots.cards).capacity_by_refine);
    demand(capacities.length>=1,'socket_levels',at);
    capacities.forEach((value,index)=>{const row=object(value),prior=index?object(capacities[index-1]):undefined;
      demand(typeof row.minimum_refine==='number'&&Number.isSafeInteger(row.minimum_refine)&&row.minimum_refine>=0&&row.minimum_refine<=Number(max)&&typeof row.slots==='number'&&Number.isSafeInteger(row.slots)&&row.slots>=0&&row.slots<=3&&(!index?row.minimum_refine===0:row.minimum_refine>Number(prior!.minimum_refine)&&row.slots>Number(prior!.slots)),'socket_level',at);
    });
    const names = ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'];
    demand(canonical(Object.keys(refine).sort()) === canonical(names.slice().sort()) && canonical(Object.keys(enchant).sort()) === canonical(names.slice().sort()), 'slot_catalog', docAt('slot-progress.json'));
    const validate = (values: Json[], path: string) => {
      const at = { source: 'slot-progress.json', path };
      values.forEach((m, i) => { validator.shape('modifier', m, { ...at, path: `${path}/${i}` }); demand(typeof object(m).value === 'number' && !object(m).when, 'slot_modifier_value', at); });
      validator.modifiers(values, at);
    };
    for (const slot of names) {
      validate(list(refine[slot]), `/refine/per_step_modifiers/${slot}`);
      const lines = object(enchant[slot]);
      demand(canonical(Object.keys(lines).sort()) === canonical(['offense', 'precision', 'vitality']), 'enchant_lines', docAt('slot-progress.json'));
      for (const [id, entry] of Object.entries(lines)) {
        const row = object(entry); demand(typeof row.label === 'string' && row.label.length > 0, 'enchant_label', docAt('slot-progress.json'));
        validate(list(row.modifiers), `/enchant/slot_lines/${slot}/${id}/modifiers`);
      }
    }
  });
  for (const [file, doc] of Object.entries(bundle.documents)) attempt(docAt(file), () => {
    demand(file.endsWith('.json') && !file.includes('..') && !file.startsWith('/'), 'document_path', docAt(file));
    demand(FIXED.some(name => `${name}.json` === file) || CLASS_ROOTS.some(name => `skills/${name}.json` === file) || ['strings.th.json', 'actor-presentations.json'].includes(file) || /^presentations\/[a-z]+\.json$/.test(file), 'unknown_document', docAt(file));
    demand(doc.schema_version === 1, 'schema_version', docAt(file));
    demand(String(doc.content_version ?? doc.version ?? doc.rules_version ?? 'schema1') === bundle.manifest.document_versions[file], 'content_version', docAt(file));
  });
  attempt(docAt('registry'), () => {
    const formulas = list(bundle.documents['formula-registry.json']!.formulas).map(row => String(object(row).id));
    demand(canonical(formulas.slice().sort()) === canonical(['physical_power', 'magical_power', 'healing_power', 'flat_power', 'sp_burst_power', 'event_damage_power'].sort()), 'formula_registry', docAt('formula-registry.json'));
    const effects = list(bundle.documents['effect-primitives.json']!.effects).map(row => String(object(row).id));
    const legacyEffects=['damage','heal','apply_status','shield','resource_change','remove_status','interrupt','summon','revive','handler'];
    demand(new Set(effects).size===effects.length&&legacyEffects.every(id=>effects.includes(id))&&effects.every(id=>[...legacyEffects,'sacrifice_damage'].includes(id)), 'effect_registry', docAt('effect-primitives.json'));
    const handlers = list(bundle.documents['effect-primitives.json']!.handler_registry).map(row => String(object(row).id));
    demand(canonical(handlers) === canonical(['detonate_own_status']), 'handler_registry', docAt('effect-primitives.json'));
  });
  let jobs: JobCatalog | undefined;
  attempt(docAt('progression.json'), () => {
    const progression = bundle.documents['progression.json']!;
    jobs = createJobCatalog(progression);
    const classes = new Set(jobs.order);
    for (const row of Object.values(skills)) demand(classes.has(String(row.class_id)) || row.class_id === 'enemy', 'unknown_class', { source: 'skills', definition_id: String(row.id), path: '/class_id' });
    const strings = object(bundle.documents['strings.th.json']!.strings);
    for (const row of [...Object.values(skills), ...Object.values(items)]) demand(String(row.name_key) in strings || String(row.id).startsWith('enemy_'), 'unknown_name_key', { source: 'strings.th.json', definition_id: String(row.id), path: `/strings/${String(row.name_key)}` });
  });
  attempt(docAt('presentations'), () => {
    const presentations: Record<string, ObjectValue> = Object.create(null);
    for (const file of [...CLASS_ROOTS.map(name => `presentations/${name}.json`), 'equipment.json', 'cards.json']) {
      demand(bundle.documents[file], 'missing_document', docAt(file));
      for (const row of list(bundle.documents[file]!.presentations)) {
        const entry = object(row), id = String(entry.id);
        // Item/card presentation rows use definition_id rather than standalone IDs.
        const key = typeof entry.id === 'string' ? id : String(entry.definition_id);
        demand(!(key in presentations), 'duplicate_id', { source: file, path: '/presentations' }, key);
        presentations[key] = entry;
      }
    }
    for (const row of Object.values(skills)) if (row.presentation_id) demand(String(row.presentation_id) in presentations, 'unknown_presentation', { source: 'skills', definition_id: String(row.id), path: '/presentation_id' });
  });
  for (const [id, actor] of Object.entries(actors)) attempt({ source: 'actors', definition_id: id, path: '' }, () => {
    for (const skill of list(actor.active_slots ?? []).filter(Boolean)) demand(String(skill) in skills, 'unknown_skill', { source: 'actors', definition_id: id, path: '/active_slots' });
    for (const skill of list(actor.passives ?? [])) demand(skills[String(skill)]?.kind === 'passive', 'unknown_skill', { source: 'actors', definition_id: id, path: '/passives' });
    if (actor.action) { const action = object(actor.action); validator.program(list(action.effects), object(action.selectors), { source: 'summon-actors.json', definition_id: id, path: '/action' }, 'periodic', 'event'); }
  });
  attempt(docAt('stages.json'), () => {
    const seen = new Set<string>();
    for (const stageValue of list(bundle.documents['stages.json']!.stages)) {
      const stage = object(stageValue), id = String(stage.id), at = { source: 'stages.json', definition_id: id, path: '/stages' };
      demand(!seen.has(id), 'duplicate_id', at); seen.add(id);
      if (stage.unlock_after !== null) demand(seen.has(String(stage.unlock_after)), 'unknown_stage', at);
      const chapter = String(stage.farm_rate_chapter);
      demand(list(bundle.documents['economy.json']!.rates).some(row => String(object(row).chapter) === chapter), 'missing_farm_rate', at);
      const loot = bundle.documents['loot.json']!;
      demand(Number(object(object(loot.gear).tier_by_chapter)[chapter]) > 0, 'missing_loot_tier', at);
      demand(Number(object(object(loot.cards).tier_by_chapter)[String(stage.chapter)]) > 0, 'missing_card_tier', at);
      demand(stage.enemy_identity === undefined || stage.enemy_identity === 'definition', 'invalid_enemy_identity', at);
      const gate=stage.release_gate===undefined?null:object(stage.release_gate), cap=Number(object(bundle.documents['progression.json']!.release).level_cap);
      if(gate)demand(['hi_class','awakening'].includes(String(gate.feature))&&Number.isSafeInteger(gate.minimum_level_cap)&&Number(gate.minimum_level_cap)>=Number(stage.recommended_party_level)&&Object.keys(gate).every(k=>['feature','minimum_level_cap'].includes(k)), 'invalid_story_release_gate', at);
      for (const enemyValue of list(stage.encounter)) {
        const enemy = object(enemyValue);
        demand(Number.isSafeInteger(enemy.level)&&Number(enemy.level)>=1&&Number(enemy.level)<=120&&(gate?Number(enemy.level)<=Number(gate.minimum_level_cap):Number(enemy.level)<=cap), 'invalid_story_enemy_level', at);
        demand(String(enemy.definition_id) in actors, 'unknown_actor', at);
        for (const skill of list(enemy.active_slots).filter(Boolean)) demand(skills[String(skill)]?.kind === 'active', 'unknown_skill', at);
        for (const skill of list(enemy.passives)) demand(skills[String(skill)]?.kind === 'passive', 'unknown_skill', at);
      }
    }
  });
  attempt(docAt('loot.json'),()=>{const value=bundle.documents['loot.json']!.crafting;if(value===undefined)return;const rules=object(value),at=docAt('loot.json');demand(rules.version==='crafting_farm_v1'&&rules.roll_interval_ms===300000&&rules.chance_denominator===1000000,'crafting_farm_rules',at);const chances=object(rules.chapter_chances);for(const stage of list(bundle.documents['stages.json']?.stages??[])){const chapter=String(object(stage).farm_rate_chapter);demand(chances[chapter]!==undefined,'crafting_farm_chapter',at);}for(const row of Object.values(chances)){const values=object(row);demand(canonical(Object.keys(values).sort())===canonical(['option_stone','rarity_stone']),'crafting_farm_materials',at);for(const v of Object.values(values))demand(Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=1000000,'crafting_farm_chance',at);}});
  attempt(docAt('loot.json'), () => {
    const gear = object(bundle.documents['loot.json']!.gear);
    const equipment = Object.values(items).filter(item => item.kind === 'equipment');
    for (const tier of Object.values(object(gear.tier_by_chapter))) demand(equipment.filter(item => item.tier_level === tier).length === 36, 'missing_loot_tier', docAt('loot.json')); // D-068: 20 weapons + 16 armor-slot kinds per tier
    for (const value of list(bundle.documents['gacha.json']!.definitions)) demand(items[String(value)]?.kind === 'card', 'unknown_item', docAt('gacha.json'));
  });
  attempt(docAt('tower.json'), () => {
    const schedule = bundle.documents['tower.json']!.reward_schedule;
    if (schedule !== undefined) validateTowerRewardSchedule(schedule);
    const generator = object(bundle.documents['tower.json']!.generator);
    for (const id of list(generator.template_cycle)) demand(String(id) in actors, 'unknown_actor', docAt('tower.json'));
    for (const queue of list(generator.skill_cycle)) for (const id of list(queue)) demand(skills[String(id)]?.kind === 'active', 'unknown_skill', docAt('tower.json'));
    for (const bossValue of list(bundle.documents['daily-bosses.json']!.bosses)) {
      const boss = object(bossValue), at = { source: 'daily-bosses.json', definition_id: String(boss.id), path: '/bosses' };
      demand(String(boss.enemy_definition_id) in actors, 'unknown_actor', at);
      for (const id of list(boss.active_slots).filter(Boolean)) demand(skills[String(id)]?.kind === 'active', 'unknown_skill', at);
    }
  });
  attempt(docAt('equipment.json'),()=>{
    const value=bundle.documents['equipment.json']!.artifacts;if(value===undefined||!object(bundle.documents['progression.json']!.promotion).hi_class_enabled)return;
    const r=object(value),rows=list(r.definitions).map(object),ids=new Set<string>();
    for(const d of rows){demand(typeof d.id==='string'&&!ids.has(d.id),'artifact_unique',docAt('equipment.json'));ids.add(String(d.id));demand(!!jobs?.byId[String(d.class_id)],'artifact_job',docAt('equipment.json'));demand(['common','uncommon','rare','epic','legendary'].includes(String(d.rarity_id)),'artifact_rarity',docAt('equipment.json'));}
    for(const key of ['capacity','draw_crystal','legendary_pity'])demand(Number.isSafeInteger(r[key])&&Number(r[key])>0,'artifact_limits',docAt('equipment.json'));
    const costs=list(r.level_costs).map(object);demand(costs.length===9&&costs.every((row,i)=>row.to===i+2&&['gold','essence'].every(key=>Number.isSafeInteger(row[key])&&Number(row[key])>0)),'artifact_costs',docAt('equipment.json'));
    demand(list(r.star_copies).length===5&&list(r.star_copies).every(n=>Number.isSafeInteger(n)&&Number(n)>=1&&Number(n)<=3),'artifact_stars',docAt('equipment.json'));
    const active=Object.values(skills).filter(s=>s.kind==='active'&&s.class_id!=='enemy');
    if(active.length===120){demand(rows.length===active.length,'artifact_coverage',docAt('equipment.json'));for(const skill of active)demand(rows.filter(d=>d.skill_id===skill.id&&d.class_id===skill.class_id).length===1,'artifact_skill',docAt('equipment.json'));}
    const rarities=object(r.rarities);demand(Object.values(rarities).reduce<number>((n,v)=>n+Number(object(v).weight),0)===100,'artifact_weights',docAt('equipment.json'));
    for(const v of Object.values(rarities)){const rarity=object(v);demand(Number.isSafeInteger(rarity.weight)&&Number(rarity.weight)>0&&Number.isSafeInteger(rarity.salvage)&&Number(rarity.salvage)>0&&Number(rarity.start)>0&&Number(rarity.max)>=Number(rarity.start)&&Number(rarity.max)<=1,'artifact_power',docAt('equipment.json'));}
  });
  attempt(docAt('tower.json'),()=>{const value=bundle.documents['tower.json']!.mvp_hunt;if(value===undefined)return;const r=object(value);demand(r.tiers===10&&Number(r.hp_growth)>1&&Number(r.attack_growth)>1,'mvp_growth',docAt('tower.json'));for(const value of list(r.bosses)){const b=object(value),queue=list(b.skills);demand(String(b.id) in actors&&queue.length===4&&new Set(queue).size===4,'mvp_identity_rotation',docAt('tower.json'));for(const id of queue)demand(skills[String(id)]?.kind==='active','mvp_skill',docAt('tower.json'));}});
  return errors.length ? { ok: false, errors } : { ok: true, value: freeze({ manifest: bundle.manifest, documents: bundle.documents, jobs: jobs!, skills, items, statuses: validator.statuses, actors, schemas: bundle.schemas }) };
}
