import type {AssetPack} from '../../renderer/pack.ts';
import {ResIcon,full} from './kit.tsx';

export function EventCurrency({amount,pack}:{amount:number;pack:AssetPack|null}){
 return <span className="event-currency" role="img" aria-label={`${full(amount)} แต้มกิจกรรม`}><ResIcon pack={pack} k="event_token"/><b>{full(amount)}</b></span>;
}
