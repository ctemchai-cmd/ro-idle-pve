# Deploy จาก GitHub ไป Vercel และ Supabase

Repository นี้มี source code และคลัง assets เต็ม ส่วน `runtime/ro/` เป็น artifact ที่คัดแล้วสำหรับเว็บ Build ตรวจ checksum และคัดเฉพาะ artifact นี้ไป `dist/ro/` ไม่คัดคลัง `assets/ro/` ทั้งหมดไปเว็บ `src/generated/` และ `dist/` สร้างระหว่าง build ไม่เก็บ credentials หรือฐานข้อมูล `.local/play` ใน Git

เอกสารนี้เป็นขั้นตอนเตรียม deploy ยังไม่มี hosted Supabase/Vercel verification; TASK-043/045/046 คงเกณฑ์ตรวจรับเดิม

## 1. Supabase

1. สร้าง project แล้วรัน SQL ทุกไฟล์ใน `supabase/migrations/` ตามชื่อเรียงจากเก่าไปใหม่ ปัจจุบันมี6ไฟล์ รวม `202610200006_save_backups.sql` อย่ารัน `supabase/tests/bootstrap_local_postgres.sql` บนบริการจริง
2. เพิ่ม marker ด้วย SQL Editor ของ project ที่เพิ่งสร้าง โดยแทน `YOUR_PRODUCTION_PROJECT_REF`:

   ```sql
   insert into public.game_deployment(singleton, environment, project_ref)
   values (true, 'production', 'YOUR_PRODUCTION_PROJECT_REF');
   ```

3. สร้างผู้ใช้ด้วยอีเมล/รหัสผ่านใน Auth Dashboard ปิด **Allow new users to sign up** และ anonymous sign-ins สำหรับเกมส่วนตัว หน้าเกมมี sign-in/กู้รหัสผ่าน ไม่มี sign-up คัดลอก **User UID** ของบัญชีนี้เมื่อจะย้ายเซฟเดิม (UUID นี้เป็นคนละตัวกับ project ref)
4. หลังทราบโดเมน Vercel ตั้ง Auth Site URL เป็น `https://YOUR_DOMAIN/auth` และเพิ่ม URL นี้ใน redirect allowlist สำหรับการกู้รหัสผ่าน

หากจะใช้ Preview ที่บันทึกเกมได้ ให้ใช้ Supabase อีก project หนึ่ง พร้อม marker `preview` และ `SUPABASE_TEST_PROJECT_REF` ของ project นั้น ไม่ใช้ production project ร่วมกัน รายละเอียด RLS/PKCE และการทดสอบอยู่ใน [SUPABASE.md](SUPABASE.md)

## 2. Vercel

Import `ctemchai-cmd/ro-idle-pve` เลือกสาขา `main`, Root Directory เป็นราก repository และ Node.js24 ตาม `package.json` มี `vercel.json` กำหนด Vite, install `npm ci`, build `npm run build`, output `dist` และ route `/play`, `/auth`, `/roster`, `/demo`, `/api/*` แล้ว Entry ของ API คือ `api/index.ts` ที่ใช้ Web Standard `fetch` handler

หน้า `/` เข้า `/play`; ถ้ายังไม่มี session จะไป `/auth?next=...` และกลับหน้าเกมที่ขอไว้หลัง login ส่วน `/auth` โดยตรงยังเป็นหน้าจัดการบัญชี/ออกจากระบบ เดโมแยกไว้ที่ `/demo` ไม่ใช่หน้าแรก API ใช้ `rewriteRelativeImportExtensions` ให้ Vercel emit import `.js` ที่ตรงกับไฟล์ใน function และ JSON import ระบุ `with { type: 'json' }` สำหรับ native Node

