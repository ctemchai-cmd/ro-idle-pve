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
- [x] AC-01: 13Hi professionsมี2stable skillsต่ออาชีพครบprogram/rank1–10/ราคา/ชื่อ/คำอธิบายจริง;unlock70และ80/full88และ89
- [x] AC-02: Nativebody/head/weapon/actionของ24genderpresetsและjob/skilliconsตรงต้นทาง;packไม่เกิน32MiBหรือมีทางปรับลดที่ตรวจได้
- [x] AC-03: ทุกprogramใช้sharedtypedpipeline/สถานะ/ธาตุ/คิวเดิมและมีdistinctrole;สกิลเดิมไม่ถูกย้าย/ลบทิ้ง
- [x] AC-04: Content/golden/targeted1x2x4/build/metadata/nativepreviewผ่าน;ไม่อ้างว่าบาลานซ์ทีมผู้ใช้แล้วและยังไม่เปิดreleaseเดี่ยว

## วิธีตรวจและหลักฐาน
T123-AC-01–04 ในacceptance-matrix. Pure/unit/content/schema/build/boundaries;TASK125เป็นเจ้าของactualAuth/API-SQL/mobileและhostedrelease. ยังไม่ตรวจครบ.

## Blocker / คำถาม
ไม่มีคำถามผู้ใช้ค้างในกติกาD154–155;รอdependency.

## บันทึกการทำงานและ review
- 23ต.ค.2026 แตกงานตามกติกาที่ผู้ใช้ยืนยัน;ยังไม่done.

- เริ่มต่อ23ต.ค.2026หลังTASK127;ไม่มีคำถามเพิ่ม. ทำ26โปรแกรม/24ชุดภาพจริงก่อนAwakenและintegration ไม่เปิดHiแค่บางอาชีพ.

- ผ่าน21focused (26×10โปรแกรม/78numericgoldens/ทุก13promotions/rank70..88และ80..89/shared1x2x4/checkpoint);full610=609ผ่าน/1historicalpackcount134ต้องเป็น160เตรียมHigh26เพิ่ม จากนั้น21focusedทั้งหมดผ่าน. ค่าstatus31รวมDoubleCastingที่ยังไม่เปิด;Class2ยัง126/19และทุกdefinitionเดิมคงSHA.
- NativeChrome942frame samples/471mirrorpairs/24presets/head+weaponattachmentsผ่าน;ดู3galleries120selectedposesจริง ไม่อ้างตรวจcosmeticsทุกแบบ.13jobemblemsต้นทางROO+26nativeiconsไม่มีskilliconแทนตราอาชีพ. Import284/library60460checksผ่าน. Pack33104702B≤33554432;เหลือ449730B. Rootbuild597705gzip/M0/readiness/typecheckผ่าน.
- งานนี้เป็นcontent/art preparationที่ทดสอบเปิดในfixture;ยังไม่เปิดHi-classให้ผู้ใช้จนTASK124–125ครบ. ไม่มีowneraccess/6173restart/balancebatch/SQL/env.
