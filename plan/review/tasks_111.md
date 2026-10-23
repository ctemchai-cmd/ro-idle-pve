# TASK-111 — บัญชีเดียวมี10เซฟแยกกัน

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · D143/design39

## งานที่ต้องรอก่อนหน้า
TASK-022, TASK-040, TASK-063, TASK-110 (done)

## เป้าหมายและขอบเขต
ล็อกอินด้วยบัญชีเดิมแล้วเลือก1–10เซฟ;แต่ละช่องสร้างตัวหลักคนละอาชีพ/ทีม/กระเป๋า/AFK/Story/Tower/daily/backup/revision/receiptsแยกกัน. สลับในตั้งค่า. เซฟเดิมช่อง1เก็บID/state/signature/ประวัติ/backupครบ. ไม่มีส่งของ/cloneข้ามเซฟและไม่เปลี่ยนสูตรเกมหรือassets.

## รายละเอียด
เก็บPK account_id เดิมเป็นsaveidentity;เพิ่มgame_saves.owner_id/save_slot,uniqueowner+slot,FKownerAuth. ช่อง1ID=AuthUID;2–10derivedUUID namespaceMD5ของowner+slot(เป็นidentifierไม่ใช่auth). APIตรวจJWTก่อนเลือกslot1–10จากheaderและderiveIDเอง,ไม่รับowner/saveIDจากpayload. ทั้งRLSและserverguardsผูกowner;ไม่มีextraDBroundtripต่อmutation. SQL008รองรับold14argsและnew16args;ก่อนติดตั้งSQLใช้เซฟเดิมได้พร้อมข้อความยังไม่เปิดหลายเซฟ. Pureengine/state/cost/AFK12hเดิม.

## ขั้นตอน
1. เขียนdesign/migrationแบบtransaction/backfillเฉพาะowner metadata;testupgradeจากoldSQLของบัญชีทดสอบจริง
2. เพิ่มowner-scopedAPIlisting/selector1–10/creation/queryheaders;คง2RPCของคำสั่งทั่วไป
3. แยกports/backup/lockด้วยsaveID;disposeoldcontroller/audioก่อนสลับ;กันswitchระหว่างsaving/battle
4. UIเลือกเซฟmobile/สร้างใหม่/กลับ/ตั้งค่า/แสดงjob-level-stage-updated;fallbackoldSQLไม่ทับเซฟ
5. ทดสอบSQL/RLS/receipt/reset/backup/oldsignature/browser/lifecycle/build/publicก่อนส่งSQL008ให้เจ้าของรันจริง

## เกณฑ์ตรวจรับ
- [x] AC-01:SQL008ย้ายlegacyrowเป็นslot1โดยstate/hash/revision/history/receipts/battle/backupเดิมเหมือนทุกไบต์;legacy14argsยังสร้างได้;rerunSQL008ไม่เปลี่ยนข้อมูล;max10/unique/ownerFK/cascade/RLSownerครบ
- [x] AC-02:หนึ่งownerสร้างครบ10เซฟคนละidentity;JWTowner+slotderiveเท่านั้น;0/11/invalid400,anonymous401,otherownerอ่านเขียนไม่ได้;UUIDเดิมแยกต่อslot/replayไม่จ่ายซ้ำ;reset/restore/migrate/backup/farm/battle/rightsไม่ข้ามช่อง;mutationยัง2RPC/ไม่มีlistingต่อclick
- [x] AC-03:หลังloginแสดง10ช่องและเลือกสร้าง/เล่นได้,320/390ไม่ล้น;job/level/stageเวลาแสดงจริง;Settingsสลับได้และแสดงช่องปัจจุบัน;ห้ามสลับระหว่างsaveหรือbattle;empty/migration/errorกลับchooserได้;reloadกลับchooserเลือกเดิมยังอยู่
- [x] AC-04:localbackup/lock/pending/receipt/lateHTTPresponseแยกsaveID;slot1keyเก่าใช้ต่อ;dispose/reconnect/switchไม่เขียนสลับ;AFKแต่ละเซฟ12hแยก;oldSQLfeaturefallbackเล่นslot1ต่อได้
- [ ] AC-05:targeted/fullappropriate/M0/readiness/build/type/boundary/secrets+freshactualAuth-API-Postgres/localbrowserผ่าน;publicdeploy/login/unauthorizedAPI/version/bundleSHAผ่าน. SQL008พร้อมให้ผู้ใช้รัน;ยังไม่อ้างว่าcloudเปิด10เซฟจนยืนยันติดตั้ง/ใช้งานจริง

## วิธีตรวจและหลักฐาน
TASK111 unit/freshSQLupgrade/RLS/API/Chrome320-390/publicread-only;ไม่อ่านenvส่วนตัวหรือแตะownercloud/6173. เก็บevidence task-111-*ก่อนdone. SupabaseSQLจริงต้องผู้ใช้ติดตั้งเพราะไม่มีDBaccessในsession.

## Blocker / คำถาม
ผู้ใช้ยืนยันรันSQL008สำเร็จแล้ว23ต.ค.2026;ไม่มีDBcredentialsในsessionและไม่ได้เข้าownercloud. รอsourcepush/Vercel/publicproofก่อนdone.

## ผลตรวจ23ต.ค.2026
555TS/33targeted/M0/readiness8/buildผ่าน. FreshAuth/Postgres001–007→008twice/API/Chrome320–390ผ่าน4groups;legacybytes/signature/childrenครบ,10saves/sameUUID replay/RLS/childcascade/reset+restoreisolation,save+battleguards,maintenance/errorกลับchooser,late-response/pending/12hแยก. ภาพchooser320และMage320ตรวจแล้ว. AC05เหลือpublicdeployment. [review](../evidence/task-111-review.json) · [local](../evidence/task-111-local-stack.json) · [source](../evidence/task-111-source-audit.json)
