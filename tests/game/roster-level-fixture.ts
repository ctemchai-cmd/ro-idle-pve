import type{AccountState}from'../../src/contracts/index.ts';import type{ValidatedContent}from'../../src/content/model.ts';import{progressionData}from'../../src/domain/progression/characters.ts';
/** Server-owned supporting roster for tests of a focal actor. Never used by the product. */
export function seedSupportingRoster(state:AccountState,content:ValidatedContent,except='main',level=80){const data=progressionData(content);for(const a of state.roster.filter(a=>a.character_id!==except).slice(0,3)){
 const old=data.progression.level_rows.find(r=>r.level===a.level)!.total_status_points;a.level=Math.min(data.release.level_cap,Math.max(level,a.level));
 if(a.level>70)a.job_id=content.jobs.order.find(id=>content.jobs.byId[id]!.stage===3&&content.jobs.byId[id]!.root===a.root_job_id&&content.jobs.byId[id]!.ancestors.includes(a.job_id))! as typeof a.job_id;
 a.completed_gate_ids=[20,40,60,80].filter(g=>g<=a.level)as typeof a.completed_gate_ids;a.local_cap=Math.min(100,20+20*a.completed_gate_ids.length)as typeof a.local_cap;a.unspent_status_points+=data.progression.level_rows.find(r=>r.level===a.level)!.total_status_points-old;
}return state;}
