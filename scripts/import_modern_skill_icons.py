"""Import only the user's explicit skill-icon suggestions; preserve source files and exact bytes."""
import argparse
import json
from pathlib import Path
import re
import import_ro_assets as importer
ROOT=Path(__file__).resolve().parents[1]
SUGGESTIONS=ROOT/'assets/modern/suggestion-migrate.txt'
BINDINGS={'Heal':'acolyte_heal','Blessing':'acolyte_blessing','Holy Light':'acolyte_holy_light','Increase Agi':'acolyte_increase_agi','Call Spirit':'monk_call_spirits','Triple Attack':'monk_triple_attack','Finger Off':'monk_finger_offensive','Asura':'monk_asura','Steel Body':'monk_steel_body','Meditation':'acolyte_meditation','Iron Fist':'monk_iron_fist','Spirit Combo':'monk_spirit_combo'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
 mappings={}
 for line in SUGGESTIONS.read_text().splitlines():
  if not line.strip().startswith('- '):continue
  match=re.fullmatch(r'- (.+?) - (assets/modern/.+\.webp)',line.strip())
  if not match or match[1] not in BINDINGS:raise ValueError('Unknown suggestion: '+line)
  skill=BINDINGS[match[1]]
  if skill in mappings:raise ValueError('Duplicate suggestion: '+skill)
  mappings[skill]=(match[1],match[2])
 manifest=json.loads(importer.MANIFEST.read_text());manifest['providers']['local_modern']={'kind':'local','base_url':'local:///','documentation_url':'assets/modern/suggestion-migrate.txt'}
 active={v['id'] for v in json.loads((ROOT/'plan/data/skills/acolyte.json').read_text())['skills']}
 selected=[]
 for skill,(name,source)in mappings.items():
  if skill not in active:raise ValueError('Unknown logical skill: '+skill)
  selected.append({'slug':'modern-'+skill,'name':name+' modern icon','game_id':skill,'game_name':'User-provided RO Idle presentation','game_tag':'user_provided_modern','category':'skills','kind':'skill_icon','extension':'webp','provider':'local_modern','tags':['modern','user_selected',skill],'source_path':source,'image_path':source,'page_url':'assets/modern/suggestion-migrate.txt'})
 others=[v for v in manifest['icons']if v.get('provider')!='local_modern'];manifest['icons']=others+selected
 if args.check:
  if json.loads(importer.MANIFEST.read_text())!=manifest:raise ValueError('Modern manifest selection changed')
 else:importer.MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 entries=importer.entries_from_manifest(manifest)
 presentation=ROOT/'plan/data/presentations/acolyte.json';doc=json.loads(presentation.read_text())
 for entry in entries:
  if entry['source']['provider']!='local_modern':continue
  skill=entry['game_id'];row=next(v for v in doc['presentations']if v['id']=='visual_'+skill)
  if args.check:meta=importer.read_cached(entry)
  else:
   try:meta=importer.read_cached(entry)
   except (OSError,ValueError):meta,_=importer.import_one(entry,refresh=True)
   meta['annotations']['logical_skill_id']=skill
   meta['annotations']['selection']='Explicit user suggestion-migrate.txt mapping, 23October2026; not an independently verified original RO asset'
   # Keep importer review state: a new/changed payload requires a separate human visual review.
   importer.write_json(importer.sidecar_path(importer.ASSET_ROOT/entry['path']),meta)
  expected={'icon_asset_id':entry['id'],'icon_meta_path':'assets/ro/'+entry['path'].replace('.webp','.meta.json')}
  if args.check:
   for k,v in expected.items():
    if row[k]!=v:raise ValueError('Presentation mapping mismatch: '+skill)
  else:
   row.update(expected);row['provenance']['icon_basis']='User explicitly selected '+entry['local_source']+' in assets/modern/suggestion-migrate.txt; modern static icon only, original VFX/audio references retained'
 if not args.check:
  importer.write_json(presentation,doc);importer.write_catalog(entries)
 print(json.dumps({'passed':True,'selected_icons':len(selected),'scope':'Only explicit user skill-icon mappings; no class icons, Upgrade, combat formulas, audio or VFX changes'}))
if __name__=='__main__':main()
