import type {AccountState,Command} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {jobAllowsSkill} from '../../content/jobs.ts';
import {artifactRules,artifactDefinition,artifactFits,emptyArtifacts,type ArtifactItem} from '../build/artifacts.ts';
import {ProgressionRejection} from './rejection.ts';
export type ArtifactCommand=Extract<Command,{type:'artifact.draw'|'artifact.equip'|'artifact.upgrade'|'artifact.star'|'artifact.lock'|'artifact.salvage'}>;
const reject=(code:string):never=>{throw new ProgressionRejection(code);};
const safe=(n:number)=>{if(!Number.isSafeInteger(n)||n<0)reject('RESOURCE_OVERFLOW');return n;};
export function grantArtifactRewards(state:AccountState,reward:{essence:number;tickets:number}){if(!Number.isSafeInteger(reward.essence)||reward.essence<0||!Number.isSafeInteger(reward.tickets)||reward.tickets<0)reject('INVALID_ARTIFACT_REWARD');const s=state.artifacts??emptyArtifacts();const essence=safe(s.essence+reward.essence),tickets=safe(s.tickets+reward.tickets);state.artifacts??=s;s.essence=essence;s.tickets=tickets;}
export function artifactOwner(state:AccountState,id:string){return Object.keys(state.artifacts?.slots??{}).find(actor=>state.artifacts!.slots[actor]!.includes(id));}
export function artifactUpgradeQuote(item:ArtifactItem,target:number,content:ValidatedContent){if(!Number.isInteger(target)||target<=item.level||target>10)reject('UPGRADE_CAP_REACHED');return artifactRules(content).level_costs.filter(r=>r.to>item.level&&r.to<=target).reduce((a,r)=>({gold:a.gold+r.gold,essence:a.essence+r.essence}),{gold:0,essence:0});}
export function validateArtifacts(state:AccountState,content:ValidatedContent){
 const s=state.artifacts;if(!s)return;const ids=new Set<string>(),assigned=new Set<string>();for(const item of s.items){if(ids.has(item.instance_id))throw new Error('DUPLICATE_ARTIFACT');ids.add(item.instance_id);artifactDefinition(item.definition_id,content);}
 for(const[id,slots]of Object.entries(s.slots)){const actor=state.roster.find(a=>a.character_id===id);if(!actor)throw new Error('ARTIFACT_OWNER_MISSING');const skills=new Set<string>();for(const value of slots){if(!value)continue;const item=s.items.find(i=>i.instance_id===value);if(!item||assigned.has(value))throw new Error('INVALID_ARTIFACT_REFERENCE');const d=artifactDefinition(item.definition_id,content);if(!artifactFits(actor,d,content)||skills.has(d.skill_id))throw new Error('ARTIFACT_JOB_MISMATCH');skills.add(d.skill_id);assigned.add(value);}}
}
export function applyArtifactCommand(state:AccountState,command:ArtifactCommand,content:ValidatedContent,draw?:()=>number):string{
 if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');const rules=artifactRules(content),s=state.artifacts??=emptyArtifacts();
 const item=(id:string)=>s.items.find(i=>i.instance_id===id)??reject('ITEM_NOT_FOUND');
 const consumable=(id:string)=>{const i=item(id);if(i.locked)reject('ITEM_LOCKED');if(artifactOwner(state,id))reject('ITEM_EQUIPPED');return i;};
 const pay=(gold:number,essence:number)=>{if(state.wallet.gold<gold||s.essence<essence)reject('INSUFFICIENT_RESOURCES');state.wallet.gold-=gold;s.essence-=essence;};
 if(command.type==='artifact.draw'){
  const actor=state.roster.find(a=>a.job_id===command.params.job_id);const job=content.jobs.byId[command.params.job_id];if(!job||job.stage!==3||!actor)reject('ARTIFACT_JOB_LOCKED');
  const count=command.params.count,tickets=Math.min(count,s.tickets),crystal=(count-tickets)*rules.draw_crystal;if(state.wallet.crystal<crystal)reject('INSUFFICIENT_RESOURCES');if(s.items.length+count>rules.capacity)reject('ARTIFACT_INVENTORY_FULL');if(!draw)throw new Error('SERVER_SEED_REQUIRED');
  const pool=rules.definitions.filter(d=>jobAllowsSkill(content.jobs,actor!,d.class_id));
  for(let n=0;n<count;n++){
   const roll=draw()*100;let sum=0,rarity='legendary';for(const[id,r]of Object.entries(rules.rarities)){sum+=r.weight;if(roll<sum){rarity=id;break;}}
   if(s.legendary_misses>=rules.legendary_pity-1)rarity='legendary';
   const choices=pool.filter(d=>d.rarity_id===rarity);if(!choices.length)throw new Error('ARTIFACT_POOL_EMPTY');const d=choices[Math.min(choices.length-1,Math.floor(draw()*choices.length))]!;
   s.items.push({instance_id:`artifact_${command.request_id}_${n}`,definition_id:d.id,level:1,stars:0,locked:false,invested_gold:0,invested_essence:0});s.legendary_misses=rarity==='legendary'?0:s.legendary_misses+1;s.pulls=safe(s.pulls+1);
  }s.tickets-=tickets;state.wallet.crystal-=crystal;return'ARTIFACT_DRAWN';
 }
 if(command.type==='artifact.salvage'){
  const ids=command.params.instance_ids;if(new Set(ids).size!==ids.length)reject('INVALID_ITEM_SELECTION');const selected=ids.map(consumable);let essence=0,gold=0;for(const i of selected){essence+=rules.rarities[artifactDefinition(i.definition_id,content).rarity_id]!.salvage+i.invested_essence;gold+=i.invested_gold;}
  const nextGold=safe(state.wallet.gold+gold);grantArtifactRewards(state,{essence,tickets:0});state.wallet.gold=nextGold;s.items=s.items.filter(i=>!ids.includes(i.instance_id));return'ARTIFACT_SALVAGED';
 }
 if(command.type==='artifact.equip'){
  const actor=state.roster.find(a=>a.character_id===command.params.character_id)??reject('CHARACTER_NOT_FOUND'),id=command.params.instance_id,slot=command.params.slot;
  if(id){const i=item(id),d=artifactDefinition(i.definition_id,content);if(!artifactFits(actor,d,content))reject('ARTIFACT_JOB_MISMATCH');const slots=s.slots[actor.character_id]??[null,null];if(slots.some((v,n)=>n!==slot&&v&&artifactDefinition(item(v).definition_id,content).skill_id===d.skill_id))reject('ARTIFACT_DUPLICATE_SKILL');for(const values of Object.values(s.slots))for(let n=0;n<2;n++)if(values[n]===id)values[n]=null;}
  const slots=s.slots[actor.character_id]??=[null,null];slots[slot]=id;return'ARTIFACT_EQUIPPED';
 }
 const i=item(command.params.instance_id);
 if(command.type==='artifact.lock'){i.locked=command.params.locked;return'ARTIFACT_LOCKED';}
 if(command.type==='artifact.upgrade'){const cost=artifactUpgradeQuote(i,command.params.target_level,content);safe(i.invested_gold+cost.gold);safe(i.invested_essence+cost.essence);pay(cost.gold,cost.essence);i.invested_gold+=cost.gold;i.invested_essence+=cost.essence;i.level=command.params.target_level;return'ARTIFACT_UPGRADED';}
 if(i.stars>=5)reject('ARTIFACT_STAR_MAX');const ids=command.params.donor_ids;if(ids.length!==rules.star_copies[i.stars]||new Set(ids).size!==ids.length||ids.includes(i.instance_id))reject('ARTIFACT_COPIES_REQUIRED');const donors=ids.map(consumable);if(donors.some(d=>d.definition_id!==i.definition_id||d.stars!==0))reject('ARTIFACT_DONOR_MISMATCH');
 const gold=safe(state.wallet.gold+donors.reduce((n,d)=>n+d.invested_gold,0)),essence=donors.reduce((n,d)=>n+d.invested_essence,0);grantArtifactRewards(state,{essence,tickets:0});state.wallet.gold=gold;s.items=s.items.filter(d=>!ids.includes(d.instance_id));i.stars++;return'ARTIFACT_STARRED';
}
