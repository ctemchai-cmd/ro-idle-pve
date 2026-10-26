import{withoutD180Document,mvpMagicIds}from'./legacy-mvp-magic-scope.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const magicCardIds=['card_scaraba','card_necromancer','card_agav','card_siroma','card_imp'];
const frozen=(name:string)=>JSON.parse(readFileSync(`plan/evidence/task-155/before-${name}.json`,'utf8'));
/** Historical renderer/gear checks keep their original oracle. Remove only the
 * five explicitly tested D179 additions, never unrelated existing definitions. */
export function withoutD179Document<T>(key:string,value:T):T{
 const c=withoutD180Document(key,value) as any;
 if(key==='cards.json'){
  c.definitions=c.definitions.filter((r:any)=>!magicCardIds.includes(r.id));c.presentations=c.presentations.filter((r:any)=>!magicCardIds.some(id=>r.id===`visual_${id}`));
  for(const id of magicCardIds)delete c.origins[id];for(const id of['horn_scaraba','necromancer','agav','siroma','imp'])delete c.monster_traits[id];
  const old=frozen('cards');c.content_version=old.content_version;c.catalog_basis=old.catalog_basis;
 }
 if(key==='gacha.json'){const old=frozen('gacha');c.definitions=c.definitions.filter((id:string)=>![...magicCardIds,...mvpMagicIds].includes(id));for(const id of magicCardIds)delete c.definition_weights[id];c.definition_choice=old.definition_choice;}
 if(key==='strings.th.json')for(const id of magicCardIds)delete c.strings[id];
 return c;
}
export function withoutD179Schema<T>(key:string,value:T):T{
 const c=structuredClone(value) as any;
 if(key==='item'){delete c.properties.combat_bonuses;delete c.$defs;}
 if(key==='battle-checkpoint')delete c.properties.actors.items.properties.stat_blueprint.properties.permanent_sources.items.properties.combat_bonuses;
 return c;
}
export function assertD179File(file:string,expected:unknown){
 const match=/^plan\/data\/(cards|gacha|strings\.th)\.json$/.exec(file),schema=/^plan\/data\/schemas\/(item|battle-checkpoint)\.json$/.exec(file);
 if(match||schema){const key=match?.[1]??schema![1]!,beforeFile=`plan/evidence/task-155/before-${schema?'schema-':''}${key}.json`,old=readFileSync(beforeFile);assert.equal(createHash('sha256').update(old).digest('hex'),expected,file+' frozen historical SHA');const actual=JSON.parse(readFileSync(file,'utf8'));assert.deepEqual(schema?withoutD179Schema(key,actual):withoutD179Document(key+'.json',actual),JSON.parse(old.toString()),file+' only named D179 additions');}
 else assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),expected,file);
}
export function assertD179Media(file:string,expected:string){
 const rows=[...JSON.parse(readFileSync('plan/evidence/task-155/lossless.json','utf8')).entries,...JSON.parse(readFileSync('plan/evidence/task-156/lossless.json','utf8')).entries],row=rows.find((r:any)=>'assets/ro/'+r.path===file);
 if(row){assert.equal(row.before_sha,expected,file+' original bytes');assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),row.after_sha,file+' exact-RGBA recompression');}
 else assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),expected,file);
}
export function withoutD179FarmCards<T>(value:T):T{
 const c=structuredClone(value) as any;if(!c)return c;
 c.definition_pool=c.definition_pool.filter((id:string)=>![...magicCardIds,...mvpMagicIds].includes(id));
 for(const id of [...magicCardIds,...mvpMagicIds]){delete c.definition_weights[id];if(c.definition_rarities)delete c.definition_rarities[id];}return c;
}
