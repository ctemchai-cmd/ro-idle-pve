import type { AccountState } from '../../contracts/index.ts';
import type { EquipmentSlot } from '../../client/equipment.ts';
/** A compact projection of the owner's slot, independent of the item instance. */
export function EquipmentProgress({state,characterId,slot}:{state:AccountState;characterId:string;slot:EquipmentSlot}){
 const actor=state.roster.find(a=>a.character_id===characterId),progress=actor?.slot_progress[slot];
 if(!actor?.equipment[slot]||!progress||(!progress.refine&&!progress.enchant.level))return null;
 return <span className="equipment-progress" aria-label={`Refine +${progress.refine} · Enchant ${progress.enchant.level}`} title={`Refine +${progress.refine} · Enchant ${progress.enchant.level}`}>
  {progress.refine>0&&<b className="progress-refine">+{progress.refine}</b>}{progress.enchant.level>0&&<b className="progress-enchant">{progress.enchant.level}</b>}
 </span>;
}
