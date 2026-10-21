# TASK-009 — ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร
- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation
- TASK-047 — ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- `plan/data/equipment.json`, `cards.json` และตารางพัฒนา slot

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

ลงค่าฐานหก slot/อาวุธทุกสาย, tier รุ่นแรก 1/20/40/60, rarity เจ็ดขั้น, สูตรผสม/อัป tier, Refine ถึง +10, Enchant และการ์ด กำหนด substat/ผลซ้อน/ของล็อก/กระเป๋าและการเปลี่ยนของ โดยเก็บค่าพัฒนาประจำ slot ของแต่ละตัว

## ขั้นตอนทำงาน

1. กำหนด item template/อาวุธ Class 1 และใช้ modifier/trigger/effect schema จาก TASK-047 ร่วมกับสกิลและ Passive
2. ออกแบบตาราง stat/ต้นทุน/การ์ดและขีดจำกัดที่มีผลต่อเวลา
3. เขียนตัวอย่างเปลี่ยนของ ย้ายของ ผสม และอัป tier โดยไม่สร้างของซ้ำ

## เกณฑ์ตรวจรับ

- [x] AC-01: ครบหก slot และ weapon ของทุก Class 1/2 พร้อมค่าที่ใช้ได้ที่ Lv.70; tier 80/100 ยังไม่ดรอปในรุ่นแรก
- [x] AC-02: ผสมสามชิ้น rarity/tier/slot เดียวกันและชนิดอาวุธเดียวกัน; อัป tier รักษา rarity ด้วยต้นทุนที่ระบุ
- [x] AC-03: Refine/Enchant/การ์ดไม่ย้ายตาม item หรือช่องทีม; การ์ด 1 ช่องเริ่มต้น/2 ที่ +5/3 ที่ +10
- [x] AC-04: ระบุ catalog/ระดับ/ผลซ้อนการ์ดแยกจาก rarity อุปกรณ์ ใช้ stat/modifier/trigger/effect กลางพร้อม source attribution และกติกาของสวม/ล็อกไม่ถูกกิน

## วิธีตรวจและหลักฐาน

คำนวณ stat/ต้นทุนและ inventory ก่อนหลังตัวอย่างทุกการเปลี่ยนแปลง พร้อมกรณี rarity สูงสุดและกระเป๋าเต็ม

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/equipment.py`; ตรวจ60equipment/18carddefinitionsด้วยItem schema, local icon/media refs และ19 job weapon mappings | [report](../evidence/task-009-review.json): 83 checks ผ่านพร้อม [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-02 | `python3 plan/checks/equipment.py`; fusion valid/negative6กรณี, Tier1/20/40/60 cost rows และ729 Common→Supreme | [report](../evidence/task-009-review.json): 83 checks ผ่านพร้อม [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-03 | `python3 plan/checks/equipment.py`; อ่าน owner key/slot move cases/capacity0/5/10 และ design/18; runtime swapsยังเป็นTASK-027/044 | [report](../evidence/task-009-review.json): 83 checks ผ่านพร้อม [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-04 | `python3 plan/checks/equipment.py`; cardrarity/level/dust, source aggregation294 และของล็อก/สวมไม่ถูกกิน | [report](../evidence/task-009-review.json): 83 checks ผ่านพร้อม [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: ส่ง60equipment/18cards/slot progressและbaseline18 ตรวจ83checksพร้อมmanual ownership reviewผ่าน4AC; ระหว่างauthoringแก้presentation IDที่ถูกasset IDทับหลังcheckerตรวจพบ ไม่มีการข้ามvalidationหรืออ้างruntimeผ่าน

- TASK-014supplement: trainingweaponซื้อ125ทองเฉพาะTier1 ใส่เริ่มอาชีพได้แต่ไม่fusion/tier-upและทิ้งคืน0 ป้องกันซื้อCommon729ชิ้นลัดSupreme/แร่; ตรวจเพิ่มเป็น84checks การ์ดgenericartแชร์ภาพ จึงประกอบหน้าต้นแบบด้วย18distinctlocal symbolsแทนการอ้างnativeportraits
