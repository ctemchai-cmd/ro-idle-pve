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

Import `ctemchai-cmd/ro-idle-pve` เลือกสาขา `main`, Root Directory เป็นราก repository และ Node.js24 ตาม `package.json` มี `vercel.json` กำหนด Vite, install `npm ci`, build `npm run build`, output `dist` และ route `/play`, `/auth`, `/roster`, `/api/*` แล้ว Entry ของ API คือ `api/index.ts` ที่ใช้ Web Standard `fetch` handler

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

`.vercelignore` ลด source upload เมื่อใช้ CLI โดยกันคลังต้นทาง/หลักฐาน/ไฟล์ส่วนตัว แต่ยังส่ง `runtime/ro/`, `plan/data/` และ build tools ครบ Git integration ยัง clone repository เต็ม; output ที่ให้ผู้เล่นโหลดคือ `dist` และ API function

## 3. ตรวจหลัง deploy

เปิด `/api/health`, `/auth` และ `/play` จาก URL จริง ตรวจ login/จัดทีม/เริ่มบอส/รับรางวัล/reload และลองเปิด deep link ในแท็บใหม่ ตรวจ Network ว่าภาพและเสียงโหลดจาก `/ro/<pack_hash>/...` ไม่มี404และไม่ได้โหลดคลังต้นทาง ทดสอบกับ project แยกก่อนให้บัญชีหลักใช้งาน

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

อ้างอิง: [Vite บน Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js Web Standard handlers](https://vercel.com/docs/functions/runtimes/node-js), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [ปิด public signup](https://supabase.com/docs/guides/auth/general-configuration)
