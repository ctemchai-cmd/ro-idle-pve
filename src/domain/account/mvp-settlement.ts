import type {AccountState} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {mvpReward,mvpWeek,mvpBosses,parseMvpRef} from '../modes/mvp.ts';
import {ProgressionRejection} from '../progression/rejection.ts';
import {grantArtifactRewards} from '../progression/artifacts.ts';
export function settleMvp(state:AccountState,ref:string,nowMs:number,c:ValidatedContent){
 const{week,id,tier}=parseMvpRef(ref);if(week!==mvpWeek(nowMs)||!mvpBosses(nowMs,c).some(b=>b.id===id))return;
 const hunt=state.mvp_hunt?.week===week?state.mvp_hunt:{week,best:{}},before=hunt.best[id]??0;if(tier<=before)return;
 const old=mvpReward(before),reward=mvpReward(tier),crystal=state.wallet.crystal+reward.crystal-old.crystal;if(!Number.isSafeInteger(crystal))throw new ProgressionRejection('RESOURCE_OVERFLOW');
 grantArtifactRewards(state,{essence:reward.essence-old.essence,tickets:reward.tickets-old.tickets});state.wallet.crystal=crystal;hunt.best[id]=tier;state.mvp_hunt=hunt;
}
