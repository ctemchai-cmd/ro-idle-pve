"""Standalone, offline report from TASK-129 measured JSON; never changes game content."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "plan/evidence/task-129"
result = json.loads((OUT / "results.json").read_text())
confirmed = result["confirmed"]
support = json.loads((OUT / 'support.json').read_text()) if (OUT / 'support.json').exists() else None


def rows(condition, encounter="dummy"):
    return sorted((r for r in confirmed if r["condition"] == condition and r["encounter"] == encounter), key=lambda r: r["summary"]["mean"]["dps"], reverse=True)


def number(value):
    return f"{value:,.0f}"


lines = [
    "# ผลวัดบาลานซ์อาชีพ — 24 ตุลาคม 2026",
    "",
    f"รันจริง **{result['battles']:,} ไฟต์ เพดาน 90 วินาทีจำลองต่อไฟต์** ผ่าน engine เดียวกับเกม ไม่เรียกโมเดลระหว่างคำนวณ ไม่ปรับข้อมูลเกมและไม่อ่านเซฟผู้ใช้",
    "",
    f"Content hash: `{result['content_hash']}`",
    "",
    "[เปิดรายงาน HTML แบบกรอง/เรียง/ดูสกิลได้](report.html) · [ตาราง CSV](summary.csv) · [JSON ทุกบิลด์](results.json)",
    "",
    "## เงื่อนไข",
    "",
    "- Class 2 Lv.70 เท่ากัน เปลี่ยนอุปกรณ์หกช่องเป็น Common Lv.1/20/40/60 ไม่มี Refine/Enchant/การ์ด/option/ใบธาตุ เพื่อแยกผลของอุปกรณ์",
    "- เพิ่ม Class 1 Lv.1/10 และ Class 2 Lv.20/40 ตามเพดานเรียนจริง; ช่องที่ยังไม่ปลดเป็นช่องว่างและยังรอ SI ตามเดิม",
    "- Hi-class Lv.90 ของ Lv.60 สามแบบ: ไม่ Awaken / สี่ Active Awaken rank1 / สี่ Active Awaken rank10; Passive และเพื่อนใช้ base rank เดิม",
    "- ทุกตัวใช้ point budget ของเลเวลจริงและจ่ายค่าเพิ่ม stat จริง ปรับสัดส่วน stat ได้ตามบิลด์ ไม่มี AGI/DEX ฟรีตามเลเวล",
    "- หลายชุดสกิลและ stat profile ต่ออาชีพ คัดด้วย 3 seeds แล้วตรวจผู้ชนะด้วยอีก 16 seeds ที่ไม่ซ้ำกัน เป็นบิลด์ที่ดีที่สุดในชุดที่ลอง ไม่ใช่ optimum ทุกบิลด์",
    "- เพดาน rank และอุปกรณ์เท่ากัน แต่ราคาสกิล/จำนวน Passive ต่างอาชีพอาจต่างกัน ดู actual costs ใน JSON; ไม่อ้างว่าใช้ทองหรือเวลาฟาร์มเท่ากัน",
    "- บอสหนึ่งตัวเป็นกลาง HP1,000,000,000 / DEF=MDEF=20+2×เลเวล / ATK=MATK=80+4×เลเวล / ASPD=CSPD100 เหมือนกันทุกอาชีพในเงื่อนไขเดียวกัน",
    "- Dummy: ตัวหลักคนเดียว บอสไม่โจมตี; Pressure: ตัวหลัก + Knight/Priest/Bard ชุดเดิม บอสตีปกติและใช้ Bite/Cataclysm/Doom/Firestorm; ที่ Lv.90 เพื่อนเลื่อน High สายเดิม แต่ใช้สกิลฐานชุดเดิม",
    "- DPS = ดาเมจที่หัก HP จริง ÷90s รวมพิษ ต้นไม้ proc และสกิลต่อเนื่อง; สกิล DPS = รวมทุกอย่างที่ไม่ใช่ normal attack ของ owner นั้น หาร90sแม้ตายหรือทีมแพ้ก่อนเวลา เพื่อไม่ให้บิลด์ที่ตายไวได้ DPS สูงเกินจริง",
    "- 95% CI เป็น normal approximation ของความสุ่ม RNG ไม่ครอบคลุมความไม่แน่นอนจากเลือกบิลด์/ด่าน; ไม่ถือว่าตัวเลขใกล้กันต่างอย่างมีนัยสำคัญอัตโนมัติ",
    "",
    "## Class 2 Lv.70 / ของ Lv.60 — ดาเมจส่วนตัว",
    "",
    "| อาชีพ | DPS รวม | ตีปกติ | สกิล | สกิล % | SP ขาด/ไฟต์ | 95% CI |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
]
for r in rows("class2-70-gear60"):
    m = r["summary"]["mean"]
    ci = r["summary"]["dps_ci95"]
    lines.append(f"| {r['build']['job']} | {number(m['dps'])} | {number(m['normal_dps'])} | {number(m['skill_dps'])} | {m['skill_dps']/max(1,m['dps'])*100:.0f}% | {m['sp_skips']:.1f} | {number(ci[0])}–{number(ci[1])} |")
lines += ["", "Priest/Bard/Dancer มีบทบาท heal/support จึงอ่าน DPS ต่ำเป็น ‘Under’ ทันทีไม่ได้ ดูผลทีมและ HPS แยกด้านล่าง", "", "## ผลของอุปกรณ์ — Class 2 Lv.70 เดิม", "", "| อาชีพ | ของ Lv.1 | Lv.20 | Lv.40 | Lv.60 |", "| --- | ---: | ---: | ---: | ---: |"]
for r in rows("class2-70-gear60"):
    job = r["build"]["job"]
    values = [next(x["summary"]["mean"]["dps"] for x in rows(f"class2-70-gear{t}") if x["build"]["job"] == job) for t in [1,20,40,60]]
    lines.append(f"| {job} | " + " | ".join(map(number, values)) + " |")
lines += ["", "แต่ละช่องเลือกผู้ชนะในชุดบิลด์ของ tier นั้น จึงเป็นการเทียบศักยภาพที่ลอง ไม่ใช่การเปลี่ยนของบนบิลด์เดิมทุกช่อง", "", "## Hi-class Lv.90 / ของ Lv.60", "", "| อาชีพ | ไม่ Awaken | Awaken 1 | Awaken 10 |", "| --- | ---: | ---: | ---: |"]
for r in rows("high-90-awaken10"):
    job = r["build"]["job"]
    values = [next(x["summary"]["mean"]["dps"] for x in rows(c) if x["build"]["job"] == job) for c in ["high-90-base","high-90-awaken1","high-90-awaken10"]]
    lines.append(f"| {job} | " + " | ".join(map(number,values)) + " |")
lines += ["", "ต้นทุน Awaken เท่ากัน 4 Active: rank1 เพิ่ม100,000gold+80awakening_shard; rank10 รวม532,000gold+1,160awakening_shard ไม่รวมทุน base แต่ละสกิล", "", "## ทีมมาตรฐาน — Class 2 Lv.70 / ของ Lv.60", "", "| ตัวหลัก | DPS ของตัวหลัก | DPS รวมทีม | HPS ของตัวหลัก | เพื่อนรอดเฉลี่ย/4 | ขัดบอส/ไฟต์ |", "| --- | ---: | ---: | ---: | ---: | ---: |"]
for r in sorted(rows("class2-70-gear60","pressure"),key=lambda x:x["summary"]["mean"]["team_dps"],reverse=True):
    m = r["summary"]["mean"]
    lines.append(f"| {r['build']['job']} | {number(m['dps'])} | {number(m['team_dps'])} | {number(m['hps'])} | {m['survivors']:.2f} | {m['boss_interrupted']:.1f} |")
lines += ["", "HPS นับ effective healing จริงเท่านั้น ไม่รวม overheal; core นี้มี healer อยู่แล้วจึงไม่ใช่การจัดทีมที่เหมาะที่สุดสำหรับ main healer ทุกตัว และ Team DPS ไม่ใช่ causal contribution ของ main แยกเดี่ยว"]
if support:
    lines += ['', '## ตรวจสายฮีลเพิ่ม — เพื่อน Knight/Assassin/Wizard ไม่มีฮีล', '', f"เพิ่ม {support['battles']:,} ไฟต์ด้วยบอสและอุปกรณ์เดิม คัดบิลด์ effective HPS สูงสุดแล้วตรวจ16seedอีกชุด; ไม่ใช้ DPS ต่ำตัดสิน healer", '', '| ช่วง | ตัวหลัก | HPS | DPS รวมทีม | รอดเฉลี่ย/4 |', '| --- | --- | ---: | ---: | ---: |']
    for r in support['results']:
        if r['selection'] == 'hps':
            m = r['mean']
            lines.append(f"| {r['condition']} | {r['job']} | {number(m['hps'])} | {number(m['team_dps'])} | {m['survivors']:.2f} |")
    lines += ['', '[ข้อมูลและบิลด์ฮีลจริง](support.json) — core และ boss เดียวกันทุก healer ในช่วงเดียวกัน; HPS ยังขึ้นกับ HP ที่เสียจริงและการขัดท่าบอส ไม่ใช่ตัวคูณ heal ล้วน']
lines += ["", "## ดูสาเหตุรายสกิล", "", "เปิด HTML แล้วแตะแถวอาชีพเพื่อดูชื่อสกิลทั้งสี่ ลำดับ ดาเมจ/ฮีลแยกรายสกิล ค่า ATK/MATK/SP/ASPD/CSPD และต้นทุนจริง ทุกตัวเลขในแถวมาจาก 16 seed ชุดตรวจผล", "", "## ทำซ้ำ", "", "```sh", "node --import tsx --test tests/game/class-audit.test.ts", "# รัน worker 0/1/2 ได้พร้อมกัน; ปกติใช้ CPU เท่านั้น", "node --import tsx scripts/game/class-audit.ts run --worker 0 --workers 3", "node --import tsx scripts/game/class-audit.ts run --worker 1 --workers 3", "node --import tsx scripts/game/class-audit.ts run --worker 2 --workers 3", "node --import tsx scripts/game/class-audit.ts merge --workers 3", "python3 scripts/game/class-audit-report.py", "# ใช้ frozen content เมื่อเกมมีแพตช์ใหม่แล้ว", "node --import tsx scripts/game/class-audit.ts replay --content plan/evidence/task-129/content-before.json.gz --file plan/evidence/task-129/replay-class2-70-gear60-dummy-hunter.json", "```", "", "## ข้อจำกัด", "", "ไม่ทดแทนทดสอบทุกด่าน/ธาตุ/การ์ด/ของแรร์/Refine/AoE/SP consumable หรือไฟต์ยาว90sขึ้นไป ไม่มีการปรับเกมอัตโนมัติ; ตัวเลข OP/Under ต้องระบุบริบทและตรวจสกิล/ต้นทุนก่อนตัดสิน", '', 'ผลนี้เป็น baseline ก่อนผู้ใช้ขอปรับ Awaken รอบถัดไป (TASK-130); อย่าใช้ hash ของแพตช์หลังเปลี่ยน Awaken อ้างว่าเป็นผลชุดนี้']
(OUT / "README.md").write_text("\n".join(lines) + "\n")

def lean(row):
    r = dict(row)
    r['initial_stats'] = {k:v for k,v in row['initial_stats'].items() if k in ['physical_attack','magical_attack','max_sp','attack_speed','cast_speed']}
    r['summary'] = dict(row['summary'])
    for key in ['skill_damage','skill_healing']:
        r['summary'][key] = {k:v for k,v in row['summary'][key].items() if v}
    return r
payload = {"hash":result["content_hash"],"battles":result["battles"],"confirmed":list(map(lean,confirmed)),"screen":list(map(lean,result["screen"]))}
template = r'''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RO Class Balance Audit</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#183153;font:15px system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:24px}h1{margin:0 0 10px;font-size:28px}p{line-height:1.65;color:#53677e}header{margin-bottom:22px}.controls{display:flex;gap:12px;flex-wrap:wrap;padding:16px;background:white;border-radius:18px;margin-bottom:18px}label{font-size:12px;color:#60758d;display:grid;gap:5px}select,button{border:1px solid #d4e0ef;border-radius:9px;padding:9px;background:white;color:#183153;font:inherit}button{cursor:pointer}a{color:#2563b8}.table{overflow:auto;border-radius:16px;background:white}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{text-align:right;padding:12px;border-bottom:1px solid #edf1f7}th{font-size:12px;color:#5c718d;cursor:pointer;background:#e5eefb}td:first-child,th:first-child{text-align:left}tr.data{cursor:pointer}tr.data:hover{background:#f0f6ff}.bar{height:5px;background:#6399e8;border-radius:5px;margin-top:5px;min-width:1px}.detail{white-space:normal;text-align:left!important;background:#f6f9fe;padding:20px}.muted{color:#718399;font-size:12px}.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.skills div{padding:10px;border-left:3px solid #a9c8f8;background:white}.subtable{max-width:680px;margin-top:12px;white-space:normal}.badge{font-size:11px;border-radius:5px;background:#e5eefb;padding:3px 6px}.note{border-left:3px solid #8ab6ee;padding-left:14px}code{word-break:break-all;font-size:11px}@media(max-width:600px){main{padding:14px}h1{font-size:22px}.controls{padding:12px}th,td{padding:10px}}</style>
<main><header><h1>RO · วัดบาลานซ์อาชีพ</h1><p id="intro"></p><p class="note">ของหกช่อง Common เท่ากัน ไม่มี Refine / Enchant / การ์ด / option · manual point budget เท่ากันตามเลเวล · ราคาสกิลจริงอาจต่างกัน<br>เลือกบิลด์ด้วย 3 seeds แล้วตรวจด้วยอีก 16 seeds แยกกัน · แตะแถวเพื่อดูสกิลและต้นทุน · ตัวเลขใช้เวลา90sเต็ม</p></header>
<div class="controls"><label>ช่วงพัฒนา<select id="condition"></select></label><label>การวัด<select id="encounter"><option value="dummy">คนเดียว / Dummy ไม่ตี</option><option value="pressure">ทีมมาตรฐาน / บอสโจมตี</option></select></label><label>ข้อมูล<select id="phase"><option value="confirmed">บิลด์ที่คัดแล้ว · 16 seeds</option><option value="screen">ทุกบิลด์ที่ลอง · 3 seeds</option></select></label><label>เรียงตาม<select id="sort"><option value="dps">DPS ตัวหลัก</option><option value="skill_dps">DPS สกิล</option><option value="team_dps">DPS รวมทีม</option><option value="hps">Healing ต่อวิ</option><option value="sp_skips">SP ขาด</option></select></label><button id="csv">ดาวน์โหลด CSV ที่แสดง</button></div>
<p id="info" class="muted"></p><div class="table"><table><thead><tr><th>อาชีพ / บิลด์</th><th>DPS รวม</th><th>ตีปกติ</th><th>สกิล</th><th>สกิล %</th><th>DPS ทีม</th><th>HPS</th><th>SP ขาด</th><th>รอด / วินาที</th></tr></thead><tbody id="rows"></tbody></table></div>
<p>บอส: Neutral / Large / Demi-human · HP1พันล้าน · DEF=MDEF=20+2×เลเวล · Pressure ใช้ Bite, Cataclysm, Doom, Firestorm ไม่มี CC immunity เพิ่ม<br>ค่า DPS ต่ำของ healer/support ไม่เพียงพอจะสรุปว่า Under; ทีมมาตรฐานมี healer อยู่แล้วจึงอาจไม่เห็นมูลค่าการฮีลเพิ่มทั้งหมด<br>ชุดนี้ยังไม่วัดธาตุอื่น/การ์ด/Refine/ของแรร์/ทุก permutation/ไฟต์ยาวเกิน90s · ไม่มีการปรับเกมจากผลนี้อัตโนมัติ</p><p><a href="README.md">อ่านเงื่อนไขและตารางสรุป</a> · <a href="summary.csv">CSV</a> · <a href="results.json">JSON ทุกเงื่อนไข</a></p><p class="muted" id="hash"></p></main>
<script>const DATA=__DATA__;const names=__NAMES__;const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0});
$('intro').textContent=`รันจริง ${num(DATA.battles)} ไฟต์ ด้วย engine และสกิลเวอร์ชันปัจจุบัน ไม่เรียกโมเดลระหว่างคำนวณ`; $('hash').textContent='Content SHA-256: '+DATA.hash;
const conditions=[...new Set(DATA.confirmed.map(r=>r.condition))];$('condition').innerHTML=conditions.map(c=>`<option>${c}</option>`).join('');$('condition').value='class2-70-gear60';let shown=[];
function render(){const phase=$('phase').value;shown=DATA[phase].filter(r=>r.condition===$('condition').value&&r.encounter===$('encounter').value).sort((a,b)=>b.summary.mean[$('sort').value]-a.summary.mean[$('sort').value]);const max=Math.max(...shown.map(r=>r.summary.mean.dps));$('info').textContent=`${shown.length} บิลด์ · ${phase==='confirmed'?'16 seeds ตรวจผล (แยกจากชุดคัดเลือก)':'3 seeds คัดเลือก ยังไม่ใช่อันดับยืนยัน'} · CI95% วัดความสุ่ม RNG เท่านั้น`; $('rows').innerHTML=shown.map((r,i)=>{const m=r.summary.mean;return `<tr class="data" data-i="${i}"><td><strong>${esc(r.build.job)}</strong><br><span class="muted">${esc(r.build.id)} · ${esc(r.build.role)}</span></td><td>${num(m.dps)}<div class="bar" style="width:${100*m.dps/max}%"></div></td><td>${num(m.normal_dps)}</td><td>${num(m.skill_dps)}</td><td>${(100*m.skill_dps/Math.max(1,m.dps)).toFixed(0)}%</td><td>${num(m.team_dps)}</td><td>${num(m.hps)}</td><td>${m.sp_skips.toFixed(1)}</td><td>${(m.alive_ms/1000).toFixed(1)}s</td></tr>`}).join('');$('rows').querySelectorAll('tr.data').forEach(tr=>tr.onclick=()=>details(tr,shown[Number(tr.dataset.i)]));}
function details(tr,r){if(tr.nextElementSibling?.classList.contains('details')){tr.nextElementSibling.remove();return}const m=r.summary.mean,s=r.initial_stats,detail=document.createElement('tr');detail.className='details';const damage=Object.entries(r.summary.skill_damage).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const healing=Object.entries(r.summary.skill_healing).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);detail.innerHTML=`<td class="detail" colspan="9"><div class="skills">${r.build.slots.map((id,i)=>`<div><span class="badge">${i+1}</span> ${esc(names[id]||id)}<br><span class="muted">${esc(id)}</span></div>`).join('')}</div><p>STR ${r.primary.str} · AGI ${r.primary.agi} · VIT ${r.primary.vit} · INT ${r.primary.int} · DEX ${r.primary.dex} · LUK ${r.primary.luk}<br>Point ${r.points_spent}/${r.point_budget} · ATK ${num(s.physical_attack)} · MATK ${num(s.magical_attack)} · SP ${num(s.max_sp)} · ASPD ${num(s.attack_speed)} · CSPD ${num(s.cast_speed)}<br>DPS CI95% ${r.summary.dps_ci95.map(num).join('–')} · ช่วง10sแรก ${num(m.burst10_dps)} · 30sท้าย ${num(m.last30_dps)}<br>ร่ายสำเร็จ ${m.casts.toFixed(1)} · ถูกขัด ${m.interrupted.toFixed(1)} · ขาดบอล ${m.sphere_skips.toFixed(1)} · ใช้ SP ${num(m.sp_spent)} · รอดทั้งทีม ${m.survivors.toFixed(2)}</p><table class="subtable"><tr><th>แหล่งดาเมจ</th><th>รวม / ไฟต์</th><th>DPS</th></tr>${damage.map(([id,n])=>`<tr><td>${esc(id==='normal_attack'?'ตีปกติ':names[id]||id)}</td><td>${num(n)}</td><td>${num(n/90)}</td></tr>`).join('')}</table>${healing.length?'<p>Effective heal: '+healing.map(([id,n])=>esc(names[id]||id)+' '+num(n)).join(' / ')+'</p>':''}<p class="muted">ต้นทุนสกิลรวม main + core (ทุน stat/อุปกรณ์เป็น synthetic fixture; ไม่ใช่ของที่ได้รับฟรีในเกม): ${esc(JSON.stringify(r.costs))}</p></td>`;tr.after(detail)}
for(const id of ['condition','encounter','phase','sort'])$(id).onchange=render;$('csv').onclick=()=>{const fields=['condition','encounter','job','build','dps','normal_dps','skill_dps','team_dps','hps','sp_skips'];const csv=[fields.join(','),...shown.map(r=>[r.condition,r.encounter,r.build.job,r.build.id,...fields.slice(4).map(k=>r.summary.mean[k])].join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='ro-class-audit.csv';a.click();URL.revokeObjectURL(a.href)};render();</script></html>'''
content = json.loads((ROOT / "src/generated/content.json").read_text())
names = dict(content['documents']['strings.th.json']['strings'])
for filename, document in content["documents"].items():
    if filename.startswith("skills/"):
        for skill in document.get("skills", []) + document.get("hi_class_skills", []):
            if skill["id"] not in names:
                names[skill["id"]] = skill["id"]
            if skill.get("presentation", {}).get("name"):
                names[skill["id"]] = skill["presentation"]["name"]
encoded = json.dumps(payload, separators=(",", ":"),ensure_ascii=False).replace("</", "<\\/")
template=template.replace('</style>','select{max-width:100%;min-width:0}.controls label{min-width:0;max-width:100%}.detail,#hash{overflow-wrap:anywhere}</style>',1)
(OUT / "report.html").write_text(template.replace("__DATA__",encoded).replace("__NAMES__",json.dumps(names,ensure_ascii=False).replace("</", "<\\/")))
print(json.dumps({"html":str(OUT / "report.html"),"bytes":(OUT / "report.html").stat().st_size,"markdown":str(OUT / "README.md")}))
