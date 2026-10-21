# TASK-007 — เขียนข้อมูลสกิลครบสาย Thief → Assassin / Rogue

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร
- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation
- TASK-003 — เขียนข้อมูลสกิลครบสาย Swordsman → Knight / Crusader
- TASK-004 — เขียนข้อมูลสกิลครบสาย Acolyte → Priest / Monk
- TASK-005 — เขียนข้อมูลสกิลครบสาย Archer → Hunter / Bard / Dancer
- TASK-006 — เขียนข้อมูลสกิลครบสาย Mage → Wizard / Sage
- TASK-008 — เขียนข้อมูลสกิลครบสาย Merchant → Blacksmith / Alchemist
- TASK-047 — ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- ชุดสกิลและบิลด์ใน `plan/data/skills/thief.json`
- ตาราง unlock/upgrade/asset recipe และตัวอย่างคิวของทุกสาขาในสายนี้

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

กำหนด Active/Passive ของ Class 1 และ Class 2 ทุกท่าในรุ่นแรก: Assassin คริติคอล/พิษ/ปิดเป้า กับ Rogue เปิดจุดอ่อน/Strip/ขัด/ลอกท่าแบบ whitelist ระบุ ID, เป้า, coefficient, SP/CT/ACD/duration, stack/proc, crit policy, cap ตามตัวละคร, ต้นทุนและภาพ โดยประกอบจาก catalog/schema ที่ผ่าน TASK-047 ไม่หยิบสกิล Hi-class มาเป็นเงื่อนไขของบิลด์รุ่นแรก

## ขั้นตอนทำงาน

1. เลือกชุดสกิลที่ทำให้บทบาทต่างกันและระบุจำนวนจริงให้ครบ
2. ลงค่าทุกระดับ/สูตร upgrade/timing/crit policy ด้วย ordered effects/status/modifier/trigger/predicate กลาง ระบุ named formula เฉพาะท่าที่ primitive เดิมไม่พอ
3. จัดคิวสี่ช่องของหลายบิลด์ คำนวณตัวอย่างและอ้าง asset ID/สูตร procedural ที่ต้องใช้

## เกณฑ์ตรวจรับ

- [x] AC-01: Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้
- [x] AC-02: ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้
- [x] AC-03: ท่าลอกใช้หนึ่งในสี่ Active ไม่เพิ่มช่องที่ห้า และ Rogue มีคุณค่าต่อทีมแยกจากดาเมจส่วนตัวของ Assassin
- [x] AC-04: ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์

## วิธีตรวจและหลักฐาน

review ข้อมูลสกิลกับ design/02–04 คำนวณคิวตัวอย่าง และตรวจ metadata เฉพาะ asset ที่เลือก; ผลจำลองจริงรอ M1/M4

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/classes.py --root thief`; ตรวจทุก skill level และ cap ของ character1–70 | [report](../evidence/task-007-review.json): 60 checks ผ่าน, 24 skills / 4 builds; scope M0 | ผ่านแบบ M0 |
| AC-02 | คำนวณ stat points/skill budgets และคิว unbuffed ของทุก build จากค่าจริงเทียบ expected; unlock/branch/Passive และสี่ช่องไม่ซ้ำ | [report](../evidence/task-007-review.json): 60 checks ผ่าน, 24 skills / 4 builds; scope M0 | ผ่านแบบ M0 |
| AC-03 | อ่าน roles/effects/ต้นทุนใน catalog เทียบ [class contracts](../design/17-class-content-contracts.md) และเคสเฉพาะสาย; ไม่อ้าง runtime balance | [report](../evidence/task-007-review.json): 60 checks ผ่าน, 24 skills / 4 builds; scope M0 | ผ่านแบบ M0 |
| AC-04 | ตรวจ icon sidecar ID/sha256, prepared recipe/sound/dependency refs และ start/resolve/proc/stack contracts | [report](../evidence/task-007-review.json): 60 checks ผ่าน, 24 skills / 4 builds; scope M0 | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มี blocker ใน scope ที่ส่งมอบ; ตัวเลขเป็น baseline รอวัด runtime ตาม TASK-029–034/041

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: เริ่มหลัง dependency done; ส่ง catalog/presentation refs และตรวจ 60 checks ผ่าน พร้อม manual review ตาม class contracts แล้วครบ4AC จึงย้าย done ไม่มี game engine/ผล DPS ที่วัดจริงจากงานนี้
