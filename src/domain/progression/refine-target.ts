import type {AccountState,Command,Receipt} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {applySlotCommand,refinePityBonus,slotData,upgradeQuote} from './slots.ts';
import {ProgressionRejection} from './rejection.ts';

/** One transaction, with exactly the same price, chance and pity as consecutive single attempts. */
export function applyRefineTarget(state:AccountState,command:Extract<Command,{type:'slot.refine_target'}>,content:ValidatedContent,draw:()=>number):NonNullable<Receipt['result']['refine_batch']>{
 if(state.active_battle)throw new ProgressionRejection('BUILD_LOCKED_DURING_BATTLE');
 const {character_id,slot,target_level}=command.params,actor=state.roster.find(a=>a.character_id===character_id);
 if(!actor)throw new ProgressionRejection('CHARACTER_NOT_FOUND');
 const progress=actor.slot_progress[slot],rules=slotData(content).refine,from=progress.refine;
 upgradeQuote(from,target_level,rules.max,rules.upgrade_rows);
 // Pity guarantees termination even with a maximally unlucky stream and unlimited funds.
 let bound=0;
 for(let n=from+1;n<=target_level;n++){
  const chance=rules.success_chance_by_target[String(n)],bonus=refinePityBonus(n,content);
  if(chance===undefined||!Number.isFinite(chance)||chance<0||chance>1||rules.pity.cap!==1||!(bonus>0))throw new Error('INVALID_REFINE_TARGET_RULES');
  bound+=Math.ceil((1-chance)/bonus)+2;
 }
 let attempts=0;
 while(progress.refine<target_level){
  const next=progress.refine+1,cost=upgradeQuote(progress.refine,next,rules.max,rules.upgrade_rows);
  if(Object.entries(cost).some(([key,value])=>state.wallet[key as keyof AccountState['wallet']]<value!))break;
  if(attempts>=bound)throw new Error('REFINE_PITY_BOUND_EXCEEDED');
  const roll=draw();if(!Number.isFinite(roll)||roll<0||roll>=1)throw new Error('SERVER_ROLL_REQUIRED');
  applySlotCommand(state,{...command,type:'slot.refine',params:{character_id,slot,target_level:next}},content,roll);
  attempts++;
 }
 if(!attempts)throw new ProgressionRejection('INSUFFICIENT_RESOURCES');
 const successes=progress.refine-from;
 return{character_id,slot,from_level:from,to_level:progress.refine,target_level,attempts,successes,failures:attempts-successes,stop_reason:progress.refine===target_level?'target_reached':'insufficient_resources'};
}