หากเซฟนำเข้าผูก content hash รุ่นเก่า หน้าเกมจะเสนออัปเดตเซฟด้วย preview/backup ตาม TASK-040 ใช้ flow นี้ก่อนเล่นต่อ ไม่แก้ content hash หรือ signature ด้วยมือ การเปลี่ยน import ฝั่ง content loader ก็เปลี่ยน implementation fingerprint ได้แม้ข้อมูลบาลานซ์เท่าเดิม

ตั้ง Environment Variables ใน **Production** ก่อน deploy:

| ชื่อ | ค่า |
| --- | --- |
| `VITE_APP_ENV` | `production` |
| `APP_ENV` | `production` |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_URL` | URL เดียวกัน |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key ที่ขึ้นต้น `sb_publishable_` จาก Supabase Settings → API Keys |
| `SUPABASE_SECRET_KEY` | Secret key ที่ขึ้นต้น `sb_secret_` จากหน้าเดียวกัน ใช้เฉพาะ server |
| `SUPABASE_PRODUCTION_PROJECT_REF` | Project ref ที่ตรง URL และ deployment marker |
| `SAVE_SIGNING_KEY` | ค่าสุ่มอย่างน้อย32ตัวอักษร เก็บให้คงเดิมระหว่าง redeploy |

อย่าตั้ง server secret ด้วยชื่อขึ้นต้น `VITE_` และอย่า commit ค่าจริงลงไฟล์ เปลี่ยน browser environment แล้วต้อง build ใหม่ สำหรับย้ายเซฟเดิมจาก6173ให้ใช้ `SAVE_SIGNING_KEY` จากไฟล์ private ที่ตัวช่วยเตรียมให้ตามขั้นตอน4 เพื่อให้ลายเซ็นของเซฟตรงกัน

การตั้งค่าใหม่ใช้ **Publishable + Secret** ตามตารางนี้ Legacy `anon/service_role` เป็นกุญแจ JWT รุ่นเก่า หน้าที่ตรงกับ Publishable/Secret ตามลำดับ โค้ดยังรับชื่อ `SUPABASE_SERVICE_ROLE_KEY` เดิมเพื่อรองรับ local stack แต่ผู้ตั้งค่าใหม่ใช้ชื่อ `SUPABASE_SECRET_KEY` ให้ตรงชนิด key หากตั้งสองชื่อพร้อมกันด้วยค่าต่างกัน build จะปฏิเสธเพื่อป้องกันเลือกผิดค่า

Preview แบบเชื่อมฐานทดสอบใช้ `VITE_APP_ENV=preview`, `APP_ENV=preview`, URL/keys ของ project แยก และ `SUPABASE_TEST_PROJECT_REF` ตรง marker `preview` หากไม่ตั้ง Auth environment เลย เว็บจะแสดงสนามทดลองและสถานะยังไม่เชื่อมบัญชี ไม่สร้างเซฟจำลอง

`.vercelignore` กันคลังต้นทาง/หลักฐาน/ไฟล์ส่วนตัวออกจาก build input ทั้ง Git integration และ CLI แต่ยังเก็บ `runtime/ro/`, `plan/data/` และ build tools ครบ Git integration clone repository ก่อนแล้วจึงลบไฟล์ที่ ignore ซึ่งอาจเหลือโฟลเดอร์ว่าง Output ที่ให้ผู้เล่นโหลดคือ `dist` และ API function

`npm run build` ใช้ `assets:check:runtime` ตรวจรายการไฟล์/checksum/manifest/asset-selection ของ artifact โดยไม่ต้องมีคลังต้นทาง ส่วน `npm run assets:check` ใช้บนเครื่องที่มีคลังเต็มเพื่อตรวจเทียบต้นทางเพิ่ม ก่อน commit การเปลี่ยน assets ให้รัน `npm run assets:build` แล้ว `npm run assets:check` และ commit ชุด `runtime/ro/` ที่สร้างใหม่ด้วย ไฟล์ env สำเนาชื่อ `*.env` ถูกกันออกจาก Git และ Vercel เช่นเดียวกับ `.env.*`

## 3. ตรวจหลัง deploy

เปิด `/api/health`, `/auth` และ `/play` จาก URL จริง ตรวจ login/จัดทีม/เริ่มบอส/รับรางวัล/reload และลองเปิด deep link ในแท็บใหม่ ตรวจ Network ว่าภาพและเสียงโหลดจาก `/ro/<pack_hash>/...` ไม่มี404และไม่ได้โหลดคลังต้นทาง ทดสอบกับ project แยกก่อนให้บัญชีหลักใช้งาน

ถ้า checkpoint คืน `SAVE_CONTEXT_UNAVAILABLE` ให้ตรวจ `select environment, project_ref from public.game_deployment;` และ `select to_regprocedure('public.game_load_context(uuid,text,text)');` ก่อน Migrations สร้างตารางและ RPC แต่ไม่เติม marker; ตารางว่างต้องตั้ง production marker ตามขั้นตอน1 ด้วย SQL Editor แล้วตรวจ `game_assert_environment` ให้ได้true การอ่าน health200ไม่ยืนยันว่า marker พร้อม APIมีสิทธิ์อ่าน markerเท่านั้น ไม่ใช้การปิด environment guard หรือ RLS แทนการตั้งค่า

เซฟส่วนตัวบน6173ยังอยู่ในฐานเดิมบนเครื่อง การ push repo ไม่ย้ายเซฟนั้นไป Supabase cloud การสำรอง/ย้ายเซฟต้องใช้ขั้นตอน migration/restore ของเกมพร้อม signing key ที่สอดคล้องกัน

## 4. ย้ายเซฟเดิมจาก 6173 (TASK-058)

ตัวช่วยสำหรับผู้ดูแลเตรียมไฟล์ไว้ใช้กับ SQL Editor ของ project ที่เพิ่งตั้งค่า ไม่มี endpoint อัปโหลดเซฟดิบบนเว็บ ขั้นตอนนำเข้าจริงรอ Project URL, User UID และการตรวจ hosted deployment

1. รัน migrations6ไฟล์และ deployment marker ตามด้านบน สร้างบัญชี Auth ให้เรียบร้อย ให้บัญชีปลายทางยังไม่มีเซฟเกม หากหน้า `/play` แสดงสร้างตัวละคร ให้รอย้ายเซฟก่อน
2. จบหรือถอยไฟต์บน6173แล้วหยุดเล่นระหว่างย้าย จากเครื่องที่มีเซฟเดิมรัน (แทน URL/UID):

   ```sh
   python3 scripts/prepare_local_cloud_transfer.py \
     --project-url https://YOUR_PROJECT_REF.supabase.co \
     --target-user-id YOUR_AUTH_USER_UUID
   ```

3. ตัวช่วยสำรอง game tables และอ่าน signed checkpoint แบบ read-only สร้างโฟลเดอร์ `.local/cloud-transfer/transfer-.../` ซึ่งถูก Git ignore ไฟล์ทุกไฟล์0600 และโฟลเดอร์0700 ไม่พิมพ์ key หรือ state ลง log:

   - `local-game-backup.dump`: สำรองข้อมูลเกมเดิมพร้อม history/receipts เก็บไว้ในเครื่อง
   - `context.json`: snapshot เดิมและ signed tip สำหรับตรวจย้อนหลัง
   - `import.sql`: นำเข้าเฉพาะ state ปัจจุบัน, signed history tip และ import receipt ที่ผูกกับ User UID ใหม่
   - `vercel-signing.env`: ค่า `SAVE_SIGNING_KEY` ที่ต้องใส่ใน Vercel ให้ตรงก่อนเปิดเกม ไม่ต้องส่งในแชตหรือ commit
   - `summary.json`: revision/hash/target สำหรับตรวจเทียบ

4. ตั้ง `SAVE_SIGNING_KEY` บน Vercel ให้ตรงไฟล์ private และ redeploy เมื่อ env ครบ จากนั้นรัน **เฉพาะ `import.sql`** ใน SQL Editor ของ Supabase project ปลายทาง อย่านำ full local database dump มารันแทน
5. SQL ตรวจ marker/User UID/ปลายทางว่างและนำเข้าทั้ง transaction การรันไฟล์เดิมซ้ำเป็น no-op แม้เล่นต่อแล้ว ส่วนการนำเข้าอีกเซฟหรือผิด project จะถูกปฏิเสธ ตรวจ state hash และ revision ของ `game_saves` เทียบ `summary.json` แล้ว sign-in `/auth` เปิด `/play` เล่นต่อและ reload ให้กลับมาเซฟเดิม

State ทุกฟิลด์รวม ledger ราคาเดิม/RNG/AFK cursor/pending rewards ยกไปทั้งก้อนโดยไม่รวมยอดเงินสองเซฟ ไม่เริ่มบอสย้อนหลัง History/receipts/backup รุ่นเก่าทั้งหมดเก็บใน local backup; cloud เริ่มที่ revision เดิมพร้อม tip ที่ลงลายเซ็นใหม่ การเล่นบน6173หลัง export ไม่ตามไป cloud อัตโนมัติ ให้ใช้ cloud ต่อหลังตรวจย้ายผ่านแล้ว

หาก source เป็น frozen snapshot คนละ content hash กับโค้ดปัจจุบัน helper จะตรวจผ่าน validator ของ snapshot ที่ตรงกับเซฟนั้น ไม่แก้ hash หรือลายเซ็นเอง และปฏิเสธ snapshot ที่ไม่ตรง หลังนำเข้า cloud รุ่นใหม่อาจแสดงหน้ารออัปเดตเซฟ ให้กด **สำรองแล้วอัปเดตเซฟ** เพื่อใช้ `save.migrate` พร้อม backup ก่อนเล่นต่อ

### กู้กรณีเผลอสร้างเซฟใหม่ก่อนย้าย

โหมดปกติยังปฏิเสธปลายทางที่มีเซฟ การแทนเซฟที่เพิ่งสร้างทำได้เฉพาะ **revision1** ด้วยเครื่องมือผู้ดูแล พักทั้งสองเว็บก่อน ตรวจ revision/state_hash/content_hash ของปลายทางด้วย read-only SQL แล้วเพิ่ม flags ให้ helper:

```sh
python3 scripts/prepare_local_cloud_transfer.py \
  --project-url https://YOUR_PROJECT_REF.supabase.co \
  --target-user-id YOUR_AUTH_USER_UUID \
  --replace-initial-revision 1 \
  --replace-initial-state-hash TARGET_STATE_HASH \
  --replace-initial-content-hash TARGET_CONTENT_HASH
