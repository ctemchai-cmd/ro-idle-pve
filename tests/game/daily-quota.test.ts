import { dailyRewardCount } from '../../src/client/daily-rewards.ts';
import test from 'node:test';
import { migrateDailyQuota } from '../../src/domain/account/daily-quota-migration.ts';
import assert from 'node:assert/strict';
import type { AccountState } from '../../src/contracts/index.ts';
import { fixture, unlocked } from './daily-fixtures.ts';
import { content } from './combat-fixtures.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { dailyRecord, dailyChest, dailyBoss } from '../../src/domain/modes/daily.ts';
import { characterResetFixture } from './character-reset-fixtures.ts';

const rules = new AccountCommandRules(content), day='2026-10-28';
const ready=()=>fixture(unlocked(),'2026-10-28T05:00:00Z');
function finish(f:ReturnType<typeof ready>,boss='treasury') {
  assert.equal(f.run('battle.start_daily',{boss_id:boss}).result.code,'DAILY_STARTED');
  assert.equal(f.run('battle.finish',{battle_id:f.state.active_battle!.battle_id},60000).result.code,'DAILY_FINISHED');
  const claims=f.state.pending_rewards.filter(c=>c.daily_attempt?.boss_id===boss&&!c.daily_attempt.charged);
  assert.ok(dailyRewardCount(claims)>1); return claims;
}
test('D196 no quota before reward, empty retreat/reload and terminal replay do not spend',()=>{
 const f=ready();for(let i=0;i<4;i++){assert.equal(f.run('battle.start_daily',{boss_id:'forge'}).outcome,'committed');assert.equal(f.state.daily_records[0]!.attempts_used,0);assert.equal(f.run('battle.retreat',{battle_id:f.state.active_battle!.battle_id},0).outcome,'committed');assert.equal(f.state.daily_records[0]!.attempts_used,0);}
 const claims=finish(f);const row=f.state.daily_records.find(r=>r.boss_id==='treasury')!;assert.equal(row.attempts_used,0);
 assert.equal(f.run('battle.start_daily',{boss_id:'treasury'}).result.code,'DAILY_REWARDS_PENDING');
 assert.deepEqual(rules.migrateSave(f.state).state.pending_rewards,claims);
 const batch=f.state.pending_rewards[0]!,one=structuredClone(batch),key=batch.source_keys.find(k=>k.startsWith('daily:'))!;one.claim_id+='-legacy';one.source_keys=[key,...one.source_keys.filter(k=>k.startsWith('battle:'))];batch.source_keys=batch.source_keys.filter(k=>k!==key) as typeof batch.source_keys;const amount=dailyChest(dailyBoss('treasury',content),Number(key.split(':').at(-1)),2).gold!;one.resource_vector={...batch.resource_vector,gold:amount};batch.resource_vector.gold-=amount;f.state.pending_rewards.push(one);
 const first=claims[0]!.claim_id;assert.equal(f.run('reward.claim',{claim_id:first}).outcome,'committed');assert.equal(f.state.daily_records.find(r=>r.boss_id==='treasury')!.attempts_used,1);
 assert.ok(f.state.pending_rewards.every(c=>c.daily_attempt?.charged));
 assert.equal(f.run('reward.claim',{claim_id:first}).result.code,'CLAIM_NOT_FOUND');
 assert.equal(f.run('reward.claim',{claim_ids:f.state.pending_rewards.map(c=>c.claim_id)}).outcome,'committed');assert.equal(f.state.daily_records.find(r=>r.boss_id==='treasury')!.attempts_used,1);
});
test('D196 rejected overflow and mixed batch never spend rights or clear rewards; three received runs exhaust quota',()=>{
 const f=ready();const claims=finish(f);f.state.wallet.gold=Number.MAX_SAFE_INTEGER;const before=structuredClone(f.state);
 assert.equal(f.run('reward.claim',{claim_ids:claims.map(c=>c.claim_id)}).result.code,'RESOURCE_OVERFLOW');assert.deepEqual(f.state,before);
 f.state.wallet.gold=0;for(let n=1;n<=3;n++){if(n>1)finish(f);assert.equal(f.run('reward.claim',{claim_ids:f.state.pending_rewards.map(c=>c.claim_id)}).outcome,'committed');assert.equal(f.state.daily_records[0]!.attempts_used,n);}
 assert.equal(f.run('battle.start_daily',{boss_id:'treasury'}).result.code,'DAILY_NO_ATTEMPTS');
});
test('D196 old prepaid boxes stay prepaid; expired ticket claims never charge today',()=>{
 const f=ready(),claims=finish(f);for(const c of claims)delete c.daily_attempt;f.state.daily_records[0]!.attempts_used=2;
 assert.equal(f.run('reward.claim',{claim_ids:claims.map(c=>c.claim_id)}).outcome,'committed');assert.equal(f.state.daily_records[0]!.attempts_used,2);
 const g=ready(),old=finish(g);g.state.daily_records=[];assert.equal(g.run('reward.claim',{claim_ids:old.map(c=>c.claim_id)},3*86400000).outcome,'committed');assert.equal(g.state.daily_records.length,0);
});
test('D196 migration refunds only legacy prepaid active ticket once and preserves pending boxes',()=>{
 const f=ready();f.run('battle.start_daily',{boss_id:'essence'});const old=structuredClone(f.state);delete old.daily_records[0]!.quota_policy;old.daily_records[0]!.attempts_used=1;
 const next=rules.migrateSave(old).state;assert.equal(next.daily_records[0]!.attempts_used,0);assert.equal(next.active_battle,null);assert.equal(next.daily_records[0]!.quota_policy,'reward_claim_v1');assert.deepEqual(rules.migrateSave(next).state,next);
 const current=rules.migrateSave(f.state).state;assert.equal(current.daily_records[0]!.attempts_used,0);
});
test('D196 authorized Champion100 slot1 recovery resets only 28Oct quota once; never other save identities',()=>{
 const s=characterResetFixture('champion').state;s.daily_records=['treasury','forge','essence'].map(id=>{const r=structuredClone(dailyRecord(s,id as 'treasury',day,content));delete r.quota_policy;r.attempts_used=3;r.phase=4;r.rewarded_phases=[1,2,3];return r;}) as AccountState['daily_records'];
 const before=structuredClone(s),context={account_id:'c37edad4-ec3c-4541-8cba-194bd21e285c',now_ms:Date.parse(day+'T05:00:00Z')};
 const next=rules.migrateSave(s,context).state;assert.deepEqual(next.daily_records.map(r=>r.attempts_used),[0,0,0]);
 for(const field of ['wallet','roster','inventory','story','tower','farm','shop','gacha','pending_rewards'] as const)assert.deepEqual(next[field],before[field],field);
 assert.deepEqual(rules.migrateSave(next,context).state,next);
 for(const ctx of [{...context,account_id:'other-slot'},{...context,now_ms:context.now_ms+86400000}])assert.deepEqual(rules.migrateSave(s,ctx).state.daily_records.map(r=>r.attempts_used),[3,3,3]);
 const low=structuredClone(s);low.roster.find(a=>a.kind==='main')!.level=99;migrateDailyQuota(low,[],context);assert.deepEqual(low.daily_records.map(r=>r.attempts_used),[3,3,3]);
});

