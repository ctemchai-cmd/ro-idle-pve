import type { AccountState, BattleActor, Command, SkillDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { resolveSkill } from '../build/resolve-skill.ts';
import { ProgressionRejection } from './rejection.ts';
import { jobAllowsSkill } from '../../content/jobs.ts';
type Character = AccountState['roster'][number];
type Wallet = AccountState['wallet'];
export type SkillCommand = Extract<Command, { type: 'skill.upgrade' | 'skill.set_loadout' | 'skill.awaken' | 'skill.convert_shards' }>;
type UpgradeTable = Record<string, { cost_version?:string; learn_level_one_cost?: Partial<Wallet>; upgrade_cost_rows: (Partial<Wallet>&{from_level:number;to_level:number})[] }>;
export const skillIsAwakened = (actor:Pick<Character,'awakened_skills'>,id:string) => actor.awakened_skills?.includes(id)??false;
export function awakeningEnabled(content:ValidatedContent){const p=content.documents['progression.json']!;return Boolean((p.promotion as unknown as {hi_class_enabled:boolean}).hi_class_enabled)&&!(p.release as unknown as {excluded_features:string[]}).excluded_features.includes('awakening');}
function awakeningRules(content:ValidatedContent){return (content.documents['progression.json']!.hi_class as unknown as {awakening:{cost_version:string;unlock_cost:Partial<Wallet>;conversion:{base_per_shard:number;base_from_shard:number}}}).awakening;}
export function skillAwakenQuote(actor:Character,id:string,content:ValidatedContent):Partial<Wallet>{
 if(!awakeningEnabled(content))throw new ProgressionRejection('AWAKEN_UNAVAILABLE');
 if((content.jobs.byId[actor.job_id]?.stage??0)<3)throw new ProgressionRejection('HI_CLASS_REQUIRED');
 const definition=content.skills[id] as unknown as SkillDefinition|undefined;
 if(!definition||!allowedSkill(actor,definition,content))throw new ProgressionRejection('SKILL_UNAVAILABLE');
 if(skillIsAwakened(actor,id))throw new ProgressionRejection('SKILL_ALREADY_AWAKENED');
 if(actor.skill_levels[id]!==definition.max_level)throw new ProgressionRejection('SKILL_NOT_MAXED');
 resolveSkill(id,1,content,true); // Missing/invalid variant must fail before paying.
 return {...awakeningRules(content).unlock_cost};
}
export function shardConversionQuote(direction:'base_to_awakened'|'awakened_to_base',quantity:number,content:ValidatedContent):{cost:Partial<Wallet>;gain:Partial<Wallet>}{
 if(!awakeningEnabled(content))throw new ProgressionRejection('AWAKEN_UNAVAILABLE');
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000)throw new ProgressionRejection('INVALID_CONVERSION_QUANTITY');
 if(!['base_to_awakened','awakened_to_base'].includes(direction))throw new ProgressionRejection('INVALID_CONVERSION_DIRECTION');
 const rate=awakeningRules(content).conversion;
 if(!Number.isSafeInteger(rate.base_per_shard)||!Number.isSafeInteger(rate.base_from_shard)||rate.base_per_shard<=rate.base_from_shard||rate.base_from_shard<1)throw new Error('INVALID_CONVERSION_RATES');
 return direction==='base_to_awakened'?{cost:{skill_manual:quantity*rate.base_per_shard},gain:{awakening_shard:quantity}}:{cost:{awakening_shard:quantity},gain:{skill_manual:quantity*rate.base_from_shard}};
}
function pay(state:AccountState,cost:Partial<Wallet>){
 for(const key of Object.keys(cost)as(keyof Wallet)[])if(!Number.isSafeInteger(cost[key])||cost[key]!<0)throw new Error('INVALID_SKILL_PRICE');else if(state.wallet[key]<cost[key]!)throw new ProgressionRejection('INSUFFICIENT_RESOURCES');
 for(const key of Object.keys(cost)as(keyof Wallet)[])state.wallet[key]-=cost[key]!;
}
export function allowedSkill(actor: Character, definition: SkillDefinition, content: ValidatedContent) { return jobAllowsSkill(content.jobs, actor, definition.class_id); }
export function characterSkillCap(actor: Character, definition: SkillDefinition): number {
 return definition.rank_unlock_levels ? Math.min(definition.max_level, definition.rank_unlock_levels.filter(level => level <= actor.level).length) : Math.min(definition.max_level, 1 + Math.floor((actor.level - 1) / 5));
}
export function skillQuote(actor: Character, id: string, target: number, content: ValidatedContent): Partial<Wallet> {
 const definition = content.skills[id] as unknown as SkillDefinition | undefined;
 if (!definition || !allowedSkill(actor, definition, content)) throw new ProgressionRejection('SKILL_UNAVAILABLE');
 if (actor.level < definition.unlock_level) throw new ProgressionRejection('SKILL_LOCKED');
 const current = actor.skill_levels[id] ?? 0;
 if (!Number.isInteger(target) || target <= current) throw new ProgressionRejection('SKILL_LEVEL_UNCHANGED');
 if (target > characterSkillCap(actor, definition)) throw new ProgressionRejection('SKILL_CAP_REACHED');
 const tables=content.documents[`skills/${actor.root_job_id}.json`]!;
 const table = ((skillIsAwakened(actor,id)?tables.awakened_upgrades:tables.upgrades) as unknown as UpgradeTable)[id];
 if (!table) throw new Error('MISSING_SKILL_PRICE');
 const cost: Partial<Wallet> = current === 0 ? {...table.learn_level_one_cost} : {};
 for(let level=Math.max(1,current);level<target;level++) {
  const row=table.upgrade_cost_rows.find(r=>r.from_level===level&&r.to_level===level+1); if(!row)throw new Error('MISSING_SKILL_PRICE');
  const resources=content.documents['economy.json']!.resources as unknown as {id:keyof Wallet}[];
  for(const {id:key}of resources)if(row[key]!==undefined){const total=(cost[key]??0)+row[key]!;if(!Number.isSafeInteger(total))throw new ProgressionRejection('RESOURCE_OVERFLOW');cost[key]=total;}
 }
 return cost;
}
export function exclusiveLoadoutConflict(actor: Character, slots: readonly (string|null)[], content: ValidatedContent): boolean {
 const rules=(content.documents[`skills/${actor.root_job_id}.json`]!.copy_whitelist??[])as unknown as {skill_id:string;exclusive_group:string}[];
 const counts=new Map<string,number>();
 for(const id of slots){const group=rules.find(r=>r.skill_id===id)?.exclusive_group;if(group){const count=(counts.get(group)??0)+1;if(count>1)return true;counts.set(group,count);}}
 return false;
}
export function validateCharacterSkills(actor: Character, content: ValidatedContent): void {
 if(actor.awakened_skills.some(id=>!actor.skill_levels[id])||actor.awakened_skills.length&&(!awakeningEnabled(content)||(content.jobs.byId[actor.job_id]?.stage??0)<3))throw new Error('INVALID_AWAKENED_SKILL');
 for(const id of actor.awakened_skills)resolveSkill(id,actor.skill_levels[id]!,content,true);
 for(const [id,level]of Object.entries(actor.skill_levels)) {
  const definition=content.skills[id] as unknown as SkillDefinition|undefined;
  if(!definition||!allowedSkill(actor,definition,content)||actor.level<definition.unlock_level||!Number.isInteger(level)||level<1||level>characterSkillCap(actor,definition))throw new Error('INVALID_LEARNED_SKILL');
 }
 const slots=actor.active_slots.filter((id):id is string=>id!==null);
 if(exclusiveLoadoutConflict(actor,slots,content)||slots.length!==new Set(slots).size||slots.some(id=>!actor.skill_levels[id]||content.skills[id]?.kind!=='active'))throw new Error('INVALID_SKILL_LOADOUT');
}
/** Learned Passives enter resolved_skills automatically; the engine attaches their sources. */
export function compileCharacterSkills(actor: Character, content: ValidatedContent): Pick<BattleActor,'active_slots'|'resolved_skills'> {
 validateCharacterSkills(actor,content);
 return {active_slots:structuredClone(actor.active_slots),resolved_skills:Object.fromEntries(Object.entries(actor.skill_levels).map(([id,level])=>[id,structuredClone(resolveSkill(id,level,content,skillIsAwakened(actor,id)))])) as BattleActor['resolved_skills']};
}
export function applySkillCommand(state: AccountState, command: SkillCommand, content: ValidatedContent): string {
 if(state.active_battle)throw new ProgressionRejection('BUILD_LOCKED_DURING_BATTLE');
 if(command.type==='skill.convert_shards'){
  const quote=shardConversionQuote(command.params.direction,command.params.quantity,content);
  for(const [key,n]of Object.entries(quote.gain)as[keyof Wallet,number][])if(!Number.isSafeInteger(state.wallet[key]+n))throw new ProgressionRejection('RESOURCE_OVERFLOW');
  pay(state,quote.cost);for(const [key,n]of Object.entries(quote.gain)as[keyof Wallet,number][])state.wallet[key]+=n;
  return 'SHARDS_CONVERTED';
 }
 const actor=state.roster.find(a=>a.character_id===command.params.character_id);if(!actor)throw new ProgressionRejection('CHARACTER_NOT_FOUND');
 if(command.type==='skill.awaken'){
  const id=command.params.skill_id,cost=skillAwakenQuote(actor,id,content),version=awakeningRules(content).cost_version;
  pay(state,cost);actor.awakened_skills.push(id);actor.skill_levels[id]=1;
  state.paid_ledger.push({entry_id:`investment_${command.request_id}`,character_id:actor.character_id,feature_id:'skill_awaken',skill_id:id,quantity:1,cost_version:version,cost_versions:[version],paid_resources:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...cost}as Wallet,refund_state:'active',refund_command_id:null});
  return 'SKILL_AWAKENED';
 }
 if(command.type==='skill.set_loadout') {
  const slots=command.params.skill_ids, assigned=slots.filter((id):id is string=>id!==null);
  if(assigned.length!==new Set(assigned).size)throw new ProgressionRejection('DUPLICATE_SKILL_SLOT');
  if(exclusiveLoadoutConflict(actor,slots,content))throw new ProgressionRejection('EXCLUSIVE_SKILL_GROUP');
  if(assigned.some(id=>!actor.skill_levels[id]||content.skills[id]?.kind!=='active'))throw new ProgressionRejection('SKILL_NOT_LEARNED_ACTIVE');
  actor.active_slots=structuredClone(slots);return 'SKILL_LOADOUT_UPDATED';
 }
 const {skill_id:id,target_level:target}=command.params,current=actor.skill_levels[id]??0,cost=skillQuote(actor,id,target,content);
 pay(state,cost);
 actor.skill_levels[id]=target;
 const awakened=skillIsAwakened(actor,id),version=awakened?awakeningRules(content).cost_version:String(content.documents[`skills/${actor.root_job_id}.json`]!.content_version);
 state.paid_ledger.push({entry_id:`investment_${command.request_id}`,character_id:actor.character_id,feature_id:awakened?'skill_awaken':'skill',skill_id:id,quantity:target-current,cost_version:version,cost_versions:[version],paid_resources:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...cost}as Wallet,refund_state:'active',refund_command_id:null});
 return current===0?'SKILL_LEARNED':'SKILL_UPGRADED';
}
