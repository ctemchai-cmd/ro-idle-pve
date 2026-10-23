"""Readable TASK131 results, preserving measurement and release hashes separately."""
import gzip,json,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[2];O=R/'plan/evidence/task-131';W=R/'.local/balance/task-131'
result=json.loads((W/'results.json').read_text());equivalence=json.loads((O/'content-equivalence.json').read_text())
fixed=[json.loads(p.read_text()) for p in sorted(O.glob('fixed-*.json'))]
assert len(fixed)==5 and all(x['fights']==832 for x in fixed)
assert equivalence['passed'] and equivalence['inputs']==2448
(O/'results.json.gz').write_bytes(gzip.compress((W/'results.json').read_bytes()))
(O/'samples.json.gz').write_bytes(gzip.compress((W/'samples.json').read_bytes()))
(O/'summary.csv').write_bytes((W/'summary.csv').read_bytes())
with tarfile.open(O/'replays.tar.gz','w:gz')as archive:
 for p in sorted(W.glob('replay-*.json')):archive.add(p,arcname=p.name)
number=lambda x:f'{x:,.0f}'
lines=['# Boss focus และบาลานซ์ — 24 ต.ค.2026','',
 f"วัดจริง {result['battles']:,} ไฟต์คัด/ตรวจบิลด์ใหม่ + {sum(x['fights'] for x in fixed):,} ไฟต์ fixed before/after + 8 ไฟต์ตรวจ equivalence = **{result['battles']+sum(x['fights']for x in fixed)+8:,} ไฟต์**. ไม่รวม trial ก่อน final และ unit tests.",
 '', '[CSV ทุกอาชีพ/เงื่อนไข](summary.csv) · [JSON คัดบิลด์ใหม่](results.json.gz) · [ตัวอย่าง replay ทุกกลุ่ม](replays.tar.gz)', '',
 '## สิ่งที่ปรับ','',
 '- 20 ท่าโจมตีหมู่: +35% ใน skill damage bucket เมื่อมีศัตรู living/targetable ตัวเดียวตอน resolve; หลายเป้ายังตีหมู่เดิม ไม่คูณจำนวน hit ซ้ำ',
 '- Storm Gust/พิษ/พื้นที่ต่อเนื่องจำเงื่อนไขใน application snapshot; normal/heal/CC/ราคา/SP/CT/ACD/การขัดไม่เพิ่มตามโบนัสนี้',
 '- Mage Bolts/Soul Strike ×1.8; Wizard damage และ Napalm ×1.7; Psychic Bolt ×1.9 / Voice Breaker ×1.65 / Auto Bolt ×1.5; Alchemist Acid/Demonstration ×1.65; Creator Acid Demonstration ×1.7',
 '- Hell Plant เฉพาะ damage ×1.75 และ Healing Plant เฉพาะ damage ×1.6; heal/lifetime/limit เดิม; Plagiarism Fire Bolt ตาม source ×1.8',
 '- ตัวเลขเป็น baseline ที่ผู้ช่วยปรับตามผล audit ไม่ใช่สูตรจาก RO. บิลด์/ของ/ทุน/IDs เดิมไม่ล้าง',
 '', '## Fixed A/B — บิลด์เดิม 16 seeds เดิม','',
 'Six Common gear matching tier / same points and actual skill costs / no cards, refine, enchant, options or scrolls / neutral boss90s. แสดง personal DPS; support/tank ไม่ใช้ตัวเลขนี้ตัดสินทั้งหมด.', '']
for phase in ['class2-70-gear60','high-90-awaken10']:
 doc=next(x for x in fixed if x['phase']==phase);lines+=['### '+phase,'','| อาชีพ | ก่อน | หลัง | เปลี่ยน | สกิล DPS หลัง |','| --- | ---: | ---: | ---: | ---: |']
 for row in sorted((r for r in doc['rows']if r['encounter']=='dummy'),key=lambda r:r['after']['dps'],reverse=True):
  lines.append(f"| {row['job']} | {number(row['before']['dps'])} | {number(row['after']['dps'])} | {row['percent_dps']:+.1f}% | {number(row['after']['skill_dps'])} |")
 lines+=['',f'[ผลราย seed / รายสกิล / ทีม / ต้นทุน](fixed-{phase}.json)','']
