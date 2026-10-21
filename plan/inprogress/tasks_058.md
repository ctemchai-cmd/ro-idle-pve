# TASK-058 — ย้ายเซฟส่วนตัวจาก 6173 ไปบัญชี Supabase cloud

Milestone: M4 · ประเภท: เครื่องมือผู้ดูแล/ย้ายข้อมูล · อ้างอิง D-081, TASK-040 และ docs/DEPLOYMENT.md

## งานที่ต้องรอก่อนหน้า

- TASK-021, TASK-022, TASK-040 (done): Auth/owner storage, signed checkpoints, backup/integrity contracts

## เป้าหมายและผลส่งมอบ

เตรียมและย้ายความคืบหน้าปัจจุบันทั้งหมดไป User ID ของบัญชี Supabase ใหม่ โดยตรวจต้นทาง ลงลายเซ็นปลายทาง และตรวจเล่นต่อจริงบน Vercel

## ขอบเขต

- เครื่องมือผู้ดูแลอ่าน checkpoint ต้นทาง ตรวจ hash/signature/version/schema และสร้าง SQL นำเข้าที่จำกัด owner/project
- รักษา AccountState ทุกฟิลด์: roster/team/skills/gear/cards/wallet/ledger/Story/Tower/daily/shop/RNG/pending rewards และ AFK cursor
- เก็บ revision เดิมและ signed history tip ใหม่; history/receipts/backup รุ่นเก่าเก็บใน private local backup ไม่คัดทุก historical revision ไป cloud
- ไม่มี public raw-save upload, ไม่เปลี่ยนเกมหรือ Auth schema, ไม่เพิ่ม sign-up และไม่หยุด 6173
- กู้กรณีเผลอสร้างเซฟปลายทาง revision1 เท่านั้น ผ่าน explicit hash/content/signature guards และ private transactional archive ก่อนแทน

## รายละเอียด

ผู้ใช้เลือกย้ายเซฟเดิมและจะใส่ keys บน Vercel เอง ใช้ operator SQL ใน project ที่ระบุพร้อม Auth user ที่สร้างแล้ว ปกติปลายทางต้องว่าง; กรณีผู้ใช้เผลอสร้างเซฟใหม่ revision1 อนุญาตเครื่องมือ recovery แยกที่ตรวจค่าจริงและสำรองก่อนแทน การส่งซ้ำไฟล์เดิมเป็น no-op ด้วย import receipt และไม่ย้อนความคืบหน้าที่เล่นต่อหลังนำเข้า signing key สำหรับ Vercel ส่งผ่านไฟล์ private เท่านั้น แหล่งจริง export หลังมี Project URL/User ID; ต้องจบ/ถอยไฟต์ก่อน export เพื่อรักษาผลและสิทธิ์รายวันตาม reducer เดิม

## ขั้นตอนทำงาน

1. ตรวจ sign-in/RLS/migrations ที่มี และบันทึกการเลือกย้ายเซฟ
2. ทำ generator ที่ตรวจ source tip และสร้าง atomic SQL พร้อม owner/environment/retry guards
3. ทำ local helper สำรอง game tables/อ่าน context แบบ read-only/เขียน artifacts 0600 ใน .local
4. ตรวจ unit และ PostgreSQL แยกพร้อม API checkpoint/คำสั่งเล่นต่อ
5. ได้ project/account/env แล้ว export เซฟจริง นำเข้า ตรวจ hosted login/summary/เล่นต่อ/reload และเก็บหลักฐาน

## เกณฑ์ตรวจรับ

