# TASK-090 — ปลดวงจรรายการค้างที่ขวางการอัปเดตเซฟ

Milestone: M4 · D-119

## งานที่ต้องรอก่อนหน้า

- TASK-022, TASK-040, TASK-088 (done)

## เป้าหมายและขอบเขต

ผู้ใช้กดสู้บอสแล้วค้าง; ยืนยันภายหลังว่าหน้าจอเป็น MaintenancePanel และกดสำรองแล้วอัปเดตเซฟได้ WRITER_NOT_READY. พบreconnectเก็บpendingไว้แม้มีreceiptยืนยันแล้วแต่checkpointรุ่นเก่าส่งmigrationpreviewแทนcheckpointปกติ; อีกกรณีno receipt/คำสั่งถูกversiongateปฏิเสธแต่pendingยังขวางmaintain.

ให้ตรวจUUIDเดิมก่อน: confirmedreceiptปลดpendingได้ต่อเมื่อmigrationpreviewrevisionไม่ต่ำกว่าreceipt/checkpoint; definite409CONTENT_VERSION_MISMATCHเก็บexactcommandในlocalrejectedForUpdateก่อนปลดแล้วอ่านmigrationpreview ไม่ replay intent บนกติกาใหม่. Network/timeout/401/5xx/stalepreviewยังเก็บpendingเดิม. ปุ่มmaintenanceต้องตรวจรายการค้าง/สิทธิ์writerก่อนส่งmigrationใหม่ ไม่วนข้อความทั่วไป. NoSQL/serverrules/accountstate schema/ราคา/ธาตุ/เกมเปลี่ยน.

## ขั้นตอนการทำ

1. Reproduce committed/uncommitted pending + old signed checkpoint/migrationpreview ด้วยproductioncontroller/API.
2. แก้ผลreceipt/negativeversionresponseให้ครบลำดับและสำรองintentก่อนปลด รวมstoragefailureและno-writer UI.
3. ทดสอบactualdisposableAuth/API/SQL/mobileChrome: oldpendingก่อนmigration, lookupfail/retry, migratedreplyloss/UUIDreplay, exact signed backup/progress.
4. Build/push/Vercel/publicproofแล้วreviewdone. Userขอreadonlyaccountcheck; auto-reviewปฏิเสธprivateenvaccess จึงขอSQLเฉพาะrevision/hash/inbattleจากผู้ใช้ ไม่เปิดkeysหรือแก้cloudเอง.

## ผลส่งมอบ

- SaveController/backup protocol version-refusal archive และMaintenancePanel pending-aware action
- Focused regressions + actualsignedmigration/localbrowser/public evidence

## เกณฑ์ตรวจรับ

- [ ] AC-01: pendingที่มีreceiptยืนยันแล้วถูกปลดเมื่อmigrationpreviewrevisionถึงreceipt; no-receiptคำสั่งที่APIตอบ409CONTENT_VERSION_MISMATCHเก็บUUID/paramsเดิมในlocalbackupแล้วไม่replayข้ามรุ่น สามารถกดbackup+migrateสำเร็จหนึ่งครั้งพร้อมsignedbackupเดิมครบ
- [ ] AC-02: unknown/network/timeout/401/5xx/stalepreview/storagefailureไม่ล้างpendingหรือหักของซ้ำ; maintenanceแสดงตรวจผลรายการค้างหรือwriterแทนWRITER_NOT_READYรัว และmigratereplyloss/retryใช้UUIDเดิม ไม่สร้างmigration/backupsซ้ำ
- [ ] AC-03: Focused controller/API/backup/build/type/boundaries/secretsและactualdisposableAuth/API/SQL/mobile320/390 plusVercelpublicproofผ่าน คงwallet/roster/items/paidledger/dailyquotaตามmigrationเดิม ไม่มีownercloudwrite/privateenvread/6173restart/SQL/env/content/packเปลี่ยน

## วิธีตรวจและหลักฐาน

Existing save-backup/recurring-save/auth/save-roundtrips + task090 actual isolated signed old save with pending fixture. ScopeactualowneraccountยังรอsanitizedSQLจากผู้ใช้ ไม่อ้างตรวจบัญชีสำเร็จจากfixture.
