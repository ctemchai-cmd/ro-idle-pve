# TASK180 — MVP Hunt และความก้าวหน้าช่วงท้าย

## งานที่ต้องรอก่อนหน้า
TASK-179.

## ขอบเขต / รายละเอียด
weekly bosses/reward once/Crystal80h/Enchant20/late difficulty/late daily+Tower Artifact rewards. ยึด [design91](../design/91-artifacts-mvp-enchant.md).

## ขั้นตอน
1. เก็บ baseline / ตรวจสัญญาและ schema
2. ทำ shared pure rules และเชื่อมระบบจริง
3. ทดสอบขอบเขต/การย้อนกลับ/เซฟเก่า
4. ตรวจ mobile/build/เผยแพร่และบันทึกหลักฐาน

## เกณฑ์ตรวจรับ
- [x] AC-01: ทุกพฤติกรรมในขอบเขตใช้กติกาเดียวกับ runtime/headless/UI
- [x] AC-02: ปฏิเสธข้อมูลผิดโดยไม่เสียทรัพยากร และ retryไม่จ่ายซ้ำ
- [x] AC-03: เซฟเก่ารักษาทรัพยากร/ทุน/สิทธิ์ผ่าน backup migration
- [x] AC-04: targeted tests และ strict/root/filtered build ผ่าน
- [x] AC-05: UI320/390 ใช้ได้และ hosted release ตรง source

## ผลตรวจในเครื่อง
832 TS / 12 focused / native320390 5groups / M0 / strict root+filtered identical1733files ผ่าน. ขึ้นVercel SUCCESS source`e840afa25` และ public hosted4groups/27bundleSHA ผ่านแล้ว. ไม่มี SQL/envใหม่/owner access/6173restart.

[ผลตรวจ](../evidence/task-180-review.json) · [เว็บ](https://ro-idle-pve.vercel.app/play)
