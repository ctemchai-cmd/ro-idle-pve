# TASK-171 — Character level reset with full refund

Milestone:M4 · [design](../design/84-character-level-reset.md)

## งานที่ต้องรอก่อนหน้า
TASK-169 (done).

## ขอบเขต
ผู้ใช้ยืนยันเลือกmain/NPCกลับLv1/Class1+คืนทุนทั้งหมดสำหรับlevel/Break/skill/Awaken/Status;เก็บgear/cards/Refine/Enchant,ถอดของใส่ไม่ได้กลับinventory. โลก/ด่าน/daily/farm/ร้าน/กาชา/ตัวอื่นคงเดิม. sharedquote/confirmation/atomiccommand/UUID. ราคาเก่าarchiveคิดเฉพาะmissingoldprefix,บวกfutureactualpaidledger;ไม่injectตอนmigration. เก็บfuturelevel/Breakledgerหลังcompact. Rejectbadcount/overflow/activebattle;repeat/reset-relevelไม่เพิ่มทรัพยากร.

## รายละเอียด
Pure/shared calculations,typedcontracts,slot-scoped ownership and existingCAS/receipt. ไม่มีSQL/env/ownerwrites.

## ขั้นตอน
1. เก็บbaseline/ออกแบบและตรวจราคาเก่า
2. data/reducer/UIและcontracts
3. unit/native/build/publicและreview

## เกณฑ์ตรวจรับ
- [x] AC-01: ขอบเขต/quote/schema
- [x] AC-02: atomic/legacy/current/refund/replay/ownership
- [ ] AC-03: native/full/build/public

## Blocker / คำถาม
ไม่มี;resetsemanticsผู้ใช้ยืนยันแล้ว.
