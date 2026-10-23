import type { AccountState } from '../../contracts/index.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { ClassIcon } from './class-icon.tsx';
import { friendNames } from './kit.tsx';

/** Current roster profession, including off-team owners; never infer from names. */
export function OwnerBadge({state,characterId,pack,compact=false}:{state:AccountState;characterId:string;pack:AssetPack|null;compact?:boolean}){
 const actor=state.roster.find(a=>a.character_id===characterId),name=friendNames[characterId]??characterId;
 return <span className={`owner-badge${compact?' compact':''}`} data-owner={characterId} title={`สวมโดย ${name}`}>{actor&&<ClassIcon job={actor.job_id} pack={pack} size={18}/>}<span>{name}</span></span>;
}
