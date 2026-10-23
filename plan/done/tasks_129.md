# TASK-129 — วัด DPS ทุกสายด้วยอุปกรณ์เท่ากันและหลายบิลด์

Milestone: M4 · ประเภท: ตรวจวัด · อ้างอิง: design/08-simulation-and-balance.md, D-159

## งานที่ต้องรอก่อนหน้า

TASK-018, TASK-107, TASK-123–125, TASK-128 (done): shared engine, current class content, Hi-class/Awaken และ Hunter ล่าสุด

## เป้าหมายและขอบเขต

ตอบว่าอาชีพ/บิลด์ใดทำดาเมจน้อยหรือมากภายใต้เงื่อนไขเดียวกัน ด้วยข้อมูลจริงจาก engine ปัจจุบัน แยก normal/skill/team DPS และบทบาทสนับสนุน มีอุปกรณ์ Lv.1/20/40/60, Class 2 และ Hi-class ก่อน/หลัง Awaken หลายชุดสกิลและ stat allocation

ไม่เปลี่ยนสูตร/สกิล/ราคา/ด่าน ไม่เข้าบัญชีผู้ใช้ ไม่เรียกโมเดลระหว่าง simulation ไม่ใช้ผล dummy เดียวตัดสินทุกบทบาท และไม่ถือว่างานนี้ปิด TASK-041 ทั้งหมด

## รายละเอียดและขั้นตอน

1. สร้าง synthetic accounts ตรวจ schema/สายสกิล/point budget/gear fit ผ่านกติกาจริง เก็บต้นทุนจริงของแต่ละบิลด์; เทียบระดับและเพดาน rank เท่ากัน ไม่อ้างว่าราคาสกิลต่างอาชีพเท่ากัน
2. เรียก createBattle/advanceUntil/metrics เดียวกับเกม ไม่คัดลอกสมการ ไม่มี animation/network/wall-clock ในการคำนวณ
3. คัดหลายบิลด์ด้วย seed ชุดหนึ่ง แล้ววัดผู้ชนะด้วย seed อีกชุด แยก DPS ส่วนตัวบน dummy กับทีมมาตรฐานเจอบอสมีแรงกดดัน
4. เก็บ content hash, exact inputs, seeds, CSV/JSON และรายงานอ่านง่ายพร้อมข้อจำกัด; มี replay และตรวจดาเมจ summon/periodic ไม่ตกหล่น
5. Review ความครบถ้วน ตัวเลขผลรวม ความทำซ้ำได้ และสรุป OP/Under เป็นผู้ต้องสงสัย ไม่ปรับเกมเอง

## เกณฑ์ตรวจรับ

- [x] AC-01: fixture ทุกตัวผ่าน validation; มี Class2 13/High13 และทุก gear tier ที่ขอ, สี่ช่องไม่ซ้ำ, manual points จริง, ไม่มีบัฟ stat ฟรี
- [x] AC-02: matched seeds/boss/gear/level/rank; training แยก pressure/team; ดาเมจ normal+skills รวมเท่ากับ owner รวม summon และ effective heal ไม่รวม overheal
- [x] AC-03: หลายบิลด์/สรุป mean+ช่วงความไม่แน่นอน/held-out seeds, skill breakdown+resource skips+survival; replay ทำซ้ำได้
- [x] AC-04: รายงาน JSON/CSV/HTML/Markdown ระบุ content hash, command, เงื่อนไข/ต้นทุน/ข้อจำกัด; tests/typecheck/boundaries ผ่าน ไม่มี gameplay/owner save mutation

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง |
| --- | --- | --- |
| AC-01–04 | tests/game/class-audit.test.ts + scripts/game/class-audit.ts + ตรวจรายงานจริง | ผ่าน14168ไฟต์ / 3TS / typecheck / boundaries / offline browser4กลุ่ม / frozen replay2 |

ผู้ตรวจ: Codex · วันที่: 24 ต.ค.2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มี ผู้ใช้ขอรัน controlled balance audit โดยตรงในครั้งนี้ ยกเว้นคำสั่งงด balance batch ในงานก่อนหน้าเฉพาะการวัดรอบนี้

## ผลตรวจจริง

- 13,808ไฟต์หลัก +360support, 1224validatedfixtures, 2448candidategroups, 258held-outgroups; hash79ab9437… เก็บfrozencontentและ258replayในarchive
- [รายงาน](../evidence/task-129/README.md), [HTML](../evidence/task-129/report.html), [review](../evidence/task-129/review.json). Chrome390/320/desktop4กลุ่มผ่าน; แก้hashข้อความล้นมือถือก่อนผ่าน เก็บlogรอบที่ไม่ผ่านในtmp
- Class270gear60: Assassin4619/Hunter4181นำ; Alchemist2177/Wizard2217ท้ายในสายDPS. High90Aw10 AssassinCross11837นำส่วนตัว, Whitesmithทีม23404นำทีมตัวอย่าง. ไม่เหมารวมhealerจากDPS
- ไม่แก้เกมจากผลนี้; คำขอใหม่ผู้ใช้ให้ปรับAwakenเป็นTASK130 แยกbaselineเดิมไว้ก่อน
