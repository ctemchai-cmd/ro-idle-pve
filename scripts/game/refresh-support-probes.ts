/** Causal role checks: matched with/without skill use, no second healer hiding contribution. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';import{gunzipSync}from'node:zlib';
import{validateContent}from'../../src/content/loader.ts';import{loadValidatedContent}from'../../src/content/index.ts';
import{auditBuilds,auditFixture,auditInput,auditFight,type AuditBuild,type AuditCase}from'./class-audit-fixtures.ts';
const args=process.argv.slice(2),get=(k:string,d:string)=>args.includes(k)?args[args.indexOf(k)+1]!:d;
const path=get('--content',''),loaded=path?validateContent(JSON.parse(gunzipSync(await readFile(path)).toString())):loadValidatedContent();if(!loaded.ok)throw Error(JSON.stringify(loaded.errors));const c=loaded.value,out=get('--out','.local/balance/task-192/roles-after');await mkdir(out,{recursive:true});
const rows:unknown[]=[],seeds=[519201,519202,519203];let fights=0;
const jobs:Record<string,{slots:string[];profile:string}>={
 priest:{profile:'spell_speed',slots:['priest_sanctuary','priest_resurrection','priest_impositio','acolyte_blessing']},
 bard:{profile:'power',slots:['bard_healing_song','bard_battle_song','bard_performance_strike','bard_dissonance']},
 dancer:{profile:'power',slots:['dancer_healing_song','dancer_battle_song','dancer_dissonance','dancer_performance_strike']},
 sage:{profile:'speed',slots:['sage_spell_breaker','sage_magic_barrier','sage_psychic_bolt','mage_cold_bolt']},
 crusader:{profile:'tank',slots:['swordsman_provoke','crusader_auto_guard','crusader_devotion','crusader_grand_cross']},
 high_priest:{profile:'spell_speed',slots:['high_priest_basilica','priest_impositio','priest_sanctuary','high_priest_assumptio']},
 clown:{profile:'power',slots:['clown_marionette_control','bard_healing_song','bard_battle_song','clown_arrow_vulcan']},
 gypsy:{profile:'power',slots:['gypsy_moonlit_water_mill','dancer_healing_song','dancer_battle_song','gypsy_tarot_card_of_fate']},
 professor:{profile:'speed',slots:['sage_spell_breaker','professor_double_casting','professor_soul_change','mage_cold_bolt']},
 paladin:{profile:'tank',slots:['swordsman_provoke','crusader_auto_guard','paladin_gospel','paladin_shield_chain']},
 creator:{profile:'magic',slots:['creator_full_chemical_protection','alchemist_potion_pitcher','creator_acid_demonstration','alchemist_hell_plant']},
 champion:{profile:'critical',slots:['monk_call_spirits','champion_chain_crush_combo','champion_palm_strike','acolyte_blessing']}
};
for(const[job,spec]of Object.entries(jobs)){
 const stage=c.jobs.byId[job]!.stage as 2|3,condition:AuditCase={id:`role-${job}`,level:stage===3?100:70,tier:stage===3?100:60,stage,awaken:stage===3?10:0},build:AuditBuild={...auditBuilds(c,stage).find(b=>b.job===job)!,...spec},fixture=auditFixture(build,condition,c);
 for(const pressure of[3,6])for(const enabled of[false,true])for(const seed of seeds){
  const input=auditInput(fixture,'pressure',c);input.actors=input.actors.filter(a=>['main','npc_swordsman','audit_boss'].includes(a.actor_id));
  for(const a of input.actors)if(a.team==='player')a.stat_blueprint.derived_offsets.max_hp+=15000;else{a.stat_blueprint.derived_offsets.physical_attack*=pressure;a.stat_blueprint.derived_offsets.magical_attack*=pressure;}
  if(!enabled)input.actors.find(a=>a.actor_id==='main')!.active_slots=[null,null,null,null];
  const result=auditFight(input,seed,c);fights++;rows.push({job,pressure,enabled,seed,build,sample:result.sample,boss_casts:result.final.metrics.actors.audit_boss!.casts_resolved,boss_spent:result.final.metrics.actors.audit_boss!.sp_spent,ally_hp:result.final.actors.filter(a=>a.team==='player').map(a=>({id:a.actor_id,hp:a.hp,max:a.stats.max_hp}))});
 }
 console.log(job);
}
const report={content_hash:c.manifest.content_hash,fights,seeds,method:'Two-person party: main and identical Knight/LordKnight companion. No second healer. Matched skill-enabled vs all4empty slots; passives/equipment/stat allocation/normals unchanged. Two boss damage levels; player+15000HP lets support windows act.90s denominator includes deaths. This is causal contribution in selected builds, not role ranking.',rows};await writeFile(`${out}/results.json`,JSON.stringify(report));console.log(JSON.stringify({fights}));
