# TASK-177 — Recover oversized bulk-sale pending commands

Milestone: M4 · D201

## งานที่ต้องรอก่อนหน้า
TASK-176 (done).

## ขอบเขต
User confirmed COMMAND_TOO_LARGE on phone PWA after selecting many equipment items for salvage; desktop opens the same save. Command schema allows500IDs of120characters, but API rejected text.length>16384 before receipt creation. Phone retained the exact pending sale and retried413 before loading cloud. Raise a bounded HTTP budget to256KiB UTF-8 in actual API and local gateway, sized for legal500ID envelopes. Keep one atomic command/receipt/revision and existing pending UUID/receipt/CAS reconciliation. No reset, request splitting/discard, owner Auth/cloud reads/writes or save migration.

## ขั้นตอน
1. Expose only bounded public error codes on existing HUD/settings/splash; owner confirmed413 and bulk-sale trigger.
2. Share transport256KiB constant in server persistence module; byte-count request and keep structured413 above budget. Health reports safe public limit for deployment verification.
3. Reproduce old413 with500IDs, verify original cached UUID resumes after upgrade, complete500sale once, reopen/no duplication, response loss, stale revision, locked/equipped atomicity; validate card batches and worst UTF-8 IDs too.
4. Native browser cache/ports/controller plus actual signed Fetch API/shared rules on loopback fixture, root/filtered/M0/public release. Owner reconnects existing phone save; actual owner confirmation remains explicitly pending.

## เกณฑ์ตรวจรับ
- [x] AC-01: Confirmed413 bulk-sale cause reproduced; diagnostic exposes bounded public identifier only.
- [x] AC-02: Legal500item/card requests fit finite byte limit; exact oldpending recovery/receipts/CAS and no partial/duplicate sale verified without reset or discard.
- [x] AC-03: Focused/native/build/public pass with five fingerprints unchanged; actual owner reconnect confirmation explicitly recorded separately.

## ผลตรวจ
Source`547373cbc`ขึ้นVercelSUCCESS/public4groups/27bundleSHA/mobile320390/fivefingerprints exact/healthbodybudget262144ผ่าน. ไม่SQL/env/migrateเซฟ/ownerAuthหรือcloudwrite. [ผลตรวจ](../evidence/task-177-review.json).

101uniqueTS (initialmoduleownerfinding corrected;21affectedrechecksผ่าน),6bulkregressions/nativePWA3groups:413→originalUUID500sale once→reopenno duplicate. Actualเจ้าของPWAยืนยันเข้าได้ยังรอคำตอบ; implementationและfixture recoveryผ่าน ไม่ได้อ้างว่าagentแก้ข้อมูลคลาวด์ให้โดยตรง.
