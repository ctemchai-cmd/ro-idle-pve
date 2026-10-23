# TASK-124 — Awakenรายสกิล เศษขั้นใหม่ และแลกเศษสองทิศ

Milestone: M5 · D154–155 · [design45](../design/45-hi-class-implementation.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-122, TASK-123.

## เป้าหมายและผลส่งมอบ
Awakenรายสกิล เศษขั้นใหม่ และแลกเศษสองทิศ ตามdesign45;แยกการเตรียมและการเปิดจริงตามdependency.

## ขอบเขตและรายละเอียด
ไม่แตะownercloud/privateenv/6173และไม่รันbalancebatch. ตัวเลขใหม่เป็นauthoredbaseline;Hi-classต้องมีAwakenพร้อมก่อนTASK125เปิดจริง.

## ขั้นตอนการทำงาน
1. ตรวจสัญญาและauthorข้อมูล/กรณีผิดพลาดให้ครบ
2. ทำpure rules/schemaก่อนadapterและUI
3. ตรวจregression/กรณีผิดพลาด/หลักฐานตรงเกณฑ์
4. ส่งต่อintegrationTASK125ก่อนเปิดfeature

## เกณฑ์ตรวจรับ
- [ ] AC-01: Hi+สกิลMaxจึงAwakenได้;logicalID/loadoutเดิม/กลับrank1/คงทุนเดิม/variantเพิ่มหรือเปลี่ยนผลและเก่งกว่าก่อนAwakenMax
- [ ] AC-02: เศษใหม่ดรอปดันช่วงหลัง/รวมเดิม→ใหม่/ย่อยใหม่→เดิมเป็นbatchatomic;ไม่มีวงแลกเพิ่มของ/overflow/คืนทุนซ้ำ
- [ ] AC-03: อัปAwakenใช้variantราคาและเศษใหม่/ledgercostversionจริง;รีเซ็ตคืนbase+Awakenจริงครั้งเดียวและmigrationเซฟเก่าไม่สูญหายหรือแจกเศษย้อนหลัง
- [ ] AC-04: หน้าสกิล/สมุด/Timelineแสดงvariant/rank/ผลจริงพร้อมpurpleinnerglow/nativeicon;runtime/headless/checkpoint/1x2x4ใช้definitionเดียวกัน

## วิธีตรวจและหลักฐาน
T124-AC-01–04 ในacceptance-matrix. Pure/unit/content/schema/build/boundaries;TASK125เป็นเจ้าของactualAuth/API-SQL/mobileและhostedrelease. ยังไม่ตรวจครบ.

## Blocker / คำถาม
ไม่มีคำถามผู้ใช้ค้างในกติกาD154–155;รอdependency.

## บันทึกการทำงานและ review
- 23ต.ค.2026 แตกงานตามกติกาที่ผู้ใช้ยืนยัน;ยังไม่done.
