# TASK-166 — ทยอยอัป Awaken และตรวจ Finger

Milestone:M4 · D190 · [design79](../design/79-awaken-rank-progression.md)

## งานที่ต้องรอก่อนหน้า
TASK-139, TASK-163 (done).

## ขอบเขต
ผู้ใช้ยืนยันสกิลต้นสายเต็มเร็ว/ท้ายเต็มช้า. Awakenrank1ที่max(70,base-rank10-level). Full:Class1=80,Class2unlock20=85/30=90/40=95,Hiunlock70=98/80=100. ใช้ceilกระจายrank1..10อย่างเพิ่มขึ้นชัดเจน. Basecapsเดิม. UIquote/validation/migrationเดียวกัน.

## รายละเอียด
BackedupcontentmigrationลดเฉพาะAwakenrankส่วนเกิน,รักษาAwakenflag/loadout/baseinvestment/unlockinvestment. คืนgold/shardsตามactual-paidversion archiveเดิมและหักledgerพร้อมกัน. ทำซ้ำไม่คืนซ้ำ;unknownhistory/overflowปฏิเสธทั้งก้อน. ห้ามอ่านหรือแก้ownerDB.

FingerbaseMax5×255.9375%=1279.6875%P.ATK;Aw1หกhitรวม1689.1878% (+32%),Aw10รวม2226.6564% (+74%) คง5balls/35SP/1sCT/1sACD. วัดtargetedmatchedsinglecastกับDEFหลายระดับก่อนตัดสินปรับ ไม่รันglobalDPSbatch. ยังไม่เปลี่ยนpowerโดยไม่มีหลักฐาน.

## ขั้นตอน
1. เก็บbaseline/ออกแบบและtypedcontracts
2. ทำsharedreducers/UI/migration
3. ตรวจunit/actualcommands/native/build/publicแล้วpublish

## เกณฑ์ตรวจรับ
- [x] AC-01: rankall152/quotes/UI/fullschedule/baseunchanged
- [x] AC-02: actual-paidAwakenrefundallroots/Class1/Class2/Hi/idempotent/unknown/overflow
- [ ] AC-03: Fingeractualengine/matched/percast plus320390/fullTS/build/public

## วิธีตรวจ
Disposablecommand/nativefixturesและevidenceเฉพาะงาน.

## Blocker / คำถาม
ไม่มี;ผู้ใช้กำหนดขอบเขตแล้ว.
