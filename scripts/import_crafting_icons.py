"""Two reviewed user-library stone illustrations; deterministic 32px UI renditions.
Original source files stay intact. No claim of original Ragnarok item semantics.
"""
from pathlib import Path
from io import BytesIO
import hashlib,json,copy,argparse
from PIL import Image
import import_ro_assets as imp
ROOT=Path(__file__).resolve().parents[1]
CHOICES={'option_stone':9,'rarity_stone':13}
def main():
 check=argparse.ArgumentParser();check.add_argument('--check',action='store_true');args=check.parse_args()
 shell_path=ROOT/'src/renderer/shell-visuals.json';shell=json.loads(shell_path.read_text())
 for key,n in CHOICES.items():
  source=f'assets/modern/resource/craft-resources/{n}.webp';original=(ROOT/source).read_bytes();im=Image.open(BytesIO(original)).convert('RGBA');im.thumbnail((32,32),Image.Resampling.LANCZOS);out=BytesIO();im.save(out,format='WEBP',lossless=True,method=6);payload=out.getvalue()
  path=f'ui/crafting-{key}.webp';meta_path=path.replace('.webp','.meta.json');digest=lambda b:hashlib.sha256(b).hexdigest()
  facts=imp.inspect_image(payload,None)
  meta={'schema_version':1,'status':'downloaded','id':'ui.crafting-'+key,'name':key,'category':'ui','kind':'resource_icon','source':{'provider':'local_modern','page_url':'plan/design/77-equipment-crafting.md','local_path':source,'input_sha256':digest(original)},'file':{'path':path,'bytes':len(payload),'sha256':digest(payload),**facts},'animation':{'recommended_loop':False,'anchor':None},'visual_review':{'status':'reviewed_static','notes':['Selected from viewed task164 contact sheet;32px UI rendition, not a claim of original RO item identity.']},'annotations':{'derivation':'fit32/LANCZOS/WebP lossless method6; source intact'}}
  # inspect_image's fact keys follow the existing importer convention.
  expected={'asset_id':meta['id'],'meta_path':meta_path,'selection_basis':'Reviewed user-library stone illustration: '+source}
  if args.check:
   assert (imp.ASSET_ROOT/path).read_bytes()==payload
   assert json.loads((imp.ASSET_ROOT/meta_path).read_text())==meta
   assert shell['resource_icons'][key]==expected
  else:
   (imp.ASSET_ROOT/path).write_bytes(payload);(imp.ASSET_ROOT/meta_path).write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');shell['resource_icons'][key]=expected
 if not args.check:shell_path.write_text(json.dumps(shell,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'passed':True,'icons':2,'rendition_max':32,'source_modified':False}))
if __name__=='__main__':main()
