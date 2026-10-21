# TASK-061 — เริ่มเกมใหม่ล้างดันรายวัน และซ่อมเซฟที่ค้างจากรีเซ็ตเดิม

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-085, TASK-040

## งานที่ต้องรอก่อนหน้า

- TASK-036, TASK-040 (done): daily records และ backup-before-write maintenance

## เป้าหมายและผลส่งมอบ

ผู้ใช้เริ่มใหม่เป็นLv1แล้วดันรายวันต้องเริ่มใหม่ด้วย เผยแพร่บนVercelตามคำแก้ล่าสุด ไม่เขียนฐาน6173

## ขอบเขตและรายละเอียด

- account.reset ล้างdaily_recordsทั้งหมด (attempts/phase/HP/chests) ของเกมใหม่ โดยมีbackupก่อนตามเดิม
- เซฟเก่าที่ผ่านresetแต่ดันยังไม่ปลดล็อกและมีdaily_records จะซ่อมผ่านsave.migrateพร้อมpreviewและbackup ล้างเฉพาะrecord/pendingdailyที่ค้าง ไม่ล้างตัวละคร/ของ/เงินหรือดันของเกมที่ปลดล็อกแล้ว
- Undo restoreยังใช้guardเดิมเพื่อรักษาตัวนับที่ใช้ไป ไม่เพิ่มปุ่มresetdailyแบบไม่จำกัด ไม่แตะSupabase6173/cloudโดยตรง

## ขั้นตอนทำงาน

1. แยกnew-game policyจากrestore guardเดิม
2. เพิ่มrepair migrationสำหรับcarry-overก่อนunlockและทดสอบpreservation/backup
3. ทดสอบmaintenance/browser migration/build และdeployVercel

## เกณฑ์ตรวจรับ

- [x] AC-01: เริ่มใหม่จากเซฟมีdailyprogress → rosterLv1/Storyใหม่และdaily_recordsว่าง มีbackupก่อนและredo receiptไม่ทำซ้ำ; restoreยังมีcountersจากเกมที่กู้
- [x] AC-02: locked legacy reset saveมีdailyprogress → previewไม่เขียน; migrateมีbackupก่อนแล้วล้างเฉพาะdailycarryover ตัวละคร/เงิน/ของ/Story/Towerเดิม; unlocked saveคงdailyprogress
- [x] AC-03: build/migration testsผ่านและเผยแพร่บนVercel ไม่มีการอ่านloginหรือแก้DB6173 และไม่อ้างว่าซ่อมcloudsaveก่อนเจ้าของกดmigration

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | save-backup.test.ts reset/restore/replay/CAS | [local review](../evidence/task-061-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |
| AC-02 | signed legacy fixture preview/backup/migrate + browser | [local review](../evidence/task-061-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |
| AC-03 | typecheck/build/hosted smoke + git scope audit | [local review](../evidence/task-061-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |

ผู้ตรวจ: Codex self-review · วันที่: 21 ต.ค.2026 · รอบ review: 2

## Blocker / คำถาม

ผู้ใช้แก้เป้าหมายจาก6173เป็นVercelก่อนมีการแตะฐานข้อมูลจริง ไม่มีcloudserverkeysบนเครื่องจึงใช้owner migration flow แทนการเขียนเซฟcloudตรง

## บันทึกการทำงานและ review

- 45 targeted save/mode testsผ่านและisolatedupstreamAuth/PostgREST/PostgreSQL/Chromeจริง ไม่มีownercloudwrite/6173write
- Browser3กลุ่ม: legacylockedcarryover→previewไม่เขียน→backupก่อนrepair→stateอื่นเดิม; actualtypedRESETล้างดัน/ตัวละครLv1และbackupครบ; reloadคงผล
- Testfixtureรอบแรกchapter_snapshot=1ผิดschemaขั้นต่ำ2 แก้เป็น2ไม่ผ่อนschema; buildพบassertdeepEqual([])ทำTSnarrowingเป็นnever[]หลังawaitrestore แก้assertlength0 เก็บfailurelogก่อนแก้

- Source5215676f8 push main/Vercelstatussuccess ActualproductionChrome shellมีbattle.finish/ไม่มีbattle.advanceหรือschedulerเก่า และข้อความresetdailyใหม่; health200/ok/content768e12a4ตรงกัน ไม่มีownercloudwrite การซ่อมเซฟจริงรอเจ้าของกดยืนยันmigrationตามflow
