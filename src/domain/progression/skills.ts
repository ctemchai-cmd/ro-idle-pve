import type { AccountState, BattleActor, Command, SkillDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { resolveSkill } from '../build/resolve-skill.ts';
import { ProgressionRejection } from './rejection.ts';
import { jobAllowsSkill } from '../../content/jobs.ts';
type Character = AccountState['roster'][number];
type Wallet = AccountState['wallet'];
export type SkillCommand = Extract<Command, { type: 'skill.upgrade' | 'skill.set_loadout' }>;
type UpgradeTable = Record<string, { learn_level_one_cost: Partial<Wallet>; upgrade_cost_rows: {from_level:number;to_level:number;gold:number;skill_manual:number}[] }>;
export function allowedSkill(actor: Character, definition: SkillDefinition, content: ValidatedContent) { return jobAllowsSkill(content.jobs, actor, definition.class_id); }
export function characterSkillCap(actor: Character, definition: SkillDefinition): number { return Math.min(definition.max_level, 1 + Math.floor((actor.level - 1) / 5)); }
export function skillQuote(actor: Character, id: string, target: number, content: ValidatedContent): Partial<Wallet> {
 const definition = content.skills[id] as unknown as SkillDefinition | undefined;
 if (!definition || !allowedSkill(actor, definition, content)) throw new ProgressionRejection('SKILL_UNAVAILABLE');
 if (actor.level < definition.unlock_level) throw new ProgressionRejection('SKILL_LOCKED');
 const current = actor.skill_levels[id] ?? 0;
 if (!Number.isInteger(target) || target <= current) throw new ProgressionRejection('SKILL_LEVEL_UNCHANGED');
 if (target > characterSkillCap(actor, definition)) throw new ProgressionRejection('SKILL_CAP_REACHED');
 const table = (content.documents[`skills/${actor.root_job_id}.json`]!.upgrades as unknown as UpgradeTable)[id];
 if (!table) throw new Error('MISSING_SKILL_PRICE');
 const cost: Partial<Wallet> = current === 0 ? {...table.learn_level_one_cost} : {};
 for(let level=Math.max(1,current);level<target;level++) {
  const row=table.upgrade_cost_rows.find(r=>r.from_level===level&&r.to_level===level+1); if(!row)throw new Error('MISSING_SKILL_PRICE');
  cost.gold=(cost.gold??0)+row.gold;cost.skill_manual=(cost.skill_manual??0)+row.skill_manual;
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
 return {active_slots:structuredClone(actor.active_slots),resolved_skills:Object.fromEntries(Object.entries(actor.skill_levels).map(([id,level])=>[id,structuredClone(resolveSkill(id,level,content))])) as BattleActor['resolved_skills']};
}
export function applySkillCommand(state: AccountState, command: SkillCommand, content: ValidatedContent): string {
 if(state.active_battle)throw new ProgressionRejection('BUILD_LOCKED_DURING_BATTLE');
 const actor=state.roster.find(a=>a.character_id===command.params.character_id);if(!actor)throw new ProgressionRejection('CHARACTER_NOT_FOUND');
 if(command.type==='skill.set_loadout') {
  const slots=command.params.skill_ids, assigned=slots.filter((id):id is string=>id!==null);
  if(assigned.length!==new Set(assigned).size)throw new ProgressionRejection('DUPLICATE_SKILL_SLOT');
  if(exclusiveLoadoutConflict(actor,slots,content))throw new ProgressionRejection('EXCLUSIVE_SKILL_GROUP');
  if(assigned.some(id=>!actor.skill_levels[id]||content.skills[id]?.kind!=='active'))throw new ProgressionRejection('SKILL_NOT_LEARNED_ACTIVE');
  actor.active_slots=structuredClone(slots);return 'SKILL_LOADOUT_UPDATED';
 }
 const {skill_id:id,target_level:target}=command.params,current=actor.skill_levels[id]??0,cost=skillQuote(actor,id,target,content);
 for(const key of Object.keys(cost)as(keyof Wallet)[])if(state.wallet[key]<cost[key]!)throw new ProgressionRejection('INSUFFICIENT_RESOURCES');
 for(const key of Object.keys(cost)as(keyof Wallet)[])state.wallet[key]-=cost[key]!;
 actor.skill_levels[id]=target;
 const version=String(content.documents[`skills/${actor.root_job_id}.json`]!.content_version);
 state.paid_ledger.push({entry_id:`investment_${command.request_id}`,character_id:actor.character_id,feature_id:'skill',skill_id:id,quantity:target-current,cost_version:version,cost_versions:[version],paid_resources:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...cost}as Wallet,refund_state:'active',refund_command_id:null});
 return current===0?'SKILL_LEARNED':'SKILL_UPGRADED';
}
