import type { AuthController } from './auth-controller.ts';
import { SaveProtocolError } from './save-controller.ts';
export interface SaveSelection { slot: number; save_id: string }
export interface SaveSlot extends SaveSelection { initialized: boolean | null; job_id: string | null; level: number | null; revision: number | null; updated_at: string | null; cleared_stages: number }
export interface SaveSlots { enabled: boolean; owner_id: string; slots: SaveSlot[] }
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export function validateSaveSlots(input:unknown,owner:string):SaveSlots {
 const d=input as SaveSlots;
 if(!d||d.owner_id!==owner||typeof d.enabled!=='boolean'||!Array.isArray(d.slots)||d.slots.length!==(d.enabled?10:1))throw new SaveProtocolError('INVALID_SAVE_SLOT_LIST');
 const ids=new Set<string>();for(const [i,s]of d.slots.entries()){
  if(s.slot!==i+1||!uuid(s.save_id)||ids.has(s.save_id)||(i===0&&s.save_id!==owner)||![true,false,null].includes(s.initialized)||(d.enabled&&s.initialized===null))throw new SaveProtocolError('INVALID_SAVE_SLOT_LIST');
  if(s.initialized===true&&(!Number.isSafeInteger(s.revision)||s.revision!<1||typeof s.updated_at!=='string'||!Number.isFinite(Date.parse(s.updated_at))))throw new SaveProtocolError('INVALID_SAVE_SLOT_LIST');
  ids.add(s.save_id);
 }
 return d;
}
export async function readSaveSlots(auth:AuthController,signal?:AbortSignal,request:typeof fetch=fetch):Promise<SaveSlots>{
 const owner=auth.snapshot.user?.id,token=await auth.getAccessToken();if(!owner||!token||auth.snapshot.user?.id!==owner)throw new SaveProtocolError('SIGN_IN_REQUIRED',401);signal?.throwIfAborted();
 const response=await request('/api/save-slots',{headers:{authorization:`Bearer ${token}`},signal,cache:'no-store'});
 if(auth.snapshot.user?.id!==owner)throw new SaveProtocolError('SIGN_IN_REQUIRED',401);
 if(response.status===401){auth.markUnauthorized();throw new SaveProtocolError('SIGN_IN_REQUIRED',401);}
 if(!response.ok)throw new SaveProtocolError('SAVE_SLOTS_UNAVAILABLE',response.status);
 const value=validateSaveSlots(await response.json(),owner);signal?.throwIfAborted();if(auth.snapshot.user?.id!==owner)throw new SaveProtocolError('SIGN_IN_REQUIRED',401);return value;
}
