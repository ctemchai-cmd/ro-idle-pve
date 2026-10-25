import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const frozen=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-148/before-authored.json.gz',import.meta.url))).toString());
export const beforeD172=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-148/before-content.json.gz',import.meta.url))).toString());
/** Normalize only D172's named additions for historical scope checks. New actual
 * command/pool/level/migration tests independently verify those additions. */
export function withoutD172Document<T>(key:string,value:T):T{
 const copy=structuredClone(value) as any;
 if(key==='equipment.json'){
  copy.definitions=copy.definitions.filter((r:any)=>r.tier_level<=60);
  const ids=new Set(copy.definitions.map((r:any)=>r.presentation_id));copy.presentations=copy.presentations.filter((r:any)=>ids.has(r.id));
  copy.future_definitions=structuredClone(frozen.equipment.future_definitions);copy.future_tiers=structuredClone(frozen.equipment.future_tiers);
  delete copy.random_options.tier_scale['80'];delete copy.random_options.tier_scale['100'];
 }
 if(key==='progression.json'){
  copy.release.level_cap=frozen.progression.release.level_cap;copy.hi_class.level_cap=frozen.progression.hi_class.level_cap;
  copy.hi_class.level_rows=copy.hi_class.level_rows.filter((r:any)=>r.level<=90);copy.hi_class.level_rows.at(-1).next_level_cost=null;
 }
 if(key==='loot.json')for(const c of['11','12'])copy.gear.tier_by_chapter[c]=frozen.loot.gear.tier_by_chapter[c];
 if(key==='strings.th.json'){
  for(const id of Object.keys(copy.strings))if(/^equipment_.*_100(?:_|$)/.test(id))delete copy.strings[id];
  for(const row of frozen.equipment.future_definitions)copy.strings[row.name_key]=frozen['strings.th'].strings[row.name_key];
 }
 return copy;
}
export function withoutD172Schemas<T>(value:T):T{
 const copy=structuredClone(value) as any;
 copy['account-state'].properties.roster.items.properties.level.maximum=90;
 for(const branch of copy['account-state'].properties.farm.properties.rate_snapshot.oneOf)if(branch.properties)branch.properties.gear_tier.enum=branch.properties.gear_tier.enum.filter((n:number)=>n<=60);
 copy.item.properties.tier_level.enum=copy.item.properties.tier_level.enum.filter((n:number)=>n<=60);copy.item.properties.required_level.maximum=70;
 for(const branch of copy.command.oneOf)if(branch.properties.type.const==='character.level_up')branch.properties.params.properties.target_level.maximum=90;
 copy['battle-checkpoint'].properties.actors.items.allOf[0].then.properties.stat_blueprint.properties.level.maximum=90;
 return copy;
}
