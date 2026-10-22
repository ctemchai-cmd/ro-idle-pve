# TASK-099 — Enchant แยกแต่ละช่องและ Refine แบบ flat + percent

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-027, TASK-077 (done)

## เป้าหมายและผลส่งมอบ

ตาราง Enchant รายslot โดยคงstablelineids/levels/ledger; Refineเพิ่มpercentเข้าบัคเก็ตเดียว ไม่คูณทบ; shared compiler/server/preview/UI

## ขอบเขตและรายละเอียด

คงเกมเล่นคนเดียวและsharedengine ไม่มีbalancebatch/ownercloudwrite/SQL/envใหม่ ไม่แก้6173

## ขั้นตอนทำงาน

1. อัปเดตcanonicaldata/contractsและsharedreducers
2. ต่อUIอ่านauthorityเดียวกัน
3. ตรวจfocusedrules/rollback/migration/mobile/build/deployและบันทึกหลักฐาน

## เกณฑ์ตรวจรับ

- [x] AC-01: 18linesต่างกัน/serverตรวจslot; +0/1/5/10ต้นปลายผ่านsharedpipeline; migrationรักษาทุน/refund/ระดับ/ของ/การ์ด
- [x] AC-02: build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง

## วิธีตรวจและหลักฐาน

focused node tests + isolatedChrome fixture + publicSHA/version proof เก็บtask-099-* ไม่ใช้owneraccount

## Blocker / คำถาม

ไม่มี — ผู้ใช้ยืนยันAFK12ชั่วโมงสำหรับ4–5pulls; ตัวเลขอื่นเป็นassistanttrialbaseline

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026 ตามคำขอต่อเนื่อง

- Local review: 153focused +38contentvalidation(เพิ่มnegativeหนึ่งข้อ) ผ่าน, M0/readiness8/build/type/boundaries/secretsผ่าน. ActualisolatedAuth/API/SQL/Chrome320–390 4groupsผ่าน รวม10boxes+AFK=1POST/1revision,6slotmenus/actualupgrade+reload/store/Tower. Nativeเลขเหลืองลด4groupsผ่าน. publicVercel3groupsผ่านแล้ว.
- ชุดแรกเทสต์บางค่าตามข้อมูลเก่า บันทึกHEADcomparisonและindependentarithmeticในtask-099-oracle-audit.jsonก่อนแก้ เก็บround1/2 ไม่ลดreplay/parity/rollbackchecks. Gear144oracleคงไว้กับlegacy100%snapshot; new50%มีtestแยก. Browserround1ติดanimatedchestclick เปลี่ยนเป็นtouchตามวิธีผู้ใช้ ไม่มีproductpatch.

Review2/2ACผ่าน · 22ต.ค.2026 · source`1118c2094a7496c9068c95070d798ea12d0ae76c` VercelSUCCESS/publicSHA/API200SIN1/login/noownerwrites. [หลักฐาน](../evidence/task-099-review.json)
