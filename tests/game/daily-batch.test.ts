import test from 'node:test';
import type { ContentData } from '../../src/content/model.ts';
import assert from 'node:assert/strict';
import type { BattleCheckpoint } from '../../src/contracts/index.ts';
import { settleDailyRewards } from '../../src/domain/account/daily-settlement.ts';
import { dailyChest,dailyBoss } from '../../src/domain/modes/daily.ts';
import { claimRewards } from '../../src/domain/progression/claim-rewards.ts';
import { dailyRewardCount,finishFailureMessage } from '../../src/client/daily-rewards.ts';
import { recoverCompatibleDaily } from '../../src/domain/account/daily-battle-recovery.ts';
import compat from '../../src/domain/account/daily-recovery-compat.ts';
import { largeDailyFixture,phaseCheckpoint } from './daily-batch-fixtures.ts';
import { content } from './combat-fixtures.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';

const rules=new AccountCommandRules(content),at='2026-10-28T05:01:01.000Z';
test('D197 40 and100 boxes fit one pending claim, preserve exact per-phase sums and charge one right',()=>{
 for(const n of[40,100]){const f=largeDailyFixture(),checkpoint=phaseCheckpoint(f.terminal,n),before={...f.state.wallet};
  const count=settleDailyRewards(f.state,checkpoint,f.battle.battle_id,at,content);assert.equal(count,n);assert.equal(f.state.pending_rewards.length,1);assert.equal(dailyRewardCount(f.state.pending_rewards),n);assert.equal(f.state.daily_records[0]!.attempts_used,0);assert.equal(f.state.daily_records[0]!.phase,n+1);
  const total=Array.from({length:n},(_,i)=>dailyChest(dailyBoss('treasury',content),i+1,2).gold!).reduce((a,b)=>a+b,0);assert.equal(f.state.pending_rewards[0]!.resource_vector.gold,total);rules.validateAccount(f.state);
  assert.equal(settleDailyRewards(f.state,checkpoint,f.battle.battle_id,at,content),0);assert.equal(f.state.pending_rewards.length,1);
  claimRewards(f.state,[f.state.pending_rewards[0]!.claim_id],content);assert.equal(f.state.wallet.gold,before.gold+total);assert.equal(f.state.daily_records[0]!.attempts_used,1);
 }
});
test('D197 actual shared replay clears over32 phases and finishes with one claim; bounded queue/overflow roll back',()=>{
 const f=largeDailyFixture();assert.ok(f.terminal.mode.reserved_phase_keys.length>32);const n=settleDailyRewards(f.state,f.terminal,f.battle.battle_id,at,content);assert.equal(n,f.terminal.mode.reserved_phase_keys.length);assert.equal(f.state.pending_rewards.length,1);
 const g=largeDailyFixture(),template=structuredClone(f.state.pending_rewards[0]!);delete template.daily_attempt;template.kind='farm';template.source_keys=['farm:fixture'];g.state.pending_rewards=Array.from({length:32},(_,i)=>({...structuredClone(template),claim_id:'prior_'+i})) as typeof g.state.pending_rewards;const before=structuredClone(g.state);assert.throws(()=>settleDailyRewards(g.state,g.terminal,g.battle.battle_id,at,content),/PENDING_REWARDS_FULL/);assert.deepEqual(g.state,before);g.state.pending_rewards.pop();assert.ok(settleDailyRewards(g.state,g.terminal,g.battle.battle_id,at,content)>32);assert.equal(g.state.pending_rewards.length,32);
 const h=largeDailyFixture(),bad=structuredClone(h.terminal),prior=structuredClone(h.state);bad.mode.reserved_phase_keys=[String(Number.MAX_SAFE_INTEGER)];assert.throws(()=>settleDailyRewards(h.state,bad,h.battle.battle_id,at,content),/RESOURCE_OVERFLOW/);assert.deepEqual(h.state,prior);
});
test('D197 recognized old daily checkpoint recovers exact replay on migration, with strict data/core/identity proofs and minimum elapsed',()=>{
 const f=largeDailyFixture(),old=structuredClone(f.state),battle=structuredClone(f.battle);old.active_battle!.content_hash=compat.content_hash;battle.content_hash=compat.content_hash;(battle.payload as BattleCheckpoint).content_hash=compat.content_hash;const context={account_id:battle.account_id,now_ms:Date.parse(at),started_ms:Date.parse(old.active_battle!.started_at),server_at:at,battle};
 const migrated=rules.migrateSave(old,context).state;assert.equal(migrated.active_battle,null);assert.equal(dailyRewardCount(migrated.pending_rewards),f.terminal.mode.reserved_phase_keys.length);assert.equal(migrated.daily_records[0]!.attempts_used,0);assert.equal(migrated.daily_records[0]!.phase,f.terminal.mode.daily_phase);
 assert.deepEqual(rules.migrateSave(migrated,context).state,migrated);assert.equal(rules.migrateSave(old,{...context,now_ms:context.started_ms+1}).state.pending_rewards.length,0);
 for(const bad of[{...context,account_id:'foreign'},{...context,battle:{...battle,battle_id:'foreign'}}])assert.throws(()=>rules.migrateSave(old,bad),/DAILY_RECOVERY_CONTEXT_MISMATCH/);
 const changed=structuredClone(content) as ContentData;changed.manifest.engine_data_hash='f'.repeat(64);assert.throws(()=>recoverCompatibleDaily(old,structuredClone(migrated),[],changed,context),/DAILY_RECOVERY_INCOMPATIBLE/);
 const core=Object.keys(compat.core_sources)[0]!;changed.manifest.engine_data_hash=content.manifest.engine_data_hash;changed.manifest.input_sha256[core]='f'.repeat(64);assert.throws(()=>recoverCompatibleDaily(old,structuredClone(migrated),[],changed,context),/DAILY_RECOVERY_INCOMPATIBLE/);
});
test('D197 counted phase keys preserve legacy boxes and errors offer an actionable reason',()=>{
 const f=largeDailyFixture();settleDailyRewards(f.state,phaseCheckpoint(f.terminal,40),f.battle.battle_id,at,content);const batch=f.state.pending_rewards[0]!;const legacy:typeof batch={...structuredClone(batch),claim_id:'old_one',source_keys:['daily:forge:2026-10-28:1']};delete legacy.daily_attempt;assert.equal(dailyRewardCount([batch,legacy]),41);assert.match(finishFailureMessage('PENDING_REWARDS_FULL'),/รับรางวัลเดิม/);assert.match(finishFailureMessage(null),/รายการเดิม/);
});