```

ใช้ **replace-initial-save.sql** จากโฟลเดอร์ที่เพิ่งสร้างแทน import.sql ตัว SQL ตรวจ project/owner/revision/hash/content/history/signature ด้วย signing key เดียวกับ Vercel และปฏิเสธ active battle จากนั้น archive ทุกแถวเกมของปลายทางใน `ro_operator_archive.save_replacements` ก่อนแทนที่ อยู่ใน transaction เดียวกัน Auth user ไม่ถูกลบ Archive แยก schema ที่ไม่เปิดผ่าน API, เปิด RLS และถอนสิทธิ์ anon/authenticated/service_role; ต้องเปิดผ่าน SQL Editor ของเจ้าของ project

ถ้าเกิดข้อผิดพลาดกลางทางทุกขั้นจะ rollback การรันไฟล์เดิมซ้ำหลังเล่นต่อเป็น no-op และไม่สร้าง archive ซ้ำ `TARGET_SAVE_CHANGED` หมายถึงปลายทางเปลี่ยนแล้ว ต้องตรวจใหม่ก่อนสร้างไฟล์; `TARGET_SIGNING_KEY_MISMATCH` หมายถึง signing key ไม่ตรง ห้ามข้าม guard ให้แก้ Vercel env ก่อน โหมดนี้ไม่ใช่ทางแทนเซฟที่เล่นไปแล้วหลาย revision

อ้างอิง: [Vite บน Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js Web Standard handlers](https://vercel.com/docs/functions/runtimes/node-js), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [ปิด public signup](https://supabase.com/docs/guides/auth/general-configuration)


## รุ่น terminal-only และการรีเซ็ตดันรายวัน (21 ต.ค.2026)

TASK-060/061 ไม่ต้องเพิ่ม SQL migration: ใช้6ไฟล์เดิมและatomiccommitRPCเดิม เมื่อdeploycodeใหม่contenthashเปลี่ยน ให้จบ/ถอยไฟต์ก่อนreloadแล้วกด **สำรองแล้วอัปเดตเซฟ** เกมเก่าที่เริ่มใหม่แล้วแต่มีดันค้างขณะdailyยังล็อกจะซ่อมเฉพาะdailycarryoverในขั้นนี้ พร้อมbackupก่อน ไม่ต้องresetตัวละครอีกรอบ เกมที่unlockdailyแล้วจะไม่ถูกล้างอัตโนมัติ

ระหว่างสู้ไม่มีwriteหรือheartbeat; เริ่มเก็บticket/snapshotแล้วจบส่งbattle.finishให้serverจำลองผลซ้ำ Speed1×/2×/4×เป็นpresentationclockในclient ไม่เปลี่ยนผลหรือAFKrate ส่วนmanualretreatยังสรุปdailyHPตามเวลาที่เล่นจริงภายใต้DBguard

การย้ายเซฟ6173เป็นงานแยก ไฟล์transferที่เคยเตรียมผูกrevision/hashปลายทางเดิม หากเล่นหรือmigratecloudแล้วต้องตรวจmetadataและexportsourceล่าสุดก่อนcutover ห้ามรันไฟล์เก่าโดยข้ามguard

## PWA (TASK-062)

ใช้build/SQL/envเดิม ไม่ต้องเพิ่มkeyหรือmigration ไฟล์PWAอยู่ในdistและheadersในvercel.json เปิด/playจากไอคอน standalone แนวตั้ง ดู [วิธีติดตั้งและขอบเขตแคช](PWA.md) Workerไม่cacheเกม/API/เซฟและไม่reloadกลางไฟต์ Contenthash768e12a4…คงเดิมในรุ่นPWAนี้

## เวลารอคำสั่งบันทึก (TASK-063)

`vercel.json` ระบุ `regions: ["sin1"]` ให้ API อยู่ Singapore ตามDBและการตั้งค่าของผู้ใช้ ตรวจ actualruntimeด้วย `x-ro-api-region` และ `x-vercel-id` จาก `/api/health` ดู [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region)

ทุกปุ่มใช้sharedsavepathเดียวกัน กรณีปกติPOSTครั้งเดียวคืนreceiptและcheckpointที่โหลด/verifyจากDBแล้ว ยังรอcommitจริงก่อนแสดงผล ไม่เลื่อนsaveหรือใช้ยอดเงินคาดการณ์ เก่าหรือcheckpointreadล้มfallbackGETcheckpoint; response lossยังreconcile UUIDเดิมก่อนส่งซ้ำ ไม่ต้องเพิ่มSQL/envหรือmigrateเซฟ

DevTools Networkดู `Server-Timing`: auth=ตรวจผู้ใช้กับSupabase, command=ตรวจintent/DB/คำนวณ/commit, checkpoint=โหลดและverifyผล, total=handlerทั้งหมด ตัวเลขนี้ไม่รวมเครือข่าย/โหลดmoduleตอนcoldstart จึงต้องอ่านคู่requestduration ไม่ควรนำpublichealthมาแทนlatencyของownercommand และไม่ส่งtoken/headersAuthorizationในรายงาน
