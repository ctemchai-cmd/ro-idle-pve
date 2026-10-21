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

3. สร้างผู้ใช้ด้วยอีเมล/รหัสผ่านใน Auth Dashboard ปิด public signup สำหรับเกมส่วนตัว หน้าเกมไม่มีระบบสมัครสาธารณะ
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
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key หรือ legacy anon key ของ project |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key หรือ legacy service_role key เฉพาะ server |
| `SUPABASE_PRODUCTION_PROJECT_REF` | Project ref ที่ตรง URL และ deployment marker |
| `SAVE_SIGNING_KEY` | ค่าสุ่มอย่างน้อย32ตัวอักษร เก็บให้คงเดิมระหว่าง redeploy |

อย่าตั้ง server secret ด้วยชื่อขึ้นต้น `VITE_` และอย่า commit ค่าจริงลงไฟล์ เปลี่ยน browser environment แล้วต้อง build ใหม่ สามารถสร้าง signing key ด้วย `openssl rand -hex 32` แล้วใส่ผ่านหน้าจัดการ environment โดยตรง

Preview แบบเชื่อมฐานทดสอบใช้ `VITE_APP_ENV=preview`, `APP_ENV=preview`, URL/keys ของ project แยก และ `SUPABASE_TEST_PROJECT_REF` ตรง marker `preview` หากไม่ตั้ง Auth environment เลย เว็บจะแสดงสนามทดลองและสถานะยังไม่เชื่อมบัญชี ไม่สร้างเซฟจำลอง

`.vercelignore` ลด source upload เมื่อใช้ CLI โดยกันคลังต้นทาง/หลักฐาน/ไฟล์ส่วนตัว แต่ยังส่ง `runtime/ro/`, `plan/data/` และ build tools ครบ Git integration ยัง clone repository เต็ม; output ที่ให้ผู้เล่นโหลดคือ `dist` และ API function

## 3. ตรวจหลัง deploy

เปิด `/api/health`, `/auth` และ `/play` จาก URL จริง ตรวจ login/จัดทีม/เริ่มบอส/รับรางวัล/reload และลองเปิด deep link ในแท็บใหม่ ตรวจ Network ว่าภาพและเสียงโหลดจาก `/ro/<pack_hash>/...` ไม่มี404และไม่ได้โหลดคลังต้นทาง ทดสอบกับ project แยกก่อนให้บัญชีหลักใช้งาน

เซฟส่วนตัวบน6173ยังอยู่ในฐานเดิมบนเครื่อง การ push repo ไม่ย้ายเซฟนั้นไป Supabase cloud การสำรอง/ย้ายเซฟต้องใช้ขั้นตอน migration/restore ของเกมพร้อม signing key ที่สอดคล้องกัน

อ้างอิง: [Vite บน Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js Web Standard handlers](https://vercel.com/docs/functions/runtimes/node-js), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Supabase Auth](https://supabase.com/docs/guides/auth/passwords)
