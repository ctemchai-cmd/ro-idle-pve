#!/usr/bin/env python3
# Win-band summary of a `balance.ts calibrate` report (uses the two-team `mean` column the calibrator steers by).
# Usage: python3 scripts/game/calibration_summary.py .local/balance/cal-final.txt
# Summarize a calibrate report: win-band hits by stage type (regular 0.7-0.9, finals 0.55-0.8; heavy must need interrupts).
import json,re,sys
stages=json.load(open('plan/data/stages.json'))['stages']; last={}
for s in stages: last[s['chapter']]=max(last.get(s['chapter'],0), s['index'])
rows=[]
for line in open(sys.argv[1]):
  if not re.match(r'^\d-\d+\t', line): continue
  f=line.rstrip('\n').split('\t'); sid=f[0]; ch,ix=map(int,sid.split('-')); win=float(f[4].split()[1]); bare=None  # 'mean' = both snapshot teams, what the calibrator steers by
  for x in f:
    if x.startswith('bare'): bare=float(x.split()[1])
  final=ix==last[ch]; heavy=ix in (5,10,15); rows.append((sid,final,heavy,win,bare))
band=lambda final,w: (0.55<=w<=0.8) if final else (0.7<=w<=0.9)
reg=[r for r in rows if not r[1] and not r[2]]; fin=[r for r in rows if r[1]]; hv=[r for r in rows if r[2]]
out=lambda rs: f"{sum(band(r[1],r[3]) for r in rs)}/{len(rs)} mean {sum(r[3] for r in rs)/max(1,len(rs)):.2f}"
need=sum(1 for r in hv if r[4] is not None and r[4] < 0.3 and r[3] >= 0.55)
print(f"regular {out(reg)} | finals {out(fin)} | heavy {out(hv)} interrupt-needed {need}/{len(hv)}")
