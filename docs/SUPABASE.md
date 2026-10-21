# Supabase Auth และฐานเซฟ

TASK-021 มีหน้า `/auth`, client Auth, server JWT verification, migrations/RLS และช่องทางสร้างเซฟเริ่มต้นที่ผูก verified UID แล้ว ตรวจ unit tests, Chrome กับ fixture, PostgreSQL แยก และ **Auth/PostgREST/SMTP จริงแบบ self-hosted บน loopback** ผ่าน ไม่มี hosted project หรือ production deployment

หลักฐาน: [Auth/JWT/RLS/owner writes](../plan/evidence/task-021-supabase-local.json), [browser SMTP/PKCE recovery](../plan/evidence/task-021-live-browser.json), [ชุดทดสอบแยกและเวอร์ชันบริการ](../plan/evidence/task-021-local-stack.json) ชุดนี้ไม่ใช่ Supabase cloud/Studio/Storage/Realtime และไม่พิสูจน์การส่งเมลภายนอกหรือ Vercel

เดโมต่อสู้ `/` ยังเปิดได้เมื่อไม่มี config และยังไม่บันทึกความก้าวหน้าระหว่างไฟต์ `account.create` สร้าง initial state/receipt/history แบบ atomic จากข้อมูลฝั่ง server เท่านั้น ส่วน recurring commands/checkpoint/reconnect ผ่าน TASK-022 ตาม [protocol](../plan/design/23-save-runtime-protocol.md) และ [หลักฐาน](../plan/evidence/task-022-review.json); Story/farm/actual roster loop ผ่าน [TASK-025](../plan/evidence/task-025-review.json) แล้ว; เล่นส่วนตัวตาม [Local play](LOCAL-PLAY.md)

## เตรียม environment ทดสอบ

1. ใช้ Supabase project แยกจาก production แล้วรัน migrations ตามลำดับ [001 storage](../supabase/migrations/202610190001_game_storage.sql) แล้ว [002 account creation](../supabase/migrations/202610190002_account_creation.sql) และ [003 database context/clock](../supabase/migrations/202610190003_save_context.sql) และ [004 atomic recurring commits](../supabase/migrations/202610200004_command_commits.sql) และ [005 Story terminal lease](../supabase/migrations/202610200005_story_settlement.sql) ในฐานใหม่ (apply migrations ทั้งหมดตามชื่อไฟล์)ด้วย SQL Editor หรือ migration tooling ของ operator ห้ามใช้ไฟล์ `bootstrap_local_postgres.sql` บน Supabase: ไฟล์นั้นจำลอง Auth เฉพาะการตรวจ PostgreSQL ในเครื่อง
2. เพิ่ม deployment marker ด้วย SQL Editor ของ **project ทดสอบ** โดยแทน `YOUR_TEST_PROJECT_REF` ด้วย project ref จริง:

   ```sql
   insert into public.game_deployment(singleton, environment, project_ref)
   values (true, 'test', 'YOUR_TEST_PROJECT_REF');
   ```

   API ต้องอ่าน marker ตรงกับ environment/ref ก่อนอ่านเซฟ ไม่มี marker หรือผิดค่าแล้วคืน 503; runtime service role เปลี่ยน marker ไม่ได้ migrations ไม่สร้างหรือเปลี่ยน marker ให้อัตโนมัติ
