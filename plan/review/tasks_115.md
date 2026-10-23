# TASK-115 — บท1–2ดรอปอุปกรณ์Lv1 บท3เริ่มLv20

Milestone: M4 · D148

## งานที่ต้องรอก่อนหน้า
TASK-025, TASK-037, TASK-040, TASK-113 (done).

## ขอบเขตและรายละเอียด
เปลี่ยนเฉพาะequipmentบท2จาก20→1 ไม่เพิ่มชนิดอุปกรณ์หรือเปลี่ยนrarity/dropchance. แยกตารางcardtierที่เคยใช้ค่าจากgearเพื่อรักษาการ์ดเดิมทั้งหมด. Existingกาชาใช้บทที่เคลียร์จบล่าสุดตามเดิม.

## ขั้นตอน
1.แก้data/sharedrulesหรือpresentationจากsourceจริง
2.ตรวจกรณีเปลี่ยนบท/saveเดิม/readonlyUIตามขอบเขต ไม่อ่านownerenvหรือเขียนownercloud
3.build/readinessและpushmain→publicsmoke→บันทึกผลและย้ายdone

## เกณฑ์ตรวจรับ
- [x] AC-01: ตารางอุปกรณ์1/1/20/40/40/60/60/60ใช้กับfarmและequipmentgacha;ทุกด่านบท2ได้poolLv1และบท3Lv20 ไม่เพิ่มTier10
- [x] AC-02: การ์ดfarm/gacha/Towerคงpoolและchanceเดิม;ของเดิมและpendingTier20คงครบ,migrationเปลี่ยนfuturefarmchapter2เป็นTier1โดยไม่ล้างcursor/carry/RNG
- [ ] AC-03: targetedrules/build/M0และเว็บproductioncontent/lootSHA/packตรง ผ่านก่อนdone

## วิธีตรวจและหลักฐาน
TargetedTS+productionbuild/M0;disposablelocalAuth/API/Postgres/Chrome320390และpublicread-only ไม่restart6173/ไม่รันbalancebatch. ผลจริงเติมเมื่อรันเสร็จ

Localผ่าน:54targetedTS/M0/build/secrets223/actualAuthAPI-SQL-mobile3groups. ดู[review](../evidence/task-115-review.json). รอhostedก่อนปิดเกณฑ์สุดท้าย
