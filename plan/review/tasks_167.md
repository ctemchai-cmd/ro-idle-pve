# TASK-167 — Gate of Hell damage

Milestone:M4 · D191 · [design80](../design/80-gate-power.md)

## งานที่ต้องรอก่อนหน้า
TASK-145, TASK-163 (done).

## ขอบเขต
Gateปกติ1200–2500%ก่อนHP/Awakenขยายตามฐานใหม่ตามคำยืนยันหลังเห็นA/B.

## รายละเอียด
คงcost/timing/HP/pen/IDs/ลงทุนเดิม;Fingerคงเดิมตามผลตรวจ. ไม่globalnerf.

## ขั้นตอน
1. เก็บbaseline/วัด96matchedfights/แจ้งความแรง
2. ปรับ2curvesในspec+authored
3. ตรวจmechanics/UI/full/build/publicแล้วpublish

## เกณฑ์ตรวจรับ
- [x] AC-01:20ranks/scope/programเดิมผ่าน
- [x] AC-02:actualHP/interruptและboundedA/Bผ่าน
- [ ] AC-03:mobile/full/build/publicผ่าน

## วิธีตรวจ
Design80/unit/native/audit/evidence167.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันก่อนHPและยอมแรงมากขึ้น.
