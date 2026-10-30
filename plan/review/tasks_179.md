# TASK179 — Artifact catalog, build และเซฟ

## งานที่ต้องรอก่อนหน้า
TASK-014 (done).

## ขอบเขต / รายละเอียด
schema/120 definitions/pure skill enhancement/equip/level/stars/salvage/draw/backup migration. ยึด [design91](../design/91-artifacts-mvp-enchant.md).

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
- [ ] AC-05: UI320/390 ใช้ได้และ hosted release ตรง source

## ผลตรวจในเครื่อง
832 TS / 12 focused / native320390 5groups / M0 / strict root+filtered identical1733files ผ่าน. รอ commit/push และ hosted proof. ไม่มี SQL/envใหม่/owner access/6173restart.