test('D196 mixed daily reward batch charges each distinct run once and retains each boss phase',()=>{
 const f=ready();finish(f,'treasury');finish(f,'forge');const phases=f.state.daily_records.map(r=>r.phase);assert.equal(f.run('reward.claim',{claim_ids:f.state.pending_rewards.map(c=>c.claim_id)}).outcome,'committed');assert.deepEqual(f.state.daily_records.map(r=>r.attempts_used),[1,1]);assert.deepEqual(f.state.daily_records.map(r=>r.phase),phases);
});

test('D196 collection after Bangkok midnight pays only the original ticket day',()=>{
 const f=fixture(unlocked(),'2026-10-28T16:59:44Z');const claims=finish(f,'forge');assert.equal(f.state.daily_records[0]!.attempts_used,0);assert.equal(f.run('reward.claim',{claim_ids:claims.map(c=>c.claim_id)}).outcome,'committed');assert.equal(f.state.daily_records[0]!.ticket_day,'2026-10-28');assert.equal(f.state.daily_records[0]!.attempts_used,1);assert.equal(f.run('battle.start_daily',{boss_id:'forge'}).outcome,'committed');assert.equal(f.state.daily_records.find(r=>r.ticket_day==='2026-10-29')!.attempts_used,0);
});

test('D196 validation rejects mismatched reward source and contradictory paid siblings',()=>{
 const f=ready();finish(f);const invalid=structuredClone(f.state);invalid.pending_rewards[0]!.daily_attempt!.boss_id='forge';assert.throws(()=>rules.validateAccount(invalid),/INVALID_DAILY_QUOTA_REFERENCE/);const mixed=structuredClone(f.state),sibling=structuredClone(mixed.pending_rewards[0]!);sibling.claim_id+='-old-sibling';sibling.daily_attempt!.charged=true;mixed.pending_rewards.push(sibling);assert.throws(()=>rules.validateAccount(mixed),/INVALID_DAILY_QUOTA_REFERENCE/);
});
