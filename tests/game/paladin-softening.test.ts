import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {content} from './combat-fixtures.ts';
import {storyStages} from '../../src/domain/modes/story.ts';
import {towerRow} from '../../src/domain/modes/tower.ts';
import {legacyClass2Source} from './legacy-class2-source.ts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const stable=(v:unknown):unknown=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable((v as Record<string,unknown>)[k])])):v;
const sha=(v:unknown)=>hash(Buffer.from(JSON.stringify(stable(v))));
const before=read('plan/evidence/task-110-before.json');
test('D142 all7Paladin mappings are exact source bytes in exported metadata andruntimepack, with original skill programs',()=>{
 const pack=read('runtime/ro/manifest.json');const mapping=read('scripts/modern-icon-bindings.json').entries;
 const choices={crusader_holy_cross:27,crusader_auto_guard:29,crusader_devotion:48,crusader_grand_cross:12,crusader_defender:19,crusader_faith:33,crusader_reflect:34};
 for(const[id,n]of Object.entries(choices)){
  const path=`assets/modern/skill/paladin/${n}.webp`,source=readFileSync(path),meta=read(`assets/ro/skills/modern-${id}.meta.json`);
  assert.equal(mapping.find((r:{target:string})=>r.target===id).path,path);assert.equal(meta.source.local_path,path);assert.equal(meta.file.sha256,hash(source));assert.deepEqual(readFileSync('assets/ro/'+meta.file.path),source);assert.equal(meta.visual_review.status,'reviewed_static');
  const presentation=pack.presentations[pack.skills[id].presentation_id],asset=Object.values(pack.assets).find((a:any)=>a.meta_path===presentation.icon_meta_path.replace('assets/ro/','')) as any,file=pack.files.find((f:{path:string})=>f.path===asset.media_path);assert.equal(file.sha256,hash(source));
 }
 for(const[p,digest]of Object.entries(before.all_player_skill_documents_sha256))assert.equal(sha(JSON.parse(legacyClass2Source(p).toString())),digest,p);
});
test('D142 original130StoryHP/physical/heavy power is no higher thanTASK109 andpreserves all encounter fields/rewards/control',()=>{
 const rows=storyStages(content).filter(s=>s.chapter<=8);
 for(const r of rows){const b=r.encounter[0]!.resolved_base,prior=before.stages[r.id];for(const key of ['max_hp','physical_attack','magical_attack']as const)assert.ok(b[key]<=prior[key],r.id+key);if(r.chapter<=2)assert.deepEqual(b,prior);}
 const stage=read('plan/data/stages.json');stage.stages=stage.stages.filter((s:{chapter:number})=>s.chapter<=8);stage.chapters=8;stage.total_stages=130;stage.stages_per_chapter_by_chapter=Object.fromEntries(Object.entries(stage.stages_per_chapter_by_chapter).filter(([chapter])=>Number(chapter)<=8));for(const r of stage.stages)for(const a of r.encounter)for(const key of ['max_hp','physical_attack','magical_attack'])delete a.resolved_base[key];assert.equal(sha(stage),before.stage_other_sha256);
 assert.equal(sha(read('plan/data/slot-progress.json')),before.slot_progress_sha256);
});
test('D142 Tower lowers attack about12%, preserves every other field andcontinues afterfloor100',()=>{
 for(const r of Object.values(content.documents['tower.json']!.floor_rows as unknown as {floor:number;attack:number}[])){assert.equal(r.attack,Math.ceil((220+44*r.floor+11*r.floor*r.floor)/20));assert.ok(r.attack<before.tower_attack[r.floor]);}
 assert.equal(towerRow(21,content).attack,300);assert.equal(towerRow(101,content).attack,5844);
 const tower=read('plan/data/tower.json');delete tower.generator.attack;for(const r of tower.floor_rows)delete r.attack;assert.equal(sha(tower),before.tower_other_sha256);
});