3. คัดลอก `.env.example` เป็น `.env.local` ซึ่งอยู่ใน `.gitignore` ใส่ URL/public key ของ project นี้ใน `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`; ตั้ง `VITE_APP_ENV=test` ส่วน server ใช้ `APP_ENV=test`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` และ `SUPABASE_TEST_PROJECT_REF` ของ project เดียวกัน ใส่ `SAVE_SIGNING_KEY` แบบสุ่มอย่างน้อย 32 ตัวอักษรเฉพาะ server เพื่อเซ็น history เริ่มต้น ห้ามใส่ private/service/signing key ในตัวแปร `VITE_*` ไม่ต้องส่งค่าลับในแชต
4. `SUPABASE_PRODUCTION_PROJECT_REF` ใช้ระบุ ref ของ production เมื่อมี; non-production จะปฏิเสธ ref นั้น อย่าตั้ง test กับ production เป็น project เดียวกัน ใช้ค่า `local` ทั้ง frontend/server ได้เมื่อรันทดสอบในเครื่อง แต่ hosted project ยังต้อง pin `SUPABASE_TEST_PROJECT_REF` และ marker ให้ตรง `local`; สำหรับ integration script ด้านล่างใช้ `test` ทั้งหมด
5. สร้างบัญชีส่วนตัวผ่าน Supabase Dashboard หรือ `auth.admin.createUser` ที่รันฝั่ง server เท่านั้น ปิด public signup ในการตั้งค่า Auth ตามเป้าหมายบัญชีส่วนตัว หน้าเว็บนี้ไม่มีการสมัครสาธารณะ ตั้ง password policy/ผู้ส่งอีเมลของ project แล้วใช้บัญชีที่ operator เตรียมไว้
6. ตั้ง Auth Site URL และ redirect allowlist ให้ตรง frontend ของ environment นี้ เช่น `http://127.0.0.1:5173/auth` หรือ `http://127.0.0.1:5174/auth` ตามพอร์ตที่ใช้งานจริง และ URL `/auth` ของ Vercel Preview เมื่อตั้ง deploy ใน TASK-043 แต่ละ hostname/origin ต้องใช้ให้ตรงกัน เปิดลิงก์กู้รหัสในเบราว์เซอร์ที่ส่งคำขอเพื่อให้ PKCE verifier เดิมยังอยู่
7. รัน `npm run dev:api` ใน terminal หนึ่ง และ `npm run dev` อีก terminal เปิด `/auth` จาก URL ของ Vite; dev proxy ส่ง `/api` ไป `127.0.0.1:8787` หลังเปลี่ยน env ต้อง restart dev processes และ production ต้อง build ใหม่

