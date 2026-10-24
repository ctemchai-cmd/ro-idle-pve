import type { AccountState } from '../../src/contracts/index.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { continueAuto, newAutoRun, nextAutoTarget, AUTO_LOSS_LIMIT, pendingProgressCollection } from '../../src/client/auto-battle.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';

test('D164 Story/Tower count confirmed losses/timeouts once each, stop at three total, and never restart from duplicate receipt',()=>{
 for(const mode of ['story','tower'] as const){
  let run=newAutoRun(mode);
  for(let i=1;i<=AUTO_LOSS_LIMIT;i++){
   const outcome={id:'battle'+i,kind:mode,stage:mode==='tower'?'21':'6-15',code:mode.toUpperCase()+(i===2?'_TIME_LIMIT':'_DEFEATED')};
   const result=continueAuto(run,outcome,null);
   if(i<3){assert.equal(result.run!.failures,i);assert.deepEqual(result.target,mode==='tower'?{kind:'tower',floor:21}:{kind:'story',id:'6-15'});run=result.run!;assert.deepEqual(continueAuto(run,outcome,null),{run,target:null});}
   else assert.deepEqual(result,{run:null,target:null,reason:'loss_limit'});
  }
 }
});
test('D164 a confirmed win resets retries and advances exactly one frontier; release completion/mode mismatch stop instead of looping',()=>{
 let run={...newAutoRun('story'),failures:2};const outcome={id:'win',kind:'story',stage:'1-1',code:'STORY_WON'},next={kind:'story' as const,id:'1-2'};
 const result=continueAuto(run,outcome,next);assert.equal(result.run!.failures,0);assert.deepEqual(result.target,next);assert.equal(result.run!.lastBattleId,'win');
 assert.deepEqual(continueAuto(run,outcome,null),{run:null,target:null,reason:'complete'});
 assert.equal(continueAuto(run,{...outcome,kind:'daily'},next).reason,'mode_changed');
 assert.equal(continueAuto(run,{...outcome,code:'STORY_RETREATED'},next).reason,'mode_changed');
});
test('D164 Auto target uses released Story and actual Tower frontier, without bypassing locks or the final chapter',()=>{
 const state=initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-24T00:00:00Z','2026-10-24',1);
 assert.deepEqual(nextAutoTarget(state,'story'),{kind:'story',id:'1-1'});assert.equal(nextAutoTarget(state,'tower'),null);
 state.story.cleared_stage_ids=storyStages(content).slice(0,10).map(s=>s.id);assert.deepEqual(nextAutoTarget(state,'story'),{kind:'story',id:'2-1'});
 state.story.cleared_stage_ids=storyStages(content).slice(0,20).map(s=>s.id);state.tower.highest_cleared_floor=100;assert.deepEqual(nextAutoTarget(state,'tower'),{kind:'tower',floor:101});
 state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);assert.equal(nextAutoTarget(state,'story'),null);
});
test('D164 deferred collection only selects fixed progress rewards that fit as a whole batch and never auto-claims daily chests',()=>{
 const state=initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-24T00:00:00Z','2026-10-24',1);
 const zero=Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])) as typeof state.wallet;
 const claim=(id:string,kind:'story'|'daily'|'farm',gold:number):AccountState['pending_rewards'][number]=>({claim_id:id,kind,resource_vector:{...zero,gold},items:[],content_version:'v1',reserved_at:'2026-10-24T00:00:00Z',source_keys:[id],status:'pending' as const});
 state.pending_rewards=[claim('story','story',1),claim('daily','daily',5),claim('farm','farm',2)];
 assert.deepEqual(pendingProgressCollection(state),['story','farm']);assert.equal(state.pending_rewards.length,3);
 state.wallet.gold=Number.MAX_SAFE_INTEGER-1;assert.deepEqual(pendingProgressCollection(state),['story']);
});
