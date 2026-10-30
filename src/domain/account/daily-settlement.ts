import type { AccountState, BattleCheckpoint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { dailyBoss, dailyChest, parseDailyRef } from '../modes/daily.ts';
import { ProgressionRejection } from '../progression/rejection.ts';

/** One fixed claim per run; phase keys still guard each individual chest. */
export function settleDailyRewards(state: AccountState, checkpoint: BattleCheckpoint, battleId: string, serverAt: string, content: ValidatedContent,artifactRewards=true): number {
  const { id } = parseDailyRef(checkpoint.mode.ref), day = checkpoint.mode.ticket_day;
  const record = state.daily_records.find(r => r.boss_id === id && r.ticket_day === day);
  if (checkpoint.mode.kind !== 'daily' || !record || !day) throw new ProgressionRejection('DAILY_RECORD_MISSING');
  const fresh = [...new Set(checkpoint.mode.reserved_phase_keys.map(Number))].filter(p => Number.isSafeInteger(p) && p > 0 && !record.rewarded_phases.includes(p)).sort((a,b)=>a-b);
  const vector = Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])) as AccountState['wallet'];
  for (const phase of fresh) for (const [key,amount] of Object.entries(dailyChest(dailyBoss(id,content),phase,record.chapter_snapshot)) as [keyof AccountState['wallet'],number][]) {
    const total=vector[key]+amount;if(!Number.isSafeInteger(total))throw new ProgressionRejection('RESOURCE_OVERFLOW');vector[key]=total;
  }
  const claimId=`daily_run_${battleId}`, existing=state.pending_rewards.find(c=>c.claim_id===claimId);
  const limit=Number((content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit);
  if(fresh.length&&!existing&&state.pending_rewards.length>=limit)throw new ProgressionRejection('PENDING_REWARDS_FULL');
  if(existing)for(const key of Object.keys(vector) as (keyof typeof vector)[])if(!Number.isSafeInteger(existing.resource_vector[key]+vector[key]))throw new ProgressionRejection('RESOURCE_OVERFLOW');
  record.phase=checkpoint.mode.daily_phase??record.phase;
  record.current_hp=Math.max(1,checkpoint.actors.find(a=>a.actor_id==='enemy_front')?.hp??record.current_hp);
  if(!fresh.length)return 0;
  const artifact=artifactRewards&&record.chapter_snapshot>=8?{essence:fresh.length*5,tickets:fresh.filter(p=>p%10===0).length}:undefined;
  const keys=fresh.map(p=>`daily:${id}:${day}:${p}`);record.rewarded_phases.push(...fresh);
  if(existing){if(artifact)existing.artifact_rewards={essence:(existing.artifact_rewards?.essence??0)+artifact.essence,tickets:(existing.artifact_rewards?.tickets??0)+artifact.tickets};for(const key of Object.keys(vector) as (keyof typeof vector)[])existing.resource_vector[key]+=vector[key];existing.source_keys.push(...keys);}
  else state.pending_rewards.push({claim_id:claimId,kind:'daily',...(artifact?{artifact_rewards:artifact}:{}),daily_attempt:{boss_id:id,ticket_day:day,battle_id:battleId,charged:false},resource_vector:vector,items:[],content_version:content.manifest.content_version,reserved_at:serverAt,source_keys:[`battle:${battleId}`,...keys],status:'pending'});
  return fresh.length;
}