Publishable/legacy anon key ใช้ระบุ project ฝั่ง browser ได้ แต่สิทธิ์ข้อมูลต้องมาจาก JWT+RLS ส่วน server service/secret key อยู่เฉพาะ process ฝั่ง server แยก client config จาก server config และแยก auth storage key ตาม environment/host ดู [เอกสาร RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) และ [email/password Auth](https://supabase.com/docs/guides/auth/passwords)

## พฤติกรรมที่เตรียมไว้

- `/auth`: เข้า/ออกบัญชี ขออีเมลกู้รหัส และตั้งรหัสใหม่เมื่อ SDK แจ้ง recovery session; ไม่มี form ที่แสร้งเข้าใช้ได้เมื่อยังไม่ตั้ง config
- Browser SDK ใช้ PKCE, session persistence และ token refresh; controller แสดงเพียง user/expiry ให้ UI ไม่ส่ง token เข้า renderer หรือ engine, session หมด/401 กลับหน้าเข้าใช้ ส่วน 503 ยังให้ retry โดยไม่ถือว่าเซฟหาย
- `GET /api/account`: server ตรวจ bearer ด้วย Supabase `getUser`, ใช้ UID ที่ยืนยันแล้วและเช็ค deployment markerก่อนอ่าน ไม่มีเซฟคืน `404 ACCOUNT_NOT_INITIALIZED` โดยไม่สร้าง starter wallet
- `GET /api/receipts/:uuid`: ใช้ UID เดียวกัน อ่าน receipt ของตนเท่านั้น `POST /api/commands` รับ `account.create` ตาม command schema (revision 0, root/gender และ version/hash ที่ตรงกัน); command อื่นยังคืน 501 จน TASK-022 พร้อม
- JWT ของ browser อ่าน business tables/RPC ของตนได้ผ่าน RLS; anon ถูกปฏิเสธ; raw INSERT/UPDATE/DELETE จาก browser ถูกปฏิเสธทั้งหมด การเขียนเริ่มต้นผ่าน verified command API เท่านั้น; command ไม่รับ account ID/wallet/raw snapshot จาก browser ส่ง request เดิมคืน receipt เดิม สองคำขอพร้อมกันใช้ transaction lock ต่อ owner แล้วสร้าง save+receipt+signed history พร้อมกัน
- Receipt storage ให้ server INSERT/SELECT เท่านั้น ไม่มี UPDATE/DELETE/TRUNCATE grant; การลบบัญชีโดย operator ยัง cascade ลบข้อมูลที่เป็นเจ้าของได้
- Password reset แสดงข้อความกลางโดยไม่บอกว่าอีเมลมีบัญชีหรือไม่ ไม่มี token/password ใน log ของแอป และไม่มี schema/เกมสมการใน SQL

## ทดสอบบริการจริงในเครื่องโดยไม่มี hosted project

```sh
python3 scripts/prepare_auth_test_tools.py
python3 scripts/test_auth_stack.py
```

ตัวเตรียมดาวน์โหลด binaries ทางการที่ pin SHA256 ตาม [manifest](../supabase/tests/local-tools.json) ไป `/private/tmp/ro-idle-auth-tools` (override `RO_AUTH_TOOLS`) ไม่ติดตั้ง global ชุดที่ pin นี้ใช้ macOS arm64 และต้องมี PostgreSQL binaries/Node24/Playwright/Chrome ตามค่าทดสอบด้านล่าง ใช้ libpq ที่ติดตั้งคู่ PostgreSQL โดยไม่สร้าง symlink ในระบบ

Runner สร้าง cluster ใหม่/roles/JWT keys/server signing key ทุกครั้ง รัน migrations ของ [Supabase Auth upstream](https://github.com/supabase/auth) และของเกม, เปิด [PostgREST](https://docs.postgrest.org/en/stable/explanations/install.html) ด้วย authenticator ที่ไม่ใช่ superuser แล้วทดสอบ HTTP API/สองบัญชีจริงและหน้าเว็บ จากนั้นหยุดบริการและลบฐาน/เมล/credentials ชั่วคราวใน `finally` ทุกบริการ bind loopback อีเมลไป Mailpit ในเครื่องเท่านั้น ไม่ใช้ `.env.local`/ข้อมูลเดิม ไม่ส่งอีเมลถึงบุคคลอื่น

ทดสอบ Auth โดยใช้ DB owner ใน cluster ทิ้งได้เพื่อรัน upstream migrations; การตรวจเกม RLS ใช้ JWT roles จริงผ่าน non-superuser PostgREST ไม่ใช้ auth.uid fixture ในชุดนี้ การทดสอบ plain PostgreSQL แยกด้านล่างยังใช้ fixture และต้องแยกขอบเขตผลกัน

## ตรวจซ้ำ

```sh
npm run check
npm run build
python3 scripts/test_storage_postgres.py
node scripts/test_auth_browser.cjs
```

PostgreSQL test ต้องมี `pg_config`/binaries (`RO_PG_BIN` override ได้) สร้าง cluster ชั่วคราวเฉพาะ Unix socket ไม่ใช้ฐานเดิมหรือ `PGHOST` และลบทิ้งเมื่อจบ เป็นการพิสูจน์ SQL grants/RLS กับ fixture `auth.uid()` ไม่ใช่ GoTrue/JWT/PostgREST จริง Browser test ใช้ Playwright/Chrome ตาม `RO_PLAYWRIGHT_MODULE` / `RO_CHROME_PATH`, Vite URL ผ่าน `RO_DEMO_URL` (default `http://127.0.0.1:5174`), config ต้องว่างสำหรับเคส unconfigured

ตรวจ Supabase จริงหลังเตรียม test project/migrations/marker แล้ว:

```sh
RO_RUN_SUPABASE_INTEGRATION=1 node --env-file=.env.local --import tsx scripts/game/test-supabase.ts
```

สำหรับ hosted test script ปฏิเสธ environment ที่ไม่ใช่ `test`, ต้อง pin test ref และ marker ตรงกันก่อนสร้างสองบัญชีชั่วคราวของ run นั้น ตรวจ email/password, refresh/logout, JWT/RLS/RPC, verified-owner account.create (รวม concurrent/retry/forged payload), API owner lookup และ provider recovery จาก admin-generated token แล้วลบบัญชี/แถวทดสอบใน `finally` ไม่ส่งอีเมลและไม่เปลี่ยนบัญชีเดิม; initial account ที่สร้างมีเฉพาะ test user ของ run ผลคือ `plan/evidence/task-021-supabase.json` มีเฉพาะผล/code/hash ไม่มี credentials หาก cleanup ล้มเหลวให้ operator หา test users ที่ `app_metadata.ro_idle_test_run` แล้วลบเฉพาะบัญชี run นั้น

Hosted script นี้ยังไม่พิสูจน์ SMTP delivery/PKCE redirect ใน browser ต้องตรวจ deployment callback/การส่งเมลของ project จริงใน TASK-043/045 ส่วน loopback SMTP/PKCE และ initial owner-write ผ่านใน local-stack report แล้ว storage/checkpoint/reconnect ผ่าน TASK-022 แล้ว Story/farm loop ผ่านTASK-025; การตรวจ AFK12h ครบเป็นTASK-038 ไม่มี hosted evidence file จึงไม่อ้างว่าผ่าน hosted environment

Build ทำ `env:check` ก่อน bundle และ `secrets:check` หลัง build ตรวจ private env values ที่รู้จัก, privileged Supabase key/JWT และ private-key blocks ใน bundle/source โดยไม่พิมพ์ค่า การตรวจนี้มีขอบเขต ไม่ใช่เครื่องตรวจ secret ทุกชนิดและไม่ใช่การสแกน Git history ทั้งหมด ขั้นเตรียม push ต้องตรวจ staged files และ ignore paths เพิ่มต่างหาก

อ้างอิง callback/SDK: [Supabase client/server setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client) การ deploy/production config จริงยังรอ TASK-043/045

TASK-022 เริ่มเปลี่ยน initialization timestamp ให้มาจาก DB context เดียวกับ save/history/battle แทน Node wall clock และแยก canonical command payload ออกจาก request UUID ตามสัญญา การแก้เป็นช่วงก่อนเผยแพร่ที่ยังไม่มีเซฟผู้ใช้จริง เกณฑ์ autosave/reconnect/CAS/AFK ของ TASK-022 ยังไม่ถือว่าผ่าน ตรวจแยกรอบใหม่โดยใช้ `RO_EVIDENCE_PREFIX=task-022 python3 scripts/test_auth_stack.py` เพื่อเก็บหลักฐาน TASK-021 เดิมไว้

## เซฟระหว่างเล่น — TASK-022

GET `/api/checkpoint` อ่าน owner save/history/battle/DB UTC แบบสอดคล้องกัน `reward.claim`, `farm.claim`, `battle.advance`, `battle.retreat` ผ่าน verified-owner reducer และ migration004 CAS พร้อม immutable receipts/history/checkpoint ใน transaction เดียว รูปแบบ malformed/version/signature mismatch ถูกปฏิเสธก่อนเขียน ไม่มี raw state upload

หน้า `/auth` หลัง login แสดงสถานะเซฟ/revision/รับ fixed pending reward/เชื่อมต่อใหม่ สำรอง checkpoint+intent UUID ก่อนส่งใน localStorage ไม่มี credentials Web Locks ให้หนึ่งแท็บเขียน แท็บที่สอง read-only; ไม่มี Web Locks ก็ read-only เมื่อ response หาย lookup receipt UUID เดิมก่อนโหลด cloud ไม่ส่งยอดเงินใน backup กลับไปทับ server หากเน็ตขาดพัก mutation และ active battle ถูก retreat ตอนกู้กลับ ไม่เดินไฟต์ย้อนหลัง

ตรวจ `RO_EVIDENCE_PREFIX=task-022 python3 scripts/test_auth_stack.py` ผ่าน real PostgreSQL/Auth/PostgREST/SMTP/Chrome และ195TypeScript tests ตาม [review](../plan/evidence/task-022-review.json) บางชุดใช้ server-owned fixed reward/rate/battle fixtures ไม่ได้หมายความว่าStory/AFK/ผลชนะ/หน้าตัวละครเสร็จทั้งหมด ไม่มี hosted หรือ Vercel deployment

## Runtime เพิ่มเติมหลัง M2

TASK-026–028รองรับequipment/slot/card/fusion/tierผ่านcommand protocolเดียวกัน ตรวจจริงlocal full11flowแล้ว ดู [review028](../plan/evidence/task-028-review.json) TASK-027รวมactive actual-paid scopesและย้ายfullrefundhistoryไปimmutable receiptตามsave-contracts ไม่สะสมrefundedrowsในaccount ส่วน [Local play](LOCAL-PLAY.md) เปิดfrozen buildพร้อมฐานข้อมูลถาวรในโปรเจกต์ ต่างจากชุดทดสอบtemporaryที่ลบทิ้งตอนจบ Normalstartไม่เปลี่ยนกติกาของเซฟเอง และempty-snapshot refreshเป็นตัวเตรียมชุดสำหรับฐานว่างเท่านั้น ไม่ใช่TASK-040migration/restoreครบ
