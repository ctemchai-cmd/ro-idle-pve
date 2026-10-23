# TASK-122 — เลื่อน Hi-class รักษาบิลด์และตารางเลเวลหลัง70

Milestone: M5 · D154–155 · [design45](../design/45-hi-class-implementation.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-121.

## เป้าหมายและผลส่งมอบ
เลื่อน Hi-class รักษาบิลด์และตารางเลเวลหลัง70 ตามdesign45;แยกการเตรียมและการเปิดจริงตามdependency.

## ขอบเขตและรายละเอียด
ไม่แตะownercloud/privateenv/6173และไม่รันbalancebatch. ตัวเลขใหม่เป็นauthoredbaseline;Hi-classต้องมีAwakenพร้อมก่อนTASK125เปิดจริง.

## ขั้นตอนการทำงาน
1. ตรวจสัญญาและauthorข้อมูล/กรณีผิดพลาดให้ครบ
2. ทำpure rules/schemaก่อนadapterและUI
3. ตรวจregression/กรณีผิดพลาด/หลักฐานตรงเกณฑ์
4. ส่งต่อintegrationTASK125ก่อนเปิดfeature

## เกณฑ์ตรวจรับ
- [x] AC-01: ActiveHi fixtureเลื่อนสายเดิมที่70โดยไม่เปลี่ยนStatus/สกิล/loadout/equipment/ทุน;ต่ำ70/ปิดfeature/inbattle/ข้ามrootNPCถูกปฏิเสธ
- [x] AC-02: Level71–90ใช้ต้นทุน/แต้มmanualที่คำนวณได้,gate80แยกจากpromotionและไม่มีgate70;Class2ยังcap70
- [x] AC-03: Schemaรองรับ13Hi jobs/90/gate80แต่รุ่นปัจจุบันยังปิดHiและcap70;เซฟClass2ยังผ่านและไม่มีauto-promote
- [x] AC-04: Targeted progression/schema/build/boundariesและlegacyregressionผ่าน;ไม่เปิดreleaseก่อนสกิล/ภาพ/Awakenและintegrationครบ

## วิธีตรวจและหลักฐาน
T122-AC-01–04 ในacceptance-matrix. Pure/unit/content/schema/build/boundaries;TASK125เป็นเจ้าของactualAuth/API-SQL/mobileและhostedrelease. ยังไม่ตรวจครบ.

## Blocker / คำถาม
ไม่มีคำถามผู้ใช้ค้างในกติกาD154–155;รอdependency.

## บันทึกการทำงานและ review
- 23ต.ค.2026 แตกงานตามกติกาที่ผู้ใช้ยืนยัน;ยังไม่done.

- Review local:594fullTSผ่านหลังแก้historicalassertionsเฉพาะinactiveHi/schema90และfixtureเลือกอาชีพตรงroot;23focusedผ่านหลังใช้cachedjobcatalog.13สายเก็บบิลด์/อาวุธ/ทุนและ70→80→90/gate80/SPDไม่โตผ่าน. Rootbuild/boundaries/M0ผ่าน;Hi flagยังfalse/cap70/19jobsจริง. ไม่มีเจ้าของcloudหรือภาพHi-classทดสอบในงานนี้.
