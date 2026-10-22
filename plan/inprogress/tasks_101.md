# TASK-101 — ไอคอน Upgrade EXP อาชีพ และใบธาตุจาก RO

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-019, TASK-048, TASK-095, TASK-100 (done)

## เป้าหมายและผลส่งมอบ

ไอคอน Upgrade EXP อาชีพ และใบธาตุจาก RO ตามคำขอ22ต.ค.2026

## ขอบเขตและรายละเอียด

ใช้canonicaldata/sharedrulesและnativeROmetadata; ไม่รันbalancebatch ไม่อ่านprivateenv ไม่แตะownercloud/6173 ไม่มีSQLใหม่

## ขั้นตอนทำงาน

1. เก็บbefore/auditและเปลี่ยนauthorityเฉพาะส่วน
2. ต่อUI/metadataและตรวจfocusedrulesกับข้อมูลก่อนแก้
3. ตรวจมือถือจริงในisolatedChrome/build/publicdeployment แล้วreviewเกณฑ์

## เกณฑ์ตรวจรับ

- [ ] AC-01: Native Upgrade/EXP/4ใบธาตุ/19อาชีพโหลดได้ ใช้frame cropถูกต้องและมีชื่อเข้าถึง ไม่มีcustomjobSVG
- [ ] AC-02: มือถือ320/390ไม่ล้นและpublicVercelส่งmapping/media/bundleตรงchecksum

## วิธีตรวจและหลักฐาน

Focused fixtures/static audit, isolatedChrome320/390 และpublicartifact SHA; เติมผลจริงก่อนdone

## Blocker / คำถาม

ไม่มี; ตัวเลขassistanttrialภายใต้คำขอ ไม่อ้างwhole-gamebalance

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026

- Local: M0/readiness8/build/type/boundaries/secrets/sourceassetchecks ผ่าน. 80unique focusedTSรวม378rawgoldensและmigration; ไม่มีbalancebatch. Staticauditเปลี่ยนเฉพาะAsuraSP/Blessingduration/Refineore คงFinger/ATK/gold/chance/ledger.
