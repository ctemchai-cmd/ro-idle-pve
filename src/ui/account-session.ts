import { useEffect, useState } from 'react';
import type { AuthController } from '../client/auth-controller.ts';
import { SaveController } from '../client/save-controller.ts';
import { createBrowserSavePorts } from '../client/save-browser.ts';
/** One lifecycle for account/status/roster/Story screens. Full-page navigation releases the writer. */
export function useAccountSave(auth:AuthController,scope:string){
 const[controller]=useState(()=>{let storage:Storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('BACKUP_UNAVAILABLE');}}as unknown as Storage;}return new SaveController(createBrowserSavePorts(auth,scope,storage,navigator.locks));});
 const[save,setSave]=useState(controller.snapshot);
 useEffect(()=>{const unsubscribe=controller.subscribe(setSave);controller.setOnline(navigator.onLine);void controller.start(auth.snapshot.user!.id);
  const online=()=>{controller.setOnline(true);void controller.reconnect();},offline=()=>controller.setOnline(false),visibility=()=>{if(document.hidden)void controller.suspend();else if(navigator.onLine)void controller.reconnect();};
  window.addEventListener('online',online);window.addEventListener('offline',offline);document.addEventListener('visibilitychange',visibility);
  return()=>{unsubscribe();controller.dispose();window.removeEventListener('online',online);window.removeEventListener('offline',offline);document.removeEventListener('visibilitychange',visibility);};
 },[auth,controller]);
 return{controller,save};
}
