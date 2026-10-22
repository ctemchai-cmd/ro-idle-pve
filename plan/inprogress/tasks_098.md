# TASK-098 — รับกล่องหลายรายการและ AFK ในคำสั่งเดียว

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-022, TASK-027, TASK-036, TASK-038 (done)

## เป้าหมายและผลส่งมอบ

reward.claim รับ claim_ids แบบ atomic; Farm รับทั้งหมด reserve+pay ในครั้งเดียว คง single claim เดิม/receipt/CAS/คิวและของสุ่ม

## ขอบเขตและรายละเอียด

คงเกมเล่นคนเดียวและsharedengine ไม่มีbalancebatch/ownercloudwrite/SQL/envใหม่ ไม่แก้6173

## ขั้นตอนทำงาน

1. อัปเดตcanonicaldata/contractsและsharedreducers
2. ต่อUIอ่านauthorityเดียวกัน
3. ตรวจfocusedrules/rollback/migration/mobile/build/deployและบันทึกหลักฐาน

## เกณฑ์ตรวจรับ

- [x] AC-01: 10กล่องจ่ายรวมครั้งเดียว/replayไม่ซ้ำ; missing/fullbag/overflow ย้อนทั้งชุด; UIไม่มีloopHTTP
- [ ] AC-02: build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง

## วิธีตรวจและหลักฐาน

focused node tests + isolatedChrome fixture + publicSHA/version proof เก็บtask-098-* ไม่ใช้owneraccount

## Blocker / คำถาม

ไม่มี — ผู้ใช้ยืนยันAFK12ชั่วโมงสำหรับ4–5pulls; ตัวเลขอื่นเป็นassistanttrialbaseline

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026 ตามคำขอต่อเนื่อง

- Local review: 153focused +38contentvalidation(เพิ่มnegativeหนึ่งข้อ) ผ่าน, M0/readiness8/build/type/boundaries/secretsผ่าน. ActualisolatedAuth/API/SQL/Chrome320–390 4groupsผ่าน รวม10boxes+AFK=1POST/1revision,6slotmenus/actualupgrade+reload/store/Tower. Nativeเลขเหลืองลด4groupsผ่าน. รอpublicVercelก่อนAC-02/done.
- ชุดแรกเทสต์บางค่าตามข้อมูลเก่า บันทึกHEADcomparisonและindependentarithmeticในtask-099-oracle-audit.jsonก่อนแก้ เก็บround1/2 ไม่ลดreplay/parity/rollbackchecks. Gear144oracleคงไว้กับlegacy100%snapshot; new50%มีtestแยก. Browserround1ติดanimatedchestclick เปลี่ยนเป็นtouchตามวิธีผู้ใช้ ไม่มีproductpatch.
