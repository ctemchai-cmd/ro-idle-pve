// Extra healer probe: same neutral boss, replace duplicate healers with fixed offensive companions.
import { writeFile } from 'node:fs/promises';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { AUDIT_CASES,auditBuilds,auditFixture,auditFight,auditInput,type AuditFixture } from './class-audit-fixtures.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw loaded.errors;const content=loaded.value,validator=new AccountCommandRules(content);
const out='plan/evidence/task-129/support.json',results:unknown[]=[];let battles=0;
for(const condition of AUDIT_CASES.filter(c=>['class2-70-gear60','high-90-awaken10'].includes(c.id))){
 const builds=auditBuilds(content,condition.stage),jobs=condition.stage===2?['priest','bard','dancer']:['high_priest','clown','gypsy'];
 const fixed=builds.find(b=>b.job===(condition.stage===2?'assassin':'assassin_cross')&&b.profile==='critical')!,caster=builds.find(b=>b.job===(condition.stage===2?'wizard':'high_wizard')&&b.profile==='spell_speed')!;
 const offensive=(fixture:AuditFixture)=>{
  const f=structuredClone(fixture),s=f.account;
  for(const [id,build]of [['npc_thief',fixed],['npc_mage',caster]]as const){
   const donor=auditFixture(build,condition,content),actor=structuredClone(donor.account.roster[0]);actor.character_id=id;actor.kind='npc';
   const map=new Map<string,string>();
   for(const item of donor.account.inventory.filter(i=>Object.values(actor.equipment).includes(i.instance_id))){const copy=structuredClone(item),next=`support_${id}_${copy.instance_id}`;map.set(copy.instance_id,next);copy.instance_id=next;s.inventory.push(copy);}
   for(const slot of Object.keys(actor.equipment)as(keyof typeof actor.equipment)[])actor.equipment[slot]=map.get(actor.equipment[slot]!)??null;
   s.roster[s.roster.findIndex(a=>a.character_id===id)]=actor;
   for(const row of donor.account.paid_ledger.filter(r=>r.character_id==='main'))s.paid_ledger.push({...structuredClone(row),character_id:id,entry_id:`support_${id}_${row.entry_id}`});
  }
  s.team=[{character_id:'main',position:'back_1'},{character_id:'npc_swordsman',position:'front_1'},{character_id:'npc_thief',position:'front_2'},{character_id:'npc_mage',position:'back_2'}];validator.validateAccount(s);return f;
 };
 for(const job of jobs){
  const candidates=builds.filter(b=>b.job===job).map(b=>offensive(auditFixture(b,condition,content)));
  const screen=candidates.map(f=>{const input=auditInput(f,'pressure',content);const samples=[12901,12902,12903].map(seed=>{battles++;return auditFight(input,seed,content).sample});return{f,samples,team:samples.reduce((n,s)=>n+s.team_dps,0)/3,hps:samples.reduce((n,s)=>n+s.hps,0)/3};});
  for(const metric of ['team','hps']as const){const chosen=screen.slice().sort((a,b)=>b[metric]-a[metric])[0]!,input=auditInput(chosen.f,'pressure',content),samples=Array.from({length:16},(_,i)=>{battles++;return auditFight(input,22901+i,content).sample;});
   results.push({condition:condition.id,job,selection:metric,build:chosen.f.build,samples,mean:Object.fromEntries(['dps','team_dps','hps','survivors','alive_ms','duration_ms'].map(k=>[k,samples.reduce((n,s)=>n+Number(s[k as keyof typeof s]),0)/16]))});
  }
 }
 console.log(JSON.stringify({condition:condition.id,battles,groups:results.length}));
}
await writeFile(out,JSON.stringify({content_hash:content.manifest.content_hash,battles,method:'fixed Knight tank + Assassin crit + Wizard spell-speed; same common gear/rank/manual budget; no duplicate healer; 3 screen / 16 held-out seeds; select max team DPS and max effective HPS separately',results},null,2)+'\n');