- [x] AC-01: source tip ถูกต้อง → state/hash/revision คงเดิมและ signature ผูก target UID; source เสีย/ผิด version/active battle ถูกปฏิเสธ
- [x] AC-02: SQL รันใน project/account ที่ถูกต้องและว่าง → atomic save/history/receipt; ผิด marker/ไม่มี Auth user/มีเซฟแล้ว/collision ล้มโดยไม่ทับ; ส่งซ้ำหลังเล่นต่อไม่ย้อนเซฟ
- [x] AC-03: helper เก็บ backup/context/SQL/key file ไว้ใน .local ด้วย private permissions ไม่แก้ source DB และไม่พิมพ์ secrets/state หรือส่งขึ้น Git
- [x] AC-04: fresh PostgreSQL fixture ใช้ migrations จริง นำเข้าแล้ว API checkpoint ตรวจ signature ผ่านและคำสั่งถัดไปบันทึกได้; AFK cursor/ledger/pending rewards รักษาไว้
- [ ] AC-05: hosted Supabase/Vercel จริงใช้ sign-in ไม่มี sign-up บัญชีปลายทางเห็นเซฟเดิมและเล่นต่อ/reload ได้ โดยตรวจ source/target summary และเก็บ source backup
- [x] AC-06: explicit replacement ยอมเฉพาะ revision1/hash/content/history/HMAC ตรงและไม่มีไฟต์ → private archive/save/history/import receipt atomic; failure ย้อนทุกแถว, replay หลังเล่นต่อไม่ทับ, Auth userคงเดิม; frozen source ต้องใช้ validator hashตรงกัน

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | node tests สำหรับ valid/tampered/version/owner/battle inputs | 5 unit tests ผ่าน; state/signature/version/SQL quoting/UUID normalization/replacementguard | ผ่าน self-check |
| AC-02 | PostgreSQL แยก: success/replay/collision/marker/owner/existing/rollback | [SQL report](../evidence/task-058-postgres.json) ผ่าน fresh cluster รวม replay หลังเล่นต่อ/collision/rollback ทั้ง3ตาราง | ผ่าน self-check |
| AC-03 | helper บน disposable local fixture และ permissions/gitignore audit | backup/context/SQL/key file private0600/dir0700, source fingerprintเดิม, ไม่มี key ในSQL, .local ignored; sourceจริงrevision2993exportแล้วแบบread-only | ผ่าน fixture + source exportจริง |
| AC-04 | migrated context ผ่าน API shared handler และคำสั่งถัดไป | checkpoint200/targetsignatureผ่าน equipment.lock commit revision23→24; wallet/farm/ledger/pending/roster/team/story/daily/gacha/shopเดิม | ผ่าน fixture |
| AC-05 | hosted owner login/SQL/browser ก่อนและหลัง reload | Vercelขึ้นแล้ว public health200/anonymous401 และ browser routing7casesผ่านด้วย fixtures; ยังรอ operator import/owner login/เซฟเดิม/reload จริง | ยังไม่ครบ |
| AC-06 | unit5ข้อ + real PostgreSQL replacement/rollback/retry/permissions/legacy snapshot/sharedAPI | [replacement SQL](../evidence/task-058-replacement-postgres.json) 9กลุ่มผ่าน; [actual export](../evidence/task-058-replacement-personal-export.json) revision2993 hash/signatureผ่าน มีbackup/SQLprivate ไม่มีcloudwrite | ผ่าน self-check |

ผู้ตรวจ: Codex self-check เฉพาะเครื่องมือ · วันที่: 21 ตุลาคม 2026 · รอบ review: 2 · ยัง inprogress รอ hosted AC05

## Blocker / คำถาม

สถานะล่าสุด: ผู้ใช้เติม production marker แล้ว เข้าเกมและสร้างตัวใหม่ revision1 โดยไม่ได้ตั้งใจ ได้ metadataจริงของปลายทางแล้ว เตรียมเซฟเดิมล่าสุด revision2993/10ด่านผ่านแบบread-onlyสำเร็จที่ `.local/cloud-transfer/transfer-1792567985108257000/replace-initial-save.sql` ยังไม่ได้รัน cloud SQL หลังนำเข้า14ffต้องกด **สำรองแล้วอัปเดตเซฟ** ไปcontent2c1ac034ผ่านระบบเดิม หัวข้อด้านล่างเป็นลำดับเหตุการณ์เก่า

ได้รับ Project URL/User UID แล้ว ผู้ใช้รายงานรัน6migrationsครบ เตรียม snapshotจริงrevision2933แบบread-onlyและไฟล์privateแล้ว Vercelอยู่ที่ `https://ro-idle-pve.vercel.app` public health/API gate/หน้าเข้าเกมผ่านแล้ว รอตรวจ operatorSQL/import และ hosted owner login/เซฟเดิม/reload จริง ห้ามส่งค่าลับผ่านแชตและยังไม่อ้างว่าย้ายขึ้นcloudแล้ว Content hashใหม่2c1ac034…ต้องใช้ backed-up save.migrate สำหรับ SQL14ffเดิมตามบันทึกด้านล่าง

