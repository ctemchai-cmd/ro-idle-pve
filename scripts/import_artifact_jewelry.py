"""Import explicit user-supplied jewelry; retain original source bytes."""
import json
from pathlib import Path
import import_ro_assets as importer
ROOT=Path(__file__).resolve().parents[1]
def main():
 config=json.loads((ROOT/'plan/generators/artifact-randomization.json').read_text());manifest=json.loads(importer.MANIFEST.read_text())
 manifest['providers']['local_artifact']={'kind':'local','base_url':'local:///','documentation_url':'plan/generators/artifact-randomization.json'}
 icons=[];refs={}
 for job,p in config['profiles'].items():
  slug='artifact-'+job;icons.append({'slug':slug,'name':p['name'],'game_id':job,'game_name':'User-provided jewelry','game_tag':'user_provided_modern','category':'items','kind':'item_icon','extension':'webp','provider':'local_artifact','tags':['artifact','jewelry',job],'source_path':p['source_path'],'image_path':p['source_path'],'page_url':'plan/generators/artifact-randomization.json'})
  refs[job]={'asset_id':'items.'+slug,'meta_path':'items/'+slug+'.meta.json','source_name':p['source_path']}
 manifest['icons']=[i for i in manifest['icons'] if i.get('provider')!='local_artifact']+icons;importer.write_json(importer.MANIFEST,manifest)
 entries=importer.entries_from_manifest(manifest)
 for entry in entries:
  if entry['source']['provider']!='local_artifact':continue
  try:meta=importer.read_cached(entry)
  except(OSError,ValueError):meta,_=importer.import_one(entry,refresh=True)
  meta['annotations']['selection']='Exact user-provided jewelry, selected per class; no claim of original-client mapping'
  importer.write_json(importer.sidecar_path(importer.ASSET_ROOT/entry['path']),meta)
 importer.write_catalog(entries)
 path=ROOT/'src/renderer/shell-visuals.json';shell=json.loads(path.read_text());shell['artifact_icons']=refs
 shell['resource_icons']['artifact_reroll']=dict(shell['resource_icons']['option_stone'])
 path.write_text(json.dumps(shell,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'jewelry_icons':len(refs)}))
if __name__=='__main__':main()
