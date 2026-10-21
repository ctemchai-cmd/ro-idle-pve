# TASK-063 — ลดเวลารอทุกคำสั่งบันทึกบน cloud

Milestone: M4 · อ้างอิง D-087

## งานที่ต้องรอก่อนหน้า

- TASK-021, TASK-022, TASK-025, TASK-060 (done)

## เป้าหมายและผลส่งมอบ

ทุกคำสั่งใช้sharedsavepath กรณีปกติ POSTครั้งเดียวได้receiptและverifiedcheckpointพร้อมกัน ไม่ต้องGETreceiptซ้ำและGETcheckpointอีกรอบ เพิ่มServer-Timingสำหรับหาความช้าที่เหลือ ไม่ทำoptimisticwalletหรือหน่วงsaveเป็นbatch

## ขอบเขตและรายละเอียด

- คงAuthgetUser/CAS/history/signature/UUID-before-network/backup/restore/offlineguards
- serverแนบcheckpointหลังcommitโดยอ่าน/verifyผ่านเส้นทางเดิม หากอ่านไม่ได้ยังคืนreceiptและclientreconcile ไม่ทำcommandซ้ำ
- เก่า/ใหม่สื่อสารได้ fallbackreceipt-onlyยังใช้GETcheckpoint และใช้knownreceiptแทนlookupซ้ำ Recoveryที่ไม่รู้ผลยังตรวจreceiptตามเดิม
- pinregionSingaporeตามผู้ใช้และผลheadersจริง ไม่เปลี่ยนcontenthash/SQL/6173

## ขั้นตอนทำงาน

1. วัดpublicAPIregion/latency และบันทึกจำนวนrequestsก่อนแก้
2. เพิ่มoptionalcheckpointreplyในsharedAPI/browser/controllerและtimings
3. ตรวจsingle-requestทุกmutation, lostresponse/stale/foreign/invalidcheckpoint/legacyfallback/backupmigration และactualisolatedAuth/Chrome
4. build/deploy/hostedreadonlyตรวจheaders/bundle เก็บหลักฐานและhandoff

## เกณฑ์ตรวจรับ

- [x] AC-01: confirmedcommandบนsharedpathใช้POSTเดียวในกรณีปกติ ได้DBverifiedcheckpointโดยไม่GETreceipt/checkpointซ้ำ; legacyfallbackไม่lookupknownreceipt
- [x] AC-02: UUIDpersistก่อนส่ง, response loss/retryจ่ายครั้งเดียว; wrongowner/stalerevision/hash/schema/signatureและoffline/readonlyไม่ถูกยอมรับ; recovery/migration/battleยังถูกต้อง
- [x] AC-03: actualisolatedAuth/Postgres/Chromeทดสอบหลายmutationและnetworkdelay วัดrequestcount/latencyก่อนหลังด้วยbudgetเดียวกัน ไม่ใช้ownercloudsave
- [ ] AC-04: build/type/boundaries/secretsผ่าน contenthash768e12a4เดิม; deployedAPIมีServer-Timing/region และhostedsmokeผ่าน ไม่เพิ่มSQL/envหรือrestart6173

## วิธีตรวจและหลักฐาน

Unit/sharedAPI+browserports, isolatedrealstackและChrome; productionตรวจpublichealth/anonymousgate/bundleเท่านั้น ไม่อ้างว่าอ่านเซฟจริงหรือวัดlatencyของมือถือผู้ใช้แล้ว

- 37targetedtestsผ่าน: API/auth/recurring/backup รวมforeign/stalecheckpoint/response-loss/maintenanceguards
- [actualChrome4กลุ่ม](../evidence/task-063-save-latency-live.json): creation/level/skill/loadout/equipment/teamแต่ละครั้งPOSTเดียว; equal120msdelay/3pairedpartycommands median477→169ms เป็นcontrolledbenchmarkไม่ใช่latencyเครื่องผู้ใช้
- Droppedreplyหลังcommit→receipt/checkpointreconcileโดยไม่POSTซ้ำ; receipt-onlyfallback2requests; corruptinlinehashถูกปฏิเสธแล้วreconcile
- Buildผ่าน contenthash768e12a4…เดิม; [actualbattleChrome4กลุ่ม](../evidence/task-063-cadence-live.json) ผ่านstart/finish/speed/reward/offline/reloadไม่มีmidfightPOST รอhosteddeployment/readonlyproof
- Failedharnessround1–2: Playwrightrequest.methodใช้propertyแทนmethod()ทำให้faultinjectionไม่เข้า แก้harnessเท่านั้นและเก็บfailureแยก รอบแรกskilltarget1เป็นstarterเดิมจึงแก้fixtureเป็นLv10/skill2ให้upgradeจริง ไม่เปลี่ยนproduct/เกณฑ์ให้หลบfail

## Blocker / คำถาม

ไม่มี ต้องวัดremaininglatencyจริงหลังdeploy ไม่สัญญาว่าทุกครั้งจะตอบภายในตัวเลขคงที่
