import {canonical} from '../../src/content/value.ts';
/** Account/economy extensions cannot change replay. Seal every combat-readable document and its validation schemas. */
export function combatReplayProjection(documents:Record<string,unknown>,schemas:Record<string,unknown>):string{
 const docs=Object.fromEntries(Object.entries(documents).filter(([k])=>['combat-rules.json','stat-definitions.json','status-effects.json','class-status-effects.json','effect-primitives.json','formula-registry.json','summon-actors.json','progression.json','enemies.json'].includes(k)||k.startsWith('skills/')));
 for(const[key,value]of Object.entries(docs)){const row=structuredClone(value) as Record<string,unknown>;for(const field of ['builds','reference_cases','reference_profiles','checkpoints','checkpoint_limits','reference_team','reference_teams','supreme_analysis','notes'])delete row[field];docs[key]=row;}
 const progression=docs['progression.json'] as Record<string,any>|undefined;if(progression){const clone=structuredClone(progression);clone.release.excluded_features=clone.release.excluded_features.filter((x:string)=>x!=='artifact');docs['progression.json']=clone;}
 const types=structuredClone(Object.fromEntries(Object.entries(schemas).filter(([k])=>!['account-state','command','receipt','item','simulation-scenario'].includes(k)))) as Record<string,any>;
 // Only the new mode label is additive; old checkpoints never select it.
 const kind=types['battle-checkpoint']?.properties?.mode?.properties?.kind;if(kind?.enum)kind.enum=kind.enum.filter((x:string)=>!['mvp','event'].includes(x));
 return canonical({documents:docs,schemas:types});
}
