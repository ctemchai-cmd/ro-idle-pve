import type { AccountState, BattleActor, PrimaryStats, StatBlueprint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { resolveStats } from '../math/index.ts';
type Character = AccountState['roster'][number];
/** D-061: fixed per-tree job bonus on primary stats (never grows with level, costs no points). */
export function jobBonus(actor: Pick<Character,'root_job_id'>, content: ValidatedContent): PrimaryStats {
 const table=(content.documents['progression.json']!.status_allocation as unknown as {job_bonus_by_root?:Record<string,PrimaryStats>}).job_bonus_by_root;
 return {str:0,agi:0,vit:0,int:0,dex:0,luk:0,...table?.[actor.root_job_id]};
}
export function characterBlueprint(actor: Character, content: ValidatedContent, permanent: StatBlueprint['permanent_sources'] = []): StatBlueprint {
 const bonus=jobBonus(actor,content),modifiers=(Object.entries(bonus) as [keyof PrimaryStats,number][]).filter(([,value])=>value!==0).map(([stat,value])=>({id:`job_bonus_${stat}`,stat,op:'add_flat' as const,bucket:'primary' as const,value}));
 const sources:StatBlueprint['permanent_sources']=modifiers.length?[{source:{instance_id:`job_bonus_${actor.character_id}`,owner_actor_id:actor.character_id,definition_id:`job_bonus_${actor.root_job_id}`,origin_actor_id:actor.character_id,origin_life_epoch:0},modifiers,triggers:[]}]:[];
 return {kind:'character',level:actor.level,job_id:actor.job_id,allocated_primary:{...actor.primary_stats},derived_offsets:{physical_attack:0,magical_attack:0,max_hp:0,max_sp:0,physical_defense:0,magical_defense:0,attack_speed:0,cast_speed:0},permanent_sources:[...sources,...structuredClone(permanent)],weapon_element:'neutral'};
}
/** Shared by runtime initialization and previews. Never doubles an existing source. */
export function attachLearnedPassives(blueprint: StatBlueprint, owner: string, skills: BattleActor['resolved_skills']): StatBlueprint {
 const next=structuredClone(blueprint);
 for(const {definition}of Object.values(skills))if(definition.kind==='passive'&&!next.permanent_sources.some(row=>row.source.definition_id===definition.id))next.permanent_sources.push({source:{instance_id:`passive_${owner}_${definition.id}`,owner_actor_id:owner,definition_id:definition.id,origin_actor_id:owner,origin_life_epoch:0},modifiers:structuredClone(definition.modifiers),triggers:structuredClone(definition.triggers)});
 return next;
}
export function previewCharacterStats(actor: Character, skills: BattleActor['resolved_skills'], content: ValidatedContent, permanent: StatBlueprint['permanent_sources'] = []) {
 const blueprint=attachLearnedPassives(characterBlueprint(actor,content,permanent),actor.character_id,skills);
 return resolveStats({...blueprint,permanent_sources:blueprint.permanent_sources.map(row=>({...row,modifiers:row.modifiers.filter(m=>!m.when)}))},content);
}
