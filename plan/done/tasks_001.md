# TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- ไม่มี — เริ่มงานออกแบบนี้ได้เมื่อผู้ใช้สั่งเริ่มงานตามแผน

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- `plan/design/09-release-scope.md`
- `plan/data/progression.json` และตารางปลดระบบ

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

กำหนดเนื้อหารุ่น Class 2, การเริ่มเกม/ปลดเพื่อนหกตัว, resources ที่ผู้เล่นเลือกกดอัป main/NPC รวมตัวนอกทีมตาม Q-021, แต้ม Status และ Breakthrough 20/40/60 การเปลี่ยน Class 2 ที่ 20 และ cap 70 ต้องแยกจาก Hi-class ในอนาคต ไม่ใช้ auto-level ตัวลงสนามแทน

## ขั้นตอนทำงาน

1. ทบทวน decisions แล้วระบุทุกระบบที่ลงรุ่นแรก/ระบบอนาคต จุดเริ่มเกม และ browser/ขนาดจอ/อุปกรณ์อ้างอิงที่จะใช้ตรวจรับ
2. ออกแบบตารางเลเวล/แต้ม/ค่าอัปและ refund policy เมื่อราคาหรือวัสดุเปลี่ยน ระบุ investment ledger หรือข้อมูลที่ต้องเก็บเพื่อคืนทุนโดยไม่คำนวณราคาใหม่ย้อนหลังผิด
3. คำนวณตัวอย่างตั้งแต่เริ่มถึง 70 และระบุช่วงปลดระบบที่เล่นได้จริง

## เกณฑ์ตรวจรับ

- [x] AC-01: มีเส้นทาง Lv.1–70 พร้อมเงื่อนไขเลเวล/Breakthrough/Class 2 และไม่สร้าง Breakthrough ที่ 70
- [x] AC-02: ไม่มีการเพิ่ม STR/AGI/VIT/INT/DEX/LUK ตามอาชีพอัตโนมัติ ระบุค่าตั้งต้นและแต้มลงเองชัดเจน
- [x] AC-03: NPC ทั้งหกมีข้อมูลพัฒนาของตน ใช้ resources เลือกกดอัปตัวใดก็ได้รวมตัวนอกทีม ไม่ auto-level หรือโอนค่าจากช่องทีม
- [x] AC-04: รีเซ็ต/สลับสายรักษาเลเวล คืนทุนตาม ledger/policy ที่ระบุ พร้อมเคส cost v1→v2 ที่ไม่สร้างทรัพยากรเพิ่มหรือหาย; Lv.70 ยังไม่เปลี่ยน Hi-class ในรุ่นแรก

## วิธีตรวจและหลักฐาน

หลักฐานจริง: [ผล review](../evidence/task-001-review.json), [ข้อมูล](../data/progression.json), [ขอบเขต](../design/09-release-scope.md), [ตัวตรวจ](../checks/progression.py)

อ่านตารางและคำนวณเส้นทางตัวอย่าง 1→20→40→60→70 รวมสลับ main/NPC/สาขาไปกลับ

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | คำนวณ closed-form เทียบ70แถว, gate20/40/60, Class2แยก Breakthrough, starter budget และแหล่ง essence; python3 plan/checks/progression.py --write-report | plan/evidence/task-001-review.json: AC-01 pass (design review) | ผ่านเฉพาะ M0 |
| AC-02 | ตรวจ base1/5แต้มต่อเลเวล/ตารางราคา/งบ345และขอบเขต stat79 โดยไม่มี auto growth; python3 plan/checks/progression.py --write-report | plan/evidence/task-001-review.json: AC-02 pass (design review) | ผ่านเฉพาะ M0 |
| AC-03 | ตรวจ roster6/party references/ตัวนอกทีมและ fixture ถอน-ใส่ที่รักษา skill/slot/แต้ม; python3 plan/checks/progression.py --write-report | plan/evidence/task-001-review.json: AC-03 pass (design review) | ผ่านเฉพาะ M0 |
| AC-04 | ตรวจ ledger v1→v2 ทั้งราคาสูง/ต่ำ, retryคืน0, แต้มเป็นของตัวเดิม และ atomic reject เมื่อกระเป๋าเต็ม; python3 plan/checks/progression.py --write-report | plan/evidence/task-001-review.json: AC-04 pass (design review) | ผ่านเฉพาะ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มี blocker ของงานนี้ ข้อมูล baseline ผ่าน self-review แล้ว; TASK-010/011 ต้องตรวจอัตรารายได้/encounters ให้เข้ากับต้นทุน หากปรับ cost version ให้ปรับ fixtures/หลักฐานและประเมินงานที่ได้รับผล ไม่อ้างว่าตัวเกมหรือ pace ผ่านแล้ว

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 19 ตุลาคม 2026: เริ่มงาน M0 ตามคำขอให้เตรียมรายละเอียดเพื่อเริ่มพัฒนา; ย้าย todo → inprogress ไม่เริ่ม coding ตัวเกม

- 19 ตุลาคม 2026: ส่ง review พร้อม progression70ระดับ/กติกาคืนทุน/ตารางปลดและผลคำนวณ 28เคส; ไม่มีการทดสอบ engine/cloud

- 19 ตุลาคม 2026: review ผ่าน AC-01–04 จากการตรวจแบบ/คำนวณ29เคส ย้าย review → done; baseline ตัวเลขยังต้องวัดรายได้/บาลานซ์ใน TASK-010/011/041
