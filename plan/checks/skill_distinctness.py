"""D168 full catalog audit; no game simulation, private save, or external data."""
import json,gzip,collections
from pathlib import Path
R=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text())
before=json.loads(gzip.decompress((R/'plan/evidence/task-142/before-content.json.gz').read_bytes()))['documents']
after={'skills/'+p.name:read(p) for p in (R/'plan/data/skills').glob('*.json')}
spec=read(R/'plan/generators/skill-distinctness.json');reports=[]
for phase in ['base','awakened']:
 for name,docs in [('before',before),('after',after)]:
  groups=collections.defaultdict(list);rows=[]
  for path,d in docs.items():
   if not path.startswith('skills/'):continue
   for s in d['skills']+d['hi_class_skills']if phase=='base'else d['awakened_variants'].values():
    core={k:v for k,v in s.items()if k not in ['id','name_key','class_id','presentation_id','tags','unlock_level','rank_unlock_levels']}
    groups[json.dumps(core,sort_keys=True)].append(s['id']);rows.append({'id':s['id'],'job':s['class_id'],'kind':s['kind'],'role':spec['updates'].get(s['id'],{}).get('role','existing distinct program; unchanged'),'targets':[e['target']for e in s.get('effects',[])]})
  exact=[v for v in groups.values()if len(v)>1];assert len(rows)==152
  if name=='after':assert not exact,exact
  reports.append({'phase':phase,'version':name,'count':len(rows),'exact_duplicate_groups':exact,'catalog':rows})
clusters=[['acolyte_blessing','priest_impositio','merchant_loud_voice','knight_battle_cry'],['acolyte_increase_agi','blacksmith_adrenaline'],['hunter_ankle_snare','rogue_intimidate'],['bard_encore','dancer_encore'],['dancer_dissonance','crusader_defender'],['swordsman_endure','crusader_auto_guard'],['knight_twohand_quicken','thief_quick_step']]
out={'scope':'152 unique logical IDs × base/Awaken; shared inherited skill is one ID, not a duplicate. Exact signature excludes identity/cosmetic/unlock fields but retains coefficients/costs/targets/program. No global role/DPS equality claim. Common damage primitives intentionally shared; differing elements/multihits/statuses/resources are preserved. Rogue copied spells keep source effects but higher SP and own saved ID.','reports':reports,'utility_clusters_reviewed':clusters,'changed_ids':list(spec['updates']),'status_ids':[s['id']for s in spec['statuses']],'passed':True}
(R/'plan/evidence/task-142/catalog-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':True,'catalogs':4,'after_exact_duplicate_groups':0,'changed':len(spec['updates'])}))
