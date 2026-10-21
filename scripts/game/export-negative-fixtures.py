"""Retain the reviewed M0 mutations as inputs for the independent TS validator."""
import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'plan/checks'))
import composition as c
rows=[]
for case in c.CASES['negative_cases']:
 if case['mutation']=='non_finite_number':continue # JSON cannot encode NaN; injected by TS test instead.
 captured={}
 def definition(kind,value,*_):captured.update(kind=kind,definition=value)
 def patches(base,patches):captured.update(kind='patches',definition=base,patches=patches)
 original_validate,original_patched=c.validate,c.patched
 c.validate,c.patched=definition,patches
 try:c.negative(case)
 finally:c.validate,c.patched=original_validate,original_patched
 rows.append({**case,**captured})
(root/'tests/game/fixtures/composition-invalid.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
print({'invalid_inputs':len(rows)})
