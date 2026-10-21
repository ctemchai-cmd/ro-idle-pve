# TASK-010 — ออกแบบเศรษฐกิจ ดรอป กาชา และเป้าหมายเวลาสะสม

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-003 — เขียนข้อมูลสกิลครบสาย Swordsman → Knight / Crusader
- TASK-004 — เขียนข้อมูลสกิลครบสาย Acolyte → Priest / Monk
- TASK-005 — เขียนข้อมูลสกิลครบสาย Archer → Hunter / Bard / Dancer
- TASK-006 — เขียนข้อมูลสกิลครบสาย Mage → Wizard / Sage
- TASK-007 — เขียนข้อมูลสกิลครบสาย Thief → Assassin / Rogue
- TASK-008 — เขียนข้อมูลสกิลครบสาย Merchant → Blacksmith / Alchemist
- TASK-009 — ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- `plan/data/economy.json`, `loot.json`, `gacha.json`
- ตารางรายได้/รายจ่ายและตัวอย่างความก้าวหน้าช่วงครึ่งชั่วโมง/ข้ามวัน

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

กำหนดทอง Crystal วัตถุดิบเลเวล/สกิล/Breakthrough/slot/card และอัตราฟาร์ม ครบทุก sink/source ตาม cap 70 กาชาเปิดเฉพาะการ์ด แสดงอัตรา pity/ของซ้ำ และเตรียม pure calculation สำหรับจำลอง progression ในอนาคต

## ขั้นตอนทำงาน

1. รวมต้นทุนจากสกิล/อุปกรณ์ กำหนดแหล่งทรัพยากร/รายได้ และกติกาว่าฟาร์มยังเดินหรือพักระหว่างท้าบอส/โหมดอื่น เพื่อไม่คิดรายได้ซ้ำ
2. ทำตัวอย่างงบลงทุนที่เท่ากันและเวลาถึงเป้าหมายหลายช่วง
3. ตรวจการคืนทุน/ต้นทุนเดิมกับราคาหลัง patch, reward-rate snapshot ระหว่าง AFK, การดรอป rarity สูง และธุรกรรมกาชาให้สอดคล้องกัน

## เกณฑ์ตรวจรับ

- [x] AC-01: ทรัพยากรทุกชนิดมีแหล่งและการใช้ ไม่ติดเพราะวัตถุดิบที่ยังไม่มีโหมดให้หา
- [x] AC-02: มี checkpoints ของบิลด์/งบอ้างอิง ระบุช่วงเวลาสะสมที่ยอมรับเป็นตัวเลขสำหรับการพัฒนาระดับครึ่งชั่วโมงและเป้าหมายใหญ่ข้ามวัน พร้อมการคำนวณรองรับ
- [x] AC-03: คิดต้นทุน Supreme จาก Common 729 ชิ้นร่วมกับ higher-rarity drops และทางอัป tier ไม่ล้างการลงทุน
- [x] AC-04: กาชามี pool/rates/pity/duplicate conversion ชัดเจน ผลรวมอัตราถูกต้อง และไม่มี Pet/Artifact ที่ยังใช้ไม่ได้

## วิธีตรวจและหลักฐาน

ตรวจสมดุล resource ledger จากตารางตัวอย่าง ระบุสมมติฐานและ expected checkpoints; ยังไม่อ้างว่าผ่านการเล่นจริง

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/economy.py`; source/sink8resources, early ore/essence, targeted weapons และfractional AFK/cap | [report](../evidence/task-010-review.json):12 checks ผ่านและ [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-02 | `python3 plan/checks/economy.py`; งบ6checkpointsตรงexpected:22.03/21.84/28/500/800/2200นาที และช่วงยอมรับในeconomy.json | [report](../evidence/task-010-review.json):12 checks ผ่านและ [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-03 | `python3 plan/checks/economy.py`; 3^6=729, higherdrops3.0606Common-equivalent/drop, รักษาrarityเมื่ออัปtier; throughputไม่ใช่guaranteedtime | [report](../evidence/task-010-review.json):12 checks ผ่านและ [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |
| AC-04 | `python3 plan/checks/economy.py`; 54card/quality combinationsจาก18definitions×3qualities, oddsรวม1,000,000, pity10/20/30และduplicates | [report](../evidence/task-010-review.json):12 checks ผ่านและ [baseline18](../design/18-equipment-and-rewards-baseline.md) | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: ส่งeconomy/loot/gachaและงบตัวเลข6จุด ตรวจ12checks+manualresourceflow/pity reviewผ่าน4AC; ยังไม่ใช่ผลเวลาเล่นจริงหรือfull-progression simulation
