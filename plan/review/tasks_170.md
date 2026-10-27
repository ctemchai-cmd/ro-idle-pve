# TASK-170 — Break resources and gold shop

Milestone:M4 · [design](../design/83-break-resources.md)

## งานที่ต้องรอก่อนหน้า
TASK-169 (done).

## ขอบเขต
Essenceแพ็กเดิมใช้5000ทอง→20เม็ด/20ครั้งต่อวัน. AFK1→2,9→12,17→22ต่อชม.;เงิน/วัตถุดิบอื่น/ดันเดิม. เก็บpurchases/cursor/frozenเดิม ไม่ย้อนหลัง.

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
