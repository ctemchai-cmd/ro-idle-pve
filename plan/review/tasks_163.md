# TASK-163 — รางวัลหอคอยให้คุ้มค่า

Milestone:M4 · D187 · [design76](../design/76-tower-rewards.md)

## งานที่ต้องรอก่อนหน้า
TASK-035, TASK-134, TASK-139, TASK-162 (done).

## ขอบเขต
เพิ่มเฉพาะรางวัลผ่านครั้งแรกTowerและพรีวิวรางวัล. ไม่แก้ความยาก/อาชีพ/ฟาร์ม.

## รายละเอียด
ทอง+EXPทุกชั้น, วัตถุดิบหมุนเวียน, โบนัส5/10/20, Crystalและการ์ดสุ่มตามdesign76;เซฟเก่ารักษาทุกอย่าง.

## ขั้นตอน
1. เก็บตารางก่อนแก้/คำนวณงบเทียบต้นทุน
2. เพิ่มtyped schedule/shared calculation/validation/generator/terminal reward
3. ปรับpreviewด้วยnativeicons
4. ตรวจcommand/migration/mobile/full/build/publicแล้วpublish

## เกณฑ์ตรวจรับ
- [x] AC-01:shared/authored100rows/budget/scope/invalid/overflowผ่าน
- [x] AC-02:firstclear/auto/replay/pending/terminal retriesผ่าน
- [x] AC-03:migrationไม่ย้อนหลังหรือแก้pendingเก่า
- [ ] AC-04:mobile320390/M0/fullTS/build/hostedผ่าน

## วิธีตรวจ
Tests/evidence/design76;ไม่แตะownerAuthหรือSQL.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันCrystal+materials+EXP.

## ผลตรวจ
752TS/11nativecases320390/M0/rootbuild/generatorผ่าน;รอVercel/publicก่อนdone.
