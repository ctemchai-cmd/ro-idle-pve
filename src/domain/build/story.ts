import type { AccountState, BattleActor, CombatStats, StatBlueprint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { BattleInput, ActorInput } from '../../contracts/battle-input.ts';
import { resolveStats } from '../math/index.ts';
import { resolveSkill } from './resolve-skill.ts';
import { characterBlueprint } from './character.ts';

const positions={front_1:{x:220,y:340},front_2:{x:105,y:490},back_1:{x:200,y:580},back_2:{x:100,y:680}};
export { equippedSources as equippedBaseSources } from './equipment.ts';
import { equippedSources } from './equipment.ts';
/** Mode-independent party compiler; caller supplies validated learned skills and hashes. */
export function storyParty(state:AccountState,content:ValidatedContent,skills:Record<string,Pick<BattleActor,'active_slots'|'resolved_skills'>>,hashes:Record<string,string>):ActorInput[]{
 const compatibility=content.documents['equipment.json']!.weapon_compatibility as Readonly<Record<string,string>>;
 return state.team.map(p=>{const character=state.roster.find(a=>a.character_id===p.character_id)!;const weapon=compatibility[character.job_id];return{actor_id:character.character_id,kind:'party',team:'player',position:p.position,stat_blueprint:characterBlueprint(character,content,equippedSources(character,state,content)),...skills[character.character_id]!,build_hash:hashes[character.character_id]!,normal_attack_enabled:true,tags:[],spatial:{...positions[p.position],move_speed:120,radius:18,normal_range:weapon==='bow'?285:['staff','book'].includes(weapon!)?260:['instrument','whip'].includes(weapon!)?235:76}};});
}
export function fixedEnemyBlueprint(level:number,base:CombatStats,element:string,content:ValidatedContent):StatBlueprint{
 const bp:StatBlueprint={kind:'fixed',level,job_id:null,allocated_primary:{str:base.str,agi:base.agi,vit:base.vit,int:base.int,dex:base.dex,luk:base.luk},derived_offsets:{physical_attack:0,magical_attack:0,max_hp:0,max_sp:0,physical_defense:0,magical_defense:0,attack_speed:0,cast_speed:0},permanent_sources:[],weapon_element:element as StatBlueprint['weapon_element']};
 const baseline=resolveStats(bp,content);for(const key of Object.keys(bp.derived_offsets)as(keyof StatBlueprint['derived_offsets'])[])bp.derived_offsets[key]=base[key]-baseline[key];return bp;
}
/** Boss battle input shared by Story, Tower and Daily; `mode` overrides the Story mode fields (kind/ticket/phase). */
export function storyInput(stage:{id:string;time_limit_ms:number},boss:{actor_id:string;definition_id:string;level:number;position:string;element:string;resolved_base:CombatStats;active_slots:BattleActor['active_slots'];passives:string[]},party:ActorInput[],content:ValidatedContent,mode:Partial<BattleInput['mode']>={}):BattleInput{
 const definition=(content.documents['enemies.json']!.actors as unknown as {id:string;normal_attack:boolean}[]).find(d=>d.id===boss.definition_id);if(!definition)throw new Error('ENEMY_DEFINITION_MISSING');
 const ids=[...boss.active_slots.filter((id):id is string=>id!==null),...boss.passives];
 const traits=(content.documents['cards.json']!.monster_traits as unknown as Record<string,{race:string;size:string}>)[boss.definition_id];
 const enemy:ActorInput={actor_id:boss.actor_id,kind:'enemy',team:'enemy',position:boss.position,stat_blueprint:fixedEnemyBlueprint(boss.level,boss.resolved_base,boss.element,content),active_slots:structuredClone(boss.active_slots),resolved_skills:Object.fromEntries(ids.map(id=>[id,structuredClone(resolveSkill(id,1,content))]))as BattleActor['resolved_skills'],normal_attack_enabled:definition.normal_attack,tags:[`element:${boss.element}`,`element_${boss.element}`,'boss',...(traits?[`race_${traits.race}`,`size_${traits.size}`]:[])],spatial:{x:520,y:400,move_speed:85,radius:30,normal_range:80},build_hash:`story_${stage.id}_${content.manifest.content_hash.slice(0,32)}`};
 return{actors:[...party,enemy],arena:{width:720,height:820,step_ms:50},timing:{skill_interval_base_ms:3000,normal_attack_base_ms:1500},mode:{kind:'story',ref:stage.id,time_limit_ms:stage.time_limit_ms,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[],...mode}};
}
