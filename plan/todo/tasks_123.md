# TASK-123 — สกิล Hi-class26ท่าและภาพจริงทุกอาชีพ

Milestone: M5 · D154–155 · [design45](../design/45-hi-class-implementation.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-122.

## เป้าหมายและผลส่งมอบ
สกิล Hi-class26ท่าและภาพจริงทุกอาชีพ ตามdesign45;แยกการเตรียมและการเปิดจริงตามdependency.

## ขอบเขตและรายละเอียด
ไม่แตะownercloud/privateenv/6173และไม่รันbalancebatch. ตัวเลขใหม่เป็นauthoredbaseline;Hi-classต้องมีAwakenพร้อมก่อนTASK125เปิดจริง.

## ขั้นตอนการทำงาน
1. ตรวจสัญญาและauthorข้อมูล/กรณีผิดพลาดให้ครบ
2. ทำpure rules/schemaก่อนadapterและUI
3. ตรวจregression/กรณีผิดพลาด/หลักฐานตรงเกณฑ์
4. ส่งต่อintegrationTASK125ก่อนเปิดfeature

## เกณฑ์ตรวจรับ
- [ ] AC-01: 13Hi professionsมี2stable skillsต่ออาชีพครบprogram/rank1–10/ราคา/ชื่อ/คำอธิบายจริง;unlock70และ80/full88และ89
- [ ] AC-02: Nativebody/head/weapon/actionของ24genderpresetsและjob/skilliconsตรงต้นทาง;packไม่เกิน32MiBหรือมีทางปรับลดที่ตรวจได้
- [ ] AC-03: ทุกprogramใช้sharedtypedpipeline/สถานะ/ธาตุ/คิวเดิมและมีdistinctrole;สกิลเดิมไม่ถูกย้าย/ลบทิ้ง
- [ ] AC-04: Content/golden/targeted1x2x4/build/metadata/nativepreviewผ่าน;ไม่อ้างว่าบาลานซ์ทีมผู้ใช้แล้วและยังไม่เปิดreleaseเดี่ยว

## วิธีตรวจและหลักฐาน
T123-AC-01–04 ในacceptance-matrix. Pure/unit/content/schema/build/boundaries;TASK125เป็นเจ้าของactualAuth/API-SQL/mobileและhostedrelease. ยังไม่ตรวจครบ.

## Blocker / คำถาม
ไม่มีคำถามผู้ใช้ค้างในกติกาD154–155;รอdependency.

## บันทึกการทำงานและ review
- 23ต.ค.2026 แตกงานตามกติกาที่ผู้ใช้ยืนยัน;ยังไม่done.
