# TASK-100 — Crystal AFK ราคาใบธาตุ ลดดรอปอุปกรณ์ และ Upgrade icon

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-038, TASK-094, TASK-095 (done)

## เป้าหมายและผลส่งมอบ

Crystal40/h=480/12h, ใบธาตุ5000gold, gear50%ต่อ5minไม่ลดcardroll, legacy snapshotคงค่าจนรับ; Towerแจ้ง10ทุก5ชั้น; iconเข้าธีม

## ขอบเขตและรายละเอียด

คงเกมเล่นคนเดียวและsharedengine ไม่มีbalancebatch/ownercloudwrite/SQL/envใหม่ ไม่แก้6173

## ขั้นตอนทำงาน

1. อัปเดตcanonicaldata/contractsและsharedreducers
2. ต่อUIอ่านauthorityเดียวกัน
3. ตรวจfocusedrules/rollback/migration/mobile/build/deployและบันทึกหลักฐาน

## เกณฑ์ตรวจรับ

- [x] AC-01: 12hcap/quantization/splitclaim; frozenoldrateรักษา; gearครึ่งcardเดิม; UI320/390ราคา/rates/icon/ข้อความTowerถูกต้อง
- [ ] AC-02: build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง

## วิธีตรวจและหลักฐาน

focused node tests + isolatedChrome fixture + publicSHA/version proof เก็บtask-100-* ไม่ใช้owneraccount

## Blocker / คำถาม

ไม่มี — ผู้ใช้ยืนยันAFK12ชั่วโมงสำหรับ4–5pulls; ตัวเลขอื่นเป็นassistanttrialbaseline

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026 ตามคำขอต่อเนื่อง

- Local review: 153focused +38contentvalidation(เพิ่มnegativeหนึ่งข้อ) ผ่าน, M0/readiness8/build/type/boundaries/secretsผ่าน. ActualisolatedAuth/API/SQL/Chrome320–390 4groupsผ่าน รวม10boxes+AFK=1POST/1revision,6slotmenus/actualupgrade+reload/store/Tower. Nativeเลขเหลืองลด4groupsผ่าน. รอpublicVercelก่อนAC-02/done.
- ชุดแรกเทสต์บางค่าตามข้อมูลเก่า บันทึกHEADcomparisonและindependentarithmeticในtask-099-oracle-audit.jsonก่อนแก้ เก็บround1/2 ไม่ลดreplay/parity/rollbackchecks. Gear144oracleคงไว้กับlegacy100%snapshot; new50%มีtestแยก. Browserround1ติดanimatedchestclick เปลี่ยนเป็นtouchตามวิธีผู้ใช้ ไม่มีproductpatch.
