"""Import exact modern skill/resource choices; never guess by filename."""
import argparse
import json
from pathlib import Path
import re
import import_ro_assets as importer
ROOT=Path(__file__).resolve().parents[1]
SUGGESTIONS=ROOT/'assets/modern/suggestion-migrate.txt'
BINDINGS=Path(__file__).with_name('modern-icon-bindings.json')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
 mapping=json.loads(BINDINGS.read_text());actual=[]
 for line in SUGGESTIONS.read_text().splitlines():
  if not line.startswith('- '):continue
  match=re.match(r'^- (.+?)\s(?:-|=)\s(assets/modern/\S+\.webp)(.*)$',line)
  if not match:raise ValueError('Unknown suggestion: '+line)
  actual.append((match[1],match[2],match[3].strip()))
 if actual!=[(r['name'],r['path'],r['note'])for r in mapping['entries']]:raise ValueError('Suggestion changed: explicitly reconcile modern-icon-bindings.json first')
 manifest=json.loads(importer.MANIFEST.read_text());manifest['providers']['local_modern']={'kind':'local','base_url':'local:///','documentation_url':'assets/modern/suggestion-migrate.txt'}
 docs={p:json.loads(p.read_text())for p in(ROOT/'plan/data/presentations').glob('*.json')}
 visuals={r['id']:r for doc in docs.values()for r in doc['presentations']}
 rows={s['id']:visuals[s['presentation_id']]for p in(ROOT/'plan/data/skills').glob('*.json')for s in json.loads(p.read_text())['skills']}
 shell_path=ROOT/'src/renderer/shell-visuals.json';shell=json.loads(shell_path.read_text());selected=[];refs={}
 for r in mapping['entries']:
  target=r['target'];category='skills'if r['kind']=='skill'else'ui'
  if r['kind']=='skill'and target not in rows:raise ValueError('Unknown logical skill: '+target)
  selected.append({'slug':'modern-'+target,'name':r['name']+' modern icon','game_id':target,'game_name':'User-provided RO Idle presentation','game_tag':'user_provided_modern','category':category,'kind':'skill_icon'if r['kind']=='skill'else'resource_icon','extension':'webp','provider':'local_modern','tags':['modern','user_selected',target],'source_path':r['path'],'image_path':r['path'],'page_url':'assets/modern/suggestion-migrate.txt'})
  refs[target]={'asset_id':category+'.modern-'+target,'meta_path':category+'/modern-'+target+'.meta.json'}
 manifest['icons']=[v for v in manifest['icons']if v.get('provider')!='local_modern']+selected
 if args.check:
  if json.loads(importer.MANIFEST.read_text())!=manifest:raise ValueError('Modern manifest selection changed')
 else:importer.MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 entries=importer.entries_from_manifest(manifest)
 for entry in entries:
  if entry['source']['provider']!='local_modern':continue
  if args.check:importer.read_cached(entry)
  else:
   try:meta=importer.read_cached(entry)
   except(OSError,ValueError):meta,_=importer.import_one(entry,refresh=True)
   meta['annotations']['selection']='Explicit user suggestion-migrate.txt mapping,23October2026; user-provided art, not independently verified native RO'
   if entry['category']=='skills':meta['annotations']['logical_skill_id']=entry['game_id']
   importer.write_json(importer.sidecar_path(importer.ASSET_ROOT/entry['path']),meta)
 def bind(skill,source):
  ref=refs[source];expected={'icon_asset_id':ref['asset_id'],'icon_meta_path':'assets/ro/'+ref['meta_path']}
  if args.check:
   if any(rows[skill][k]!=v for k,v in expected.items()):raise ValueError('Presentation mapping mismatch: '+skill)
  else:
   rows[skill].update(expected);rows[skill]['provenance']['icon_basis']='User-selected modern art in suggestion-migrate.txt'+('; shares '+source if skill!=source else'')+'; VFX/audio configured separately'
 for r in mapping['entries']:
  if r['kind']=='skill':bind(r['target'],r['target'])
  else:
   group='resource_icons'if r['kind']=='resource'else'feature_icons';ref={**refs[r['target']],'selection_basis':'Explicit user-selected '+r['path']}
   if args.check:
    if shell[group][r['target']]!=ref:raise ValueError('Shell mapping mismatch: '+r['target'])
   else:shell[group][r['target']]=ref
 for skill,source in mapping['inherited_skills'].items():
  if rows[skill] is not rows[source]:bind(skill,source)
 if not args.check:
  for path,doc in docs.items():importer.write_json(path,doc)
  importer.write_json(shell_path,shell);importer.write_catalog(entries)
 print(json.dumps({'passed':True,'explicit_icons':len(selected),'skill_bindings':sum(r['kind']=='skill'for r in mapping['entries'])+len(mapping['inherited_skills']),'scope':'Exact choices, source bytes/stableIDs/manualreview preserved'}))
if __name__=='__main__':main()
