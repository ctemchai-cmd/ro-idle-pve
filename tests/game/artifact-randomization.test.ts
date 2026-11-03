import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import type {AccountState,Command} from '../../src/contracts/index.ts';
import {content} from './combat-fixtures.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {AccountCommandRules,type CommandTime} from '../../src/domain/account/commands.ts';
import {artifactRules,artifactPool,artifactItemDefinition,artifactBonus,artifactSkills,enhanceArtifactSkill,artifactStatModifiers,emptyArtifacts} from '../../src/domain/build/artifacts.ts';
import {applyArtifactCommand,artifactSalvageQuote,artifactStoryReward,grantArtifactRewards,type ArtifactCommand} from '../../src/domain/progression/artifacts.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {progressionData} from '../../src/domain/progression/characters.ts';
import {canonical} from '../../src/content/value.ts';
const at='2026-11-03T00:00:00.000Z',rules=new AccountCommandRules(content);
function fresh(){const s=initializeAccount(content,{root_job_id:'acolyte',gender:'male'},at,'2026-11-03',190),a=s.roster[0]!;a.job_id='champion';a.level=100;a.local_cap=100;a.completed_gate_ids=[20,40,60,80];a.unspent_status_points=progressionData(content).progression.level_rows.find(r=>r.level===100)!.total_status_points;s.wallet.crystal=100000;s.wallet.gold=1000000;s.artifacts=emptyArtifacts();s.artifacts.reroll_stones=10;return s;}
const item=(id:string,skill='monk_finger_offensive')=>({instance_id:id,definition_id:'artifact_'+skill,level:1,stars:0,locked:false,invested_gold:0,invested_essence:0});
function cmd(type:Command['type'],params:unknown){return{type,params,request_id:randomUUID(),expected_revision:1,schema_version:1,...rules.versions}as Command;}
function run(s:AccountState,type:Command['type'],params:unknown){const c=cmd(type,params);rules.parse(c);return rules.decide(c,s,null,{server_at:at,now_ms:Date.parse(at),battle_seed:190}as CommandTime,'a'.repeat(64));}
test('all152 active/passive Artifact programs change actual resolved base/Aw1/Aw10 and remain immutable',()=>{
 assert.equal(artifactRules(content).definitions.length,152);let passives=0;
 for(const d of artifactRules(content).definitions)for(const[aw,lv]of[[false,1],[false,10],[true,1],[true,10]]as const){const base=resolveSkill(d.skill_id,lv,content,aw),before=canonical(base),boost=enhanceArtifactSkill(base.definition,.5);assert.notEqual(canonical(boost),canonical(base.definition),d.skill_id);assert.equal(canonical(base),before);if(!aw&&lv===1&&base.definition.kind==='passive')passives++;}
 assert.equal(passives,32);
});
test('utility Artifact duration uses one quarter of power scaling and UI discloses the actual bonus',async()=>{
 const{artifactView}=await import('../../src/client/artifacts.ts');
 const s=fresh();s.roster[0]!.job_id='high_priest';const i={...item('blessing','acolyte_blessing'),class_id:'high_priest',rarity_id:'legendary' as const,level:10,stars:5};s.artifacts!.items=[i];s.artifacts!.slots.main=['blessing',null];
 const raw=resolveSkill('acolyte_blessing',10,content,true).definition,boost=enhanceArtifactSkill(raw,.75);
 assert.equal(raw.kind,'active');assert.equal(boost.kind,'active');if(raw.kind!=='active'||boost.kind!=='active')return;
 raw.effects.forEach((e,n)=>{if(e.type==='apply_status'){const actual=boost.effects[n]!;assert.equal(actual.type,'apply_status');if(actual.type==='apply_status')assert.equal(actual.duration_ms,Math.round(Number(e.duration_ms)*1.1875));}});
 assert.equal(artifactView(i,s).enhancementLabel,'ระยะเวลา +18.75%');
 const heal=resolveSkill('acolyte_heal',10,content).definition,improved=enhanceArtifactSkill(heal,.75);assert.equal(heal.kind,'active');assert.equal(improved.kind,'active');if(heal.kind==='active'&&improved.kind==='active'){const old=heal.effects.find(e=>e.type==='heal')!,next=improved.effects.find(e=>e.type==='heal')!;assert('attack_ratio'in next.formula.params);assert('attack_ratio'in old.formula.params);assert.equal(Number(next.formula.params.attack_ratio),Number(old.formula.params.attack_ratio)*1.75);}
});
test('every rarity independently draws every lineage skill including passive, never sibling branches',()=>{
 for(const job of content.jobs.order.filter(j=>content.jobs.byId[j]!.stage===3)){
  const pool=artifactPool(job,content),s=fresh(),a=s.roster[0]!;a.job_id=job as typeof a.job_id;a.root_job_id=content.jobs.byId[job]!.root as typeof a.root_job_id;
  assert(pool.some(d=>content.skills[d.skill_id]!.kind==='passive'));for(const qualityRoll of[0,.5,.8,.94,.995])for(let n=0;n<pool.length;n++){
   const copy=structuredClone(s),draws=[qualityRoll,(n+.1)/pool.length];applyArtifactCommand(copy,cmd('artifact.draw',{job_id:job,count:1})as ArtifactCommand,content,()=>draws.shift()!);
   const got=copy.artifacts!.items[0]!,d=artifactItemDefinition(got,content);assert.equal(d.skill_id,pool[n]!.skill_id);assert.equal(d.class_id,job);assert(content.jobs.byId[job]!.ancestors.includes(String(content.skills[d.skill_id]!.class_id)));assert.equal(got.level,1);
  }
 }
});
test('paid reroll persists both choices; keep/accept preserve instance investments and quality',()=>{
 const s=fresh();s.artifacts!.items=[{...item('a'),level:6,stars:2,invested_gold:23,invested_essence:12}];const before=s.artifacts!.items[0]!;
 const rolled=run(s,'artifact.skill_roll',{instance_id:'a',job_id:'champion',expected_skill_id:'monk_finger_offensive'});assert.equal(rolled.receipt.result.code,'ARTIFACT_SKILL_ROLLED');const save=JSON.parse(JSON.stringify(rolled.state))as AccountState;rules.validateAccount(save);assert.equal(save.artifacts!.reroll_stones,9);assert.deepEqual(save.artifacts!.items[0],before);
 const pending=save.artifacts!.pending_skill_roll!;assert.notEqual(pending.original_skill_id,pending.replacement_skill_id);
 assert.equal(run(save,'artifact.skill_roll',{instance_id:'a',job_id:'champion',expected_skill_id:pending.original_skill_id}).receipt.result.code,'ARTIFACT_ROLL_PENDING');assert.equal(run(save,'artifact.salvage',{instance_ids:['a']}).receipt.result.code,'ARTIFACT_ROLL_PENDING');
 const keep=run(save,'artifact.skill_decide',{instance_id:'a',roll_id:pending.roll_id,accept:false});assert.deepEqual(keep.state.artifacts!.items[0],before);assert.equal(keep.state.artifacts!.pending_skill_roll,null);
 const accept=run(save,'artifact.skill_decide',{instance_id:'a',roll_id:pending.roll_id,accept:true});assert.equal(accept.receipt.result.code,'ARTIFACT_SKILL_CHANGED');const after=accept.state.artifacts!.items[0]!;assert.equal(after.skill_id,pending.replacement_skill_id);assert.equal(after.level,before.level);assert.equal(after.stars,before.stars);assert.equal(artifactItemDefinition(after,content).rarity_id,artifactItemDefinition(before,content).rarity_id);rules.validateAccount(accept.state);
});
test('legacy artifacts keep exact skill/rarity; permanent class stats and passive power compile once',()=>{
 const s=fresh(),legacy=item('a','monk_iron_fist');s.artifacts!.items=[legacy];s.artifacts!.slots.main=['a',null];assert.equal(artifactItemDefinition(legacy,content).skill_id,'monk_iron_fist');const raw=structuredClone(resolveSkill('monk_iron_fist',10,content)),boost=artifactSkills('main',s,{monk_iron_fist:raw} as unknown as Parameters<typeof artifactSkills>[2],content);assert.notDeepEqual(boost.monk_iron_fist,raw);assert.equal(artifactBonus(legacy,content),artifactRules(content).rarities.common!.start);assert.deepEqual(artifactStatModifiers(legacy,'champion',content).map(m=>m.stat),['physical_attack','max_sp']);
});
test('bulk salvage protects equipped/locked/pending and preflights overflow before deleting or refunding',()=>{
 const s=fresh();s.artifacts!.items=[item('a'),{...item('b'),locked:true}];const rejected=run(s,'artifact.salvage',{instance_ids:['a','b']});assert.equal(rejected.receipt.result.code,'ITEM_LOCKED');assert.deepEqual(rejected.state,s);
 s.artifacts!.items[1]!.locked=false;s.artifacts!.items[0]!.invested_gold=123;const quote=artifactSalvageQuote(s.artifacts!.items,content),ok=run(s,'artifact.salvage',{instance_ids:['a','b']});assert.equal(ok.state.artifacts!.items.length,0);assert.equal(ok.state.wallet.gold,s.wallet.gold+123);assert.equal(ok.state.artifacts!.reroll_stones,10+quote.reroll_stones);
 s.artifacts!.reroll_stones=Number.MAX_SAFE_INTEGER;const snap=structuredClone(s);assert.throws(()=>grantArtifactRewards(s,{essence:1,tickets:1,reroll_stones:1}),/RESOURCE_OVERFLOW/);assert.deepEqual(s,snap);
});
test('star donors match lineage and rarity, allow a different rolled skill and preserve consumed base value',()=>{
 const s=fresh();s.artifacts!.items=[{...item('a'),class_id:'champion',rarity_id:'rare'},{...item('b','acolyte_heal'),class_id:'champion',rarity_id:'rare'}];const before=artifactSalvageQuote(s.artifacts!.items,content),r=run(s,'artifact.star',{instance_id:'a',donor_ids:['b']});assert.equal(r.receipt.result.code,'ARTIFACT_STARRED');assert.deepEqual(artifactSalvageQuote(r.state.artifacts!.items,content),before);
});
test('story reroll rewards are bounded milestones and fixed claims grant once',async()=>{
 for(const[id,n]of[['2-10',0],['3-1',0],['3-5',1],['8-10',2],['13-5',3]]as const)assert.equal(artifactStoryReward(id,content),n);
 const{claimRewards}=await import('../../src/domain/progression/claim-rewards.ts');const s=fresh(),zero=Object.fromEntries(Object.keys(s.wallet).map(k=>[k,0]))as AccountState['wallet'];s.pending_rewards.push({claim_id:'stone',kind:'story',resource_vector:zero,items:[],artifact_rewards:{essence:0,tickets:0,reroll_stones:2},content_version:content.manifest.content_version,reserved_at:at,source_keys:['story:8-5'],status:'pending'});claimRewards(s,['stone'],content);assert.equal(s.artifacts!.reroll_stones,12);assert.throws(()=>claimRewards(s,['stone'],content));assert.equal(s.artifacts!.reroll_stones,12);
});
test('reroll signed API response-loss replays original result once',async()=>{
 const{shopBatchFixture}=await import('./shop-batch-fixture.ts');const f=shopBatchFixture('funded',at,s=>{Object.assign(s,fresh());s.artifacts!.items=[item('a')];});const c={...cmd('artifact.skill_roll',{instance_id:'a',job_id:'champion',expected_skill_id:'monk_finger_offensive'}),expected_revision:f.revision};const call=()=>f.api.fetch(new Request('http://local/api/commands',{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify(c)}));const first=await call();assert.equal(first.status,200);const a=await first.json();assert.equal(a.receipt.outcome,'committed');const once=structuredClone(f.state),b=await(await call()).json();assert.deepEqual(b.receipt,a.receipt);assert.deepEqual(f.state,once);assert.equal(f.writes,1);assert.equal(f.state.artifacts!.reroll_stones,9);
});
test('preview and battle creation use exactly the same Artifact stats and passive modifier once',async()=>{
 const{equipmentStats}=await import('../../src/client/equipment.ts');const{compileCharacterSkills}=await import('../../src/domain/progression/skills.ts');const{storyParty}=await import('../../src/domain/build/story.ts');const{createBattle}=await import('../../src/domain/combat/index.ts');const{actor}=await import('./combat-fixtures.ts');
 const s=fresh(),a=s.roster[0]!;a.skill_levels.monk_iron_fist=10;s.artifacts!.items=[{...item('passive','monk_iron_fist'),rarity_id:'legendary',class_id:'champion',level:10,stars:5}];s.artifacts!.slots.main=['passive',null];
 const skills=Object.fromEntries(s.team.map(p=>[p.character_id,compileCharacterSkills(s.roster.find(a=>a.character_id===p.character_id)!,content)])),party=storyParty(s,content,skills,Object.fromEntries(s.team.map(p=>[p.character_id,'fixture'])));
 const made=createBattle({actors:[...party,{...actor('enemy','enemy',[]),spatial:{x:520,y:400,move_speed:85,radius:30,normal_range:80}}],arena:{width:720,height:820,step_ms:50},timing:{skill_interval_base_ms:3000,normal_attack_base_ms:1500},mode:{kind:'story',ref:'artifact-proof',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,1);assert(made.ok,made.ok?'':JSON.stringify(made.errors));if(!made.ok)return;assert.deepEqual(equipmentStats(s,'main').stats,made.value.actors.find(a=>a.actor_id==='main')!.stats);
 const before=equipmentStats(s,'main').stats;s.artifacts!.slots.main=[null,null];const after=equipmentStats(s,'main').stats;assert(before.physical_attack>after.physical_attack,`P.ATK ${before.physical_attack} > ${after.physical_attack}`);assert(before.max_sp>after.max_sp,`SP ${before.max_sp} > ${after.max_sp}`);
});
test('reroll acceptance rechecks current equipment, lock and exact paid choice without another cost',()=>{
 const s=fresh();s.artifacts!.items=[item('a')];s.artifacts!.slots.main=['a',null];const rolled=run(s,'artifact.skill_roll',{instance_id:'a',job_id:'champion',expected_skill_id:'monk_finger_offensive'}).state,pending=rolled.artifacts!.pending_skill_roll!;
 rolled.artifacts!.items.push({...item('other'),skill_id:pending.replacement_skill_id,class_id:'champion'});rolled.artifacts!.slots.main=['a','other'];const accept={instance_id:'a',roll_id:pending.roll_id,accept:true};let bad=run(rolled,'artifact.skill_decide',accept);assert.equal(bad.receipt.result.code,'ARTIFACT_DUPLICATE_SKILL');assert.deepEqual(bad.state,rolled);
 rolled.artifacts!.slots.main=['a',null];rolled.artifacts!.items[0]!.locked=true;bad=run(rolled,'artifact.skill_decide',accept);assert.equal(bad.receipt.result.code,'ITEM_LOCKED');assert.deepEqual(bad.state,rolled);const keep=run(rolled,'artifact.skill_decide',{...accept,accept:false});assert.equal(keep.receipt.result.code,'ARTIFACT_SKILL_KEPT');assert.equal(keep.state.artifacts!.reroll_stones,9);
});
test('Event reroll stones spend exact tokens and rights, with overflow atomic and existing counters retained',async()=>{
 const{eventPeriod,eventRules}=await import('../../src/domain/modes/events.ts');const{writableEvent,eventTokens,eventRecord}=await import('../../src/domain/progression/events.ts');const s=fresh();s.story.cleared_stage_ids=['1-5'];const id=eventPeriod(Date.parse(at),content).period_id,record=writableEvent(s,id);record.joined=true;record.checkins=['2026-11-02','2026-11-03'];const tokens=eventTokens(record,eventRules(content));
 const q=run(s,'event.redeem',{period_id:id,offer_id:'artifact_reroll',character_id:'main'});assert.equal(q.receipt.outcome,'committed');assert.equal(q.state.artifacts!.reroll_stones,13);assert.equal(eventTokens(eventRecord(q.state,id),eventRules(content)),tokens-60);s.artifacts!.reroll_stones=Number.MAX_SAFE_INTEGER;const bad=run(s,'event.redeem',{period_id:id,offer_id:'artifact_reroll',character_id:'main'});assert.equal(bad.receipt.result.code,'RESOURCE_OVERFLOW');assert.deepEqual(bad.state,s);
});
