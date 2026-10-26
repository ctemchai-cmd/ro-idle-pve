import{withoutHierarchySkillTree}from'./legacy-workshop-scope.ts';
import{withoutD172Document}from'./legacy-high-gear-scope.ts';
import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';
import spec from'../../plan/generators/hi-class-v2.json';import bindings from'../../scripts/modern-icon-bindings.json';
const frozen=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-143/before-content.json.gz',import.meta.url))).toString());
const all=Object.values(frozen.documents).filter((d:any)=>d.hi_class_skills)as any[];
/** Restore only explicitly authorized D169 fields for historical guards. New tests
 * independently assert literal mechanics, costs and all other source documents. */
export function withoutD169Hi<T>(value:T):T{
 const copy=withoutHierarchySkillTree(value);
 function visit(n:any){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(visit);return;}
  const patch=spec.updates[n.id as keyof typeof spec.updates];if(patch&&n.level_parameters){const aw=n.tags.includes('awakened'),d=all.find(d=>d.hi_class_skills.some((s:any)=>s.id===n.id)),old=aw?d.awakened_variants[n.id]:d.hi_class_skills.find((s:any)=>s.id===n.id);for(const k of Object.keys(aw?patch.awakened:patch.base)){if(k in old)n[k]=structuredClone(old[k]);else delete n[k];}}
  Object.values(n).forEach(visit);
 }visit(copy);return copy;
}
export function withoutD169Document<T>(key:string,value:T):T{
 const copy=withoutD169Hi(withoutD172Document(key,value))as any,old=frozen.documents[key];
 if(key==='status-effects.json')copy.statuses=copy.statuses.filter((s:any)=>!spec.statuses.some(t=>t.id===s.id));
 if(key==='strings.th.json')for(const id of Object.keys(spec.names))copy.strings[id]=old.strings[id];
 if(key.startsWith('presentations/'))for(const row of[...copy.presentations,...copy.hi_class_presentations])if(bindings.v2_entries.some(b=>'visual_'+b.target===row.id)){const before=[...old.presentations,...old.hi_class_presentations].find(p=>p.id===row.id);for(const k of['icon_asset_id','icon_meta_path'])row[k]=before[k];row.provenance.icon_basis=before.provenance.icon_basis;if(row.id==='visual_professor_soul_change'){row.visual=structuredClone(before.visual);row.provenance.vfx_basis=before.provenance.vfx_basis;}}
 if(key==='effect-primitives.json'){copy.effects=copy.effects.filter((e:any)=>e.id!=='sacrifice_damage');delete copy.special_contracts_d169;}
 return copy;
}