ผู้ใช้รายงาน checkpoint503 `SAVE_CONTEXT_UNAVAILABLE`; SQLจากฐานจริงยืนยัน markerยังว่าง (`environment/project_ref=NULL`) แต่ context RPCมีแล้ว ต้องรัน create-or-verify production marker ใน SQL Editor แล้วตรวจ checkpointต่อ ไม่มีการแก้หรือเขียนเซฟจากการวิเคราะห์รอบนี้

## บันทึกการทำงานและ review

- 21 ต.ค.2026: ผู้ใช้ยืนยันย้ายเซฟจาก6173 ไม่เริ่มใหม่ ตรวจพบ sign-in/RLS พร้อมแล้ว เริ่มเครื่องมือย้ายแบบ operator

- Local QA: 4 unit tests + typecheck, fresh PostgreSQL6กลุ่ม/helper/shared API ผ่าน; fixture Round1–3 พบUnix socketยาวเกินmacOS103bytes แก้prefix; Round4 พบPath.openไม่รองรับopener แก้ใช้builtin open เก็บ failure evidence แยก ไม่มีการ export/เขียนเซฟส่วนตัวหรือเชื่อม cloud
- ตรวจ Auth ไม่มี sign-up และแก้ข้อความเก่ากรณีไม่มีเซฟให้ชี้ไปสร้างตัวละครที่พร้อมแล้วแทนข้อความว่างานยังไม่เปิด
- ได้targetproject/User UIDจริงแล้ว exportส่วนตัวrevision2933ผ่าน source signature/content/state validation และสำรองgame tablesไว้ใน.local ไม่มีcloudwrite; [รายงานmetadata](../evidence/task-058-personal-export.json) APIkeysยังให้ผู้ใช้ใส่Vercelเองตามที่เลือก

- ผู้ใช้สับสน Secret/legacy: เปลี่ยน env หลักเป็น SUPABASE_SECRET_KEY ให้ตรงชนิด key ใหม่ รองรับชื่อเก่าเพื่อ local stack แต่ปฏิเสธสองชื่อที่ค่าต่างกัน; 20 targeted Auth/transfer tests ผ่าน รวมกัน key รั่วเข้า VITE_ และ modern/legacy compatibility; อัปเดต envexample/docs/private env โดยไม่เปิดเผยค่า

- ผู้ใช้ส่ง hosted Vercel log: env configured ผ่าน แต่ assets:check ล้มเพราะ ignored source files เหลือโฟลเดอร์ว่าง เพิ่ม explicit artifact-only validation ใน build โดยยังตรวจ runtime checksum/selection/manifest ครบ; Python12tests และ isolated production build ผ่าน [หลักฐาน](../evidence/vercel-runtime-build.json) ยังไม่ย้าย cloud/ไม่รีสตาร์ต6173

- D-082: ผู้ใช้ deploy แล้วต้องการ rootเข้าplay/login แทนdemo แก้ routing/return destination และ API native imports จาก user log; Chrome7cases/targeted28tests/officialVercelbuilder+nativeNodeผ่าน [review](../evidence/entry-routes-review.json) Content hashเปลี่ยน2c1ac034…จาก JSON importattribute; SQL14ffเดิมต้องใช้ flow save.migrate พร้อมbackupหลังนำเข้า ไม่ข้ามversionguard ยังไม่อ้าง hosted owner/save proof

- Recovery review2: unit5ข้อ/typecheckผ่าน; fresh PostgreSQL9กลุ่มรวม HMACผิด/เปลี่ยนrevision/hash/activebattle/failureหลังdelete/replayหลังเล่นต่อ/archiveprivacy/Authคงเดิม/sharedAPIผ่าน Frozen source14ffตรวจด้วยsnapshotตรงรุ่นก่อน export2993 ไม่ผ่อนversionguard รอบแรก fixturemarkerยังเป็นproductionจึงล้มก่อนlegacy export แก้fixtureเป็นlocalและเก็บround1report ไม่แตะ6173/cloud