lines+=['## คัดบิลด์ใหม่','',
 '1,224 fixtures / 2,448 screen groups / 258 heldout groups. 3 screening seeds12901–12903 และ16 heldout22901–22916. เลือกด้วย personal DPS สำหรับ dummy และ team DPS สำหรับ pressure. ไม่ค้นทุก permutation และไม่อ้าง optimum. ตารางนี้เป็นผลคัดใหม่ แยกจาก fixed A/B ข้างบน.', '']
for phase in sorted({r['condition']for r in result['confirmed']}):
 lines+=['### '+phase,'','| อาชีพ | DPS รวม | สกิล DPS | ช่วง95%จาก RNG | ทีม DPS ใน pressure |','| --- | ---: | ---: | --- | ---: |']
 for row in sorted((r for r in result['confirmed']if r['condition']==phase and r['encounter']=='dummy'),key=lambda r:r['summary']['mean']['dps'],reverse=True):
  m=row['summary']['mean'];team=next(r for r in result['confirmed']if r['condition']==phase and r['encounter']=='pressure'and r['build']['job']==row['build']['job'])['summary']['mean']['team_dps'];ci=row['summary']['dps_ci95']
  lines.append(f"| {row['build']['job']} | {number(m['dps'])} | {number(m['skill_dps'])} | {number(ci[0])}–{number(ci[1])} | {number(team)} |")
 lines+=['']
lines+=['## ข้อสรุปและขอบเขต','',
 'Wizard/High Wizard, Sage/Professor และ Alchemist/Creator เข้าใกล้กลุ่มกายภาพมากขึ้น โดยไม่ลดอาชีพเดิม. Assassin Cross ยังมี personal DPS นำในเงื่อนไขนี้; Whitesmith ยังมีค่าจาก team buffs. Paladin/Priest/Clown/Gypsy ต้องดูความอยู่รอด/ฮีล/โล่/ผลต่อทีมเพิ่มด้วย ไม่พยายามทำ DPS ให้เท่ากันทุกบทบาท.',
 '', 'ยังไม่ใช่การปิดบาลานซ์ทั้งเกม: neutral boss90s/ทีมตัวอย่างเดียว ไม่มี all-element/card/refine/rarity sweeps. Growth20/40 มีช่องยังล็อกเป็น null ตามกฎ; งบแต้ม/เพดานสกิลเท่ากัน แต่ค่าเรียนแต่ละอาชีพต่างกันและบันทึกไว้ ไม่อ้างงบทอง/เวลาฟาร์มเท่ากัน. CIs วัด RNG ไม่รวมความไม่แน่นอนจากการเลือกบิลด์. บิลด์ High/Awaken ทดสอบ passive base และเฉพาะสี่ Active Awaken ไม่รวม all-passive Awaken. TASK041 ยังเปิด.',
 '', '## Content และทำซ้ำ','',
 f"ก่อนปรับ: `{fixed[0]['before_hash']}` / คัดบิลด์และ fixed60/High วัดที่ `{equivalence['measured_hash']}` / รุ่นปล่อย `{equivalence['released_hash']}`.",
 '', 'หลังวัดมี sync Fire Bolt copy สอง power arrays. ไม่มี candidate ในชุดนี้ใช้ท่าคัดลอกนั้น; [equivalence proof](content-equivalence.json) ตรวจ schemas/implementation เดียวกัน, ทุก document อื่นเท่ากัน, **compiled battle inputs2,448ชุดเท่ากันทุก field** และ actual replay4กลุ่มเหมือนกันยกเว้น content_hash. นี่เป็นหลักฐานความเท่ากัน ไม่ใช่การอ้างว่ารัน seed batch ทั้งหมดซ้ำบน hash ใหม่. Fixed gear1/20/40 วัด final hash โดยตรง. source-copy ทุกเลเวลมี runtime regression แยก.',
 '', '```sh',
 'node --import tsx scripts/game/class-audit.ts run --workers 4 --worker 0 --out .local/balance/task-131-reproduce --content plan/evidence/task-131/content-measured.json.gz',
 '# ทำ worker1/2/3 ด้วย แล้ว merge ด้วย content/out เดียวกัน',
 'node --import tsx scripts/game/boss-focus-audit.ts class2-70-gear60',
 'node --import tsx scripts/game/boss-focus-audit.ts high-90-awaken10',
 '```', '']
(O/'README.md').write_text('\n'.join(lines))
print(json.dumps({'rescreen_fights':result['battles'],'fixed_fights':sum(x['fights']for x in fixed),'conditions':len({r['condition']for r in result['confirmed']}),'heldout_groups':len(result['confirmed'])}))
