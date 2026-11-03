import type {AccountState,Command} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {artifactRules,artifactDefinition,artifactItemDefinition,artifactPool,artifactDonorMatches,artifactFits,emptyArtifacts,type ArtifactItem} from '../build/artifacts.ts';
import {ProgressionRejection} from './rejection.ts';
export type ArtifactCommand=Extract<Command,{type:'artifact.draw'|'artifact.equip'|'artifact.upgrade'|'artifact.star'|'artifact.lock'|'artifact.salvage'|'artifact.skill_roll'|'artifact.skill_decide'}>;
const reject=(code:string):never=>{throw new ProgressionRejection(code);};
const safe=(n:number)=>{if(!Number.isSafeInteger(n)||n<0)reject('RESOURCE_OVERFLOW');return n;};
export function grantArtifactRewards(state:AccountState,reward:{essence:number;tickets:number;reroll_stones?:number}){
 if(Object.values(reward).some(n=>!Number.isSafeInteger(n)||n<0))reject('INVALID_ARTIFACT_REWARD');
 const s=state.artifacts??emptyArtifacts(),essence=safe(s.essence+reward.essence),tickets=safe(s.tickets+reward.tickets),stones=safe((s.reroll_stones??0)+(reward.reroll_stones??0));
 state.artifacts??=s;s.essence=essence;s.tickets=tickets;if(reward.reroll_stones!==undefined)s.reroll_stones=stones;
}
export function artifactOwner(state:AccountState,id:string){return Object.keys(state.artifacts?.slots??{}).find(actor=>state.artifacts!.slots[actor]!.includes(id));}
export function artifactUpgradeQuote(item:ArtifactItem,target:number,content:ValidatedContent){if(!Number.isInteger(target)||target<=item.level||target>10)reject('UPGRADE_CAP_REACHED');return artifactRules(content).level_costs.filter(r=>r.to>item.level&&r.to<=target).reduce((a,r)=>({gold:a.gold+r.gold,essence:a.essence+r.essence}),{gold:0,essence:0});}
export function artifactSalvageQuote(items:readonly ArtifactItem[],content:ValidatedContent){const rules=artifactRules(content);return items.reduce((sum,i)=>{const rarity=artifactItemDefinition(i,content).rarity_id,copies=1+rules.star_copies.slice(0,i.stars).reduce((a,b)=>a+b,0);return{gold:safe(sum.gold+i.invested_gold),essence:safe(sum.essence+rules.rarities[rarity]!.salvage*copies+i.invested_essence),reroll_stones:safe(sum.reroll_stones+(rules.reroll?.salvage[rarity]??0)*copies)};},{gold:0,essence:0,reroll_stones:0});}
export function artifactStoryReward(stageId:string,content:ValidatedContent){const rule=artifactRules(content).reroll,[chapter,stage]=stageId.split('-').map(Number);if(!rule||!chapter||!stage||chapter<rule.story_min_chapter||stage%rule.story_every)return 0;return rule.story_counts.filter(r=>chapter>=r.from_chapter).at(-1)?.count??0;}
export function artifactRollChoices(state:AccountState,item:ArtifactItem,job:string,content:ValidatedContent){const current=artifactItemDefinition(item,content),owner=artifactOwner(state,item.instance_id),used=(owner?state.artifacts?.slots[owner]??[]:[]).filter(id=>id!==item.instance_id).flatMap(id=>{const i=state.artifacts?.items.find(v=>v.instance_id===id);return i?[artifactItemDefinition(i,content).skill_id]:[];});return artifactPool(job,content).filter(d=>d.skill_id!==current.skill_id&&!used.includes(d.skill_id));}
export function validateArtifacts(state:AccountState,content:ValidatedContent){
 const s=state.artifacts;if(!s)return;const ids=new Set<string>(),assigned=new Set<string>();
 for(const item of s.items){if(ids.has(item.instance_id))throw new Error('DUPLICATE_ARTIFACT');ids.add(item.instance_id);artifactDefinition(item.definition_id,content);const d=artifactItemDefinition(item,content),skill=content.skills[d.skill_id];if(!skill||!content.jobs.byId[d.class_id]?.ancestors.includes(String(skill.class_id))||!artifactRules(content).rarities[d.rarity_id])throw new Error('INVALID_ARTIFACT_PROGRAM');}
 for(const[id,slots]of Object.entries(s.slots)){const actor=state.roster.find(a=>a.character_id===id);if(!actor)throw new Error('ARTIFACT_OWNER_MISSING');const skills=new Set<string>();for(const value of slots){if(!value)continue;const item=s.items.find(i=>i.instance_id===value);if(!item||assigned.has(value))throw new Error('INVALID_ARTIFACT_REFERENCE');const d=artifactItemDefinition(item,content);if(!artifactFits(actor,d,content)||skills.has(d.skill_id))throw new Error('ARTIFACT_JOB_MISMATCH');skills.add(d.skill_id);assigned.add(value);}}
 const pending=s.pending_skill_roll;if(pending){const i=s.items.find(v=>v.instance_id===pending.instance_id),d=i&&artifactItemDefinition(i,content);if(!d||d.skill_id!==pending.original_skill_id||pending.original_skill_id===pending.replacement_skill_id||!artifactPool(pending.class_id,content).some(p=>p.skill_id===pending.replacement_skill_id)||!content.jobs.byId[pending.class_id]?.ancestors.includes(d.class_id))throw new Error('INVALID_ARTIFACT_PENDING_ROLL');}
}
export function applyArtifactCommand(state:AccountState,command:ArtifactCommand,content:ValidatedContent,draw?:()=>number):string{
 if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');const rules=artifactRules(content),s=state.artifacts??=emptyArtifacts();
 const item=(id:string)=>s.items.find(i=>i.instance_id===id)??reject('ITEM_NOT_FOUND');
 const noPending=(id:string)=>{if(s.pending_skill_roll?.instance_id===id)reject('ARTIFACT_ROLL_PENDING');};
 const consumable=(id:string)=>{const i=item(id);if(i.locked)reject('ITEM_LOCKED');if(artifactOwner(state,id))reject('ITEM_EQUIPPED');noPending(id);return i;};
 const pay=(gold:number,essence:number)=>{if(state.wallet.gold<gold||s.essence<essence)reject('INSUFFICIENT_RESOURCES');state.wallet.gold-=gold;s.essence-=essence;};
 const highActor=(jobId:string)=>{const actor=state.roster.find(a=>a.job_id===jobId);if(!actor||content.jobs.byId[jobId]?.stage!==3)reject('ARTIFACT_JOB_LOCKED');return actor!;};
 const duplicate=(id:string,actorId:string,skill:string)=>{if((s.slots[actorId]??[]).some(other=>other&&other!==id&&artifactItemDefinition(item(other),content).skill_id===skill))reject('ARTIFACT_DUPLICATE_SKILL');};
 if(command.type==='artifact.draw'){
  const actor=highActor(command.params.job_id),count=command.params.count,tickets=Math.min(count,s.tickets),crystal=(count-tickets)*rules.draw_crystal;
  if(state.wallet.crystal<crystal)reject('INSUFFICIENT_RESOURCES');if(s.items.length+count>rules.capacity)reject('ARTIFACT_INVENTORY_FULL');if(!draw)throw new Error('SERVER_SEED_REQUIRED');
  const pool=artifactPool(actor.job_id,content);if(!pool.length)throw new Error('ARTIFACT_POOL_EMPTY');safe(s.pulls+count);
  for(let n=0;n<count;n++){
   const roll=draw()*100;let sum=0,rarity='legendary';for(const[id,r]of Object.entries(rules.rarities)){sum+=r.weight;if(roll<sum){rarity=id;break;}}
   if(s.legendary_misses>=rules.legendary_pity-1)rarity='legendary';
   const choices=rules.version===2?pool:pool.filter(d=>d.rarity_id===rarity);if(!choices.length)throw new Error('ARTIFACT_POOL_EMPTY');const d=choices[Math.min(choices.length-1,Math.floor(draw()*choices.length))]!;
   s.items.push({instance_id:`artifact_${command.request_id}_${n}`,definition_id:d.id,...(rules.version===2?{skill_id:d.skill_id,class_id:actor.job_id,rarity_id:rarity as NonNullable<ArtifactItem['rarity_id']>}:{}),level:1,stars:0,locked:false,invested_gold:0,invested_essence:0});s.legendary_misses=rarity==='legendary'?0:s.legendary_misses+1;s.pulls++;
  }s.tickets-=tickets;state.wallet.crystal-=crystal;return'ARTIFACT_DRAWN';
 }
 if(command.type==='artifact.salvage'){
  const ids=command.params.instance_ids;if(!ids.length||new Set(ids).size!==ids.length)reject('INVALID_ITEM_SELECTION');const quote=artifactSalvageQuote(ids.map(consumable),content),gold=safe(state.wallet.gold+quote.gold);grantArtifactRewards(state,{essence:quote.essence,tickets:0,reroll_stones:quote.reroll_stones});state.wallet.gold=gold;s.items=s.items.filter(i=>!ids.includes(i.instance_id));return'ARTIFACT_SALVAGED';
 }
 if(command.type==='artifact.equip'){
  const actor=state.roster.find(a=>a.character_id===command.params.character_id)??reject('CHARACTER_NOT_FOUND'),id=command.params.instance_id,slot=command.params.slot;
  if(id){const i=item(id),d=artifactItemDefinition(i,content);if(!artifactFits(actor,d,content))reject('ARTIFACT_JOB_MISMATCH');const other=s.slots[actor.character_id]?.[1-slot];if(other&&other!==id&&artifactItemDefinition(item(other),content).skill_id===d.skill_id)reject('ARTIFACT_DUPLICATE_SKILL');for(const values of Object.values(s.slots))for(let n=0;n<2;n++)if(values[n]===id)values[n]=null;}
  const slots=s.slots[actor.character_id]??=[null,null];slots[slot]=id;return'ARTIFACT_EQUIPPED';
 }
 const i=item(command.params.instance_id);
 if(command.type==='artifact.skill_decide'){
  const pending=s.pending_skill_roll;if(!pending||pending.roll_id!==command.params.roll_id||pending.instance_id!==i.instance_id||artifactItemDefinition(i,content).skill_id!==pending.original_skill_id)reject('ARTIFACT_ROLL_CHANGED');
  if(command.params.accept){if(i.locked)reject('ITEM_LOCKED');const owner=artifactOwner(state,i.instance_id);if(owner){const actor=state.roster.find(a=>a.character_id===owner)!;if(!artifactFits(actor,{...artifactItemDefinition(i,content),class_id:pending!.class_id},content))reject('ARTIFACT_JOB_MISMATCH');duplicate(i.instance_id,owner,pending!.replacement_skill_id);}i.skill_id=pending!.replacement_skill_id;i.class_id=pending!.class_id;}
  s.pending_skill_roll=null;return command.params.accept?'ARTIFACT_SKILL_CHANGED':'ARTIFACT_SKILL_KEPT';
 }
 if(command.type==='artifact.skill_roll'){
  if(s.pending_skill_roll)reject('ARTIFACT_ROLL_PENDING');if(i.locked)reject('ITEM_LOCKED');const actor=highActor(command.params.job_id),d=artifactItemDefinition(i,content);
  if(d.skill_id!==command.params.expected_skill_id)reject('ARTIFACT_ROLL_CHANGED');if(!artifactFits(actor,d,content))reject('ARTIFACT_JOB_MISMATCH');const owner=artifactOwner(state,i.instance_id);if(owner&&state.roster.find(a=>a.character_id===owner)?.job_id!==actor.job_id)reject('ARTIFACT_JOB_MISMATCH');
  const choices=artifactRollChoices(state,i,actor.job_id,content),cost=rules.reroll?.cost??reject('ARTIFACT_REROLL_UNAVAILABLE');if(!choices.length)reject('ARTIFACT_POOL_EMPTY');if((s.reroll_stones??0)<cost)reject('INSUFFICIENT_RESOURCES');if(!draw)throw new Error('SERVER_SEED_REQUIRED');const chosen=choices[Math.min(choices.length-1,Math.floor(draw()*choices.length))]!;
  s.pending_skill_roll={roll_id:command.request_id,instance_id:i.instance_id,original_skill_id:d.skill_id,replacement_skill_id:chosen.skill_id,class_id:actor.job_id};s.reroll_stones=(s.reroll_stones??0)-cost;return'ARTIFACT_SKILL_ROLLED';
 }
 if(command.type==='artifact.lock'){i.locked=command.params.locked;return'ARTIFACT_LOCKED';}
 noPending(i.instance_id);
 if(command.type==='artifact.upgrade'){const cost=artifactUpgradeQuote(i,command.params.target_level,content);safe(i.invested_gold+cost.gold);safe(i.invested_essence+cost.essence);pay(cost.gold,cost.essence);i.invested_gold+=cost.gold;i.invested_essence+=cost.essence;i.level=command.params.target_level;return'ARTIFACT_UPGRADED';}
 if(i.stars>=5)reject('ARTIFACT_STAR_MAX');const ids=command.params.donor_ids;if(ids.length!==rules.star_copies[i.stars]||new Set(ids).size!==ids.length||ids.includes(i.instance_id))reject('ARTIFACT_COPIES_REQUIRED');const donors=ids.map(consumable);if(donors.some(d=>!artifactDonorMatches(i,d,content)||d.stars!==0))reject('ARTIFACT_DONOR_MISMATCH');
 const gold=safe(state.wallet.gold+donors.reduce((n,d)=>n+d.invested_gold,0)),essence=donors.reduce((n,d)=>n+d.invested_essence,0);grantArtifactRewards(state,{essence,tickets:0});state.wallet.gold=gold;s.items=s.items.filter(d=>!ids.includes(d.instance_id));i.stars++;return'ARTIFACT_STARRED';
}
