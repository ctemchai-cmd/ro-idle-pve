# Handoff ระหว่าง agent

ไฟล์นี้บันทึกงานที่ agent ตัวหนึ่งทำแล้ว เพื่อให้ตัวถัดไป (Codex/Claude) ทำต่อได้ทันที อ่านคู่กับ [overview](overview.md) และ [AGENTS.md](../AGENTS.md) ล่าสุดอยู่บนสุด

## 21 ต.ค. 2026 · Codex — Hosted checkpoint SAVE_CONTEXT_UNAVAILABLE: deployment marker ยังว่าง

- ผู้ใช้ login แล้วรายงาน `/api/checkpoint` คืน `SAVE_CONTEXT_UNAVAILABLE` ตรวจ adapter พบ `game_load_context` เรียก environment guard ก่อนอ่านเซฟ และรวม RPC error เป็น code นี้ จึงยังไม่ใช่หลักฐานว่าเซฟเสียหรือ signing key ผิด
- ผู้ใช้รัน read-only SQL บน Supabase จริงแล้วตอบ `environment=NULL, project_ref=NULL, context_rpc_exists=true` ตาราง marker มี NOT NULL columns ดังนั้นเป็นตารางว่าง Migrations ตั้งใจไม่สร้าง marker อัตโนมัติ ห้ามข้าม guard/เปลี่ยน RLS เพื่อแก้
- ขั้นแก้คือรัน operator create-or-verify production marker ใน SQL Editor: insert singleton/production/project ref ที่ผู้ใช้ระบุ, ON CONFLICT DO NOTHING, เรียก game_assert_environment ตรวจให้ได้trueแล้ว commit มีไฟล์พร้อมแล้วที่ `.local/cloud-transfer/transfer-1792562795716865000/setup-project.sql` ไม่ต้องเปลี่ยนเกม/APIหรือรีสตาร์ต6173 API service_role มีสิทธิ์อ่าน marker เท่านั้น จึงเติมผ่าน SQL Editor ของเจ้าของ project
- ตรวจ presence ของ env copies ที่ผู้ใช้เปิดไว้แบบไม่พิมพ์ค่า พบไฟล์บนเครื่องยังไม่มี server key จึงไม่ได้เรียก privileged cloud RPC หรืออ่านข้อมูลเซฟ ไม่ได้เปลี่ยน SQL/เซฟจริง; รอผู้ใช้รัน marker แล้ว reload/ตรวจ checkpoint ต่อ ถ้าเป็น14ffเดิมให้ใช้ backed-up save.migrate ไป2c1ac034ตามหัวข้อถัดไป TASK058AC05ยังไม่ครบ

## 21 ต.ค. 2026 · Codex — D-082 หน้าแรกเข้าเกม/login และแก้ Vercel API import

- **ขึ้น production แล้วที่ commit `1a15532e5`**: GitHub Vercel status success, public `/api/health`200/ok/persistence configured/content2c1ac034… และ anonymous `/api/checkpoint`401จริง Chromeบน `https://ro-idle-pve.vercel.app` ผ่าน7กลุ่มเช่นเดียวกับ localโดย intercept Auth/APIเพื่อไม่เขียนเซฟจริง รายงาน canonical `entry-routes-browser.json` เป็นhosted bundle ส่วน localเดิมเก็บ `entry-routes-local-browser.json` แยก; screenshotทั้งสองแยกชื่อ ไม่อ้างว่า hosted owner login/JWT/DB/save migration ผ่านแล้ว
- ผู้ใช้ deploy สำเร็จที่ `https://ro-idle-pve.vercel.app/` แต่หน้าแรกยังเป็น demo แก้ `/` และ `/index.html` ให้ replace ไป `/play` (PKCE callback ไป `/auth` โดยเก็บ query/hash), session ว่างไป `/auth?next=...`; login สำเร็จกลับเกมพร้อม v/c เดิม `/auth` โดยตรงยังใช้จัดการบัญชี/ออกจากระบบ/กู้รหัสผ่านได้ demo เป็น `/demo` พร้อม Vercel rewrite และอัปเดต active spatial harness เฉพาะทางเข้า ไม่รันทับหลักฐานเก่า
- `AuthExperience` รับ optional returnToPlay ที่ ConfiguredAuth ยอมรับเฉพาะ `/play` หรือ `/play?...`; ไม่ mount SavePanel ในทางผ่าน login จึงไม่แย่ง writer ระหว่างเข้าหน้าเกม เปลี่ยน link/copy ที่เคยชี้หน้าแรกเป็น demo ให้กลับเกม/ระบุ `/demo` ชัดเจน
- ตรวจ public health จริงก่อนแก้ได้500 `FUNCTION_INVOCATION_FAILED`; ผู้ใช้ส่ง log `ERR_MODULE_NOT_FOUND /var/task/src/domain/account/index.ts` ยืนยัน API `.js` ยัง import `.ts` แก้ `tsconfig.json rewriteRelativeImportExtensions:true` และ native JSON import ใน `src/content/index.ts` ให้มี `with { type:'json' }` ไม่พ่วง raw TypeScript/source library เข้า function
- QA: production-configured isolated build ผ่าน, Chrome7กลุ่มผ่าน (root logged out/in, invalid login, restore query/session/reload, account/logout, external next rejection, explicit demo) ทั้ง Auth/API เป็น fixtures ไม่มี cloud writes; targeted API/Auth18 + backup/migration/transfer10 = **28 tests ผ่าน** รายงาน `entry-routes-{browser,review}.json` / build.txt และ screenshot `entry-login-390.png`
- ใช้ official `@vercel/node@24.0.3` ตรง CLI64.5.0 compile+file trace แล้ว materialize249files ใน `/private/tmp/ro-function-CHkMcw` รัน native Node24 **ไม่มี tsx/TSloader/source tree** ได้ health200 และ anonymous checkpoint401 หลักฐาน `entry-function.json` เครื่องมือ `scripts/test_vercel_function.cjs` ใช้ isolated source + dependencies จริง ไม่ใช้ symlink ที่ trace ออกนอก root
- Test harness รอบแรกใช้ selector demo รุ่นเก่า จึง timeout หลัง6กลุ่ม แก้เป็น companion strip ปัจจุบัน เก็บ `entry-routes-browser-round1.json` แยก; materializer2ครั้งแรกพบ FileBlob stream เป็น legacy readable ไม่ใช่ async iterable แก้ Node pipeline เก็บ `entry-function-round1.json` ไม่เปลี่ยนเกณฑ์ product
- **Content hash เปลี่ยนจาก14ffbc71…เป็น2c1ac034…** เพราะ JSON import attribute อยู่ใน implementation fingerprint แม้สูตร/ข้อมูลเกมไม่เปลี่ยน ไม่ bypass compatibility: cloud save เก่าต้องผ่าน flow `save.migrate` ที่มี preview/backup (ทดสอบผ่าน) SQLส่วนตัวที่เตรียมไว้ก่อนหน้ายังเป็น14ff; ถ้านำเข้าแล้ว APIใหม่จะเสนอ migration ส่วน helper export ใหม่ยังปฏิเสธ source version เก่าตามสัญญา ให้ใช้ SQLเดิมแล้ว migrate cloud หรือ migrate source ผ่าน workflowก่อน exportใหม่ ห้ามแก้ hash/เซ็นทับเอง
- ยังไม่รีสตาร์ต6173 ไม่อ่าน env/login/private ไม่ย้ายหรือสร้างเซฟจริง Boardคง46/58doneและTASK058AC05รอ hosted owner login/save migration/reload; public hosted routes/health ผ่านแล้ว ไม่มี credentials สำหรับพิสูจน์ hosted owner login

## 21 ต.ค. 2026 · Codex — แก้ Vercel build ติด source assets หลัง .vercelignore

- ผู้ใช้ส่ง hosted build log ของ commit `7231312`: env ผ่านแล้ว แต่ assets:check ล้มที่ `library/characters/body_atlas/_--011e9b38cbbb.meta.json` หลัง Vercel clone แล้วลบ ignored files การทดสอบเดิมไม่มี assets directory เลยจึงไม่ครอบคลุมโฟลเดอร์ว่างที่เหลืออยู่
- ทำซ้ำด้วย verifier จาก commit เดิมใน source context แยกที่มี `assets/ro/` ว่าง ได้ error ตรงรายงาน เพิ่ม explicit `--check --artifact-only` / `npm run assets:check:runtime` และให้ build ใช้คำสั่งนี้ ตรวจ payload checksum/file set/selection/manifest fingerprint/size เดิมครบโดยไม่อ่านคลังต้นทาง `npm run assets:check` ยังคงตรวจต้นทางอย่างเข้มงวดและปฏิเสธคลังไม่ครบ ไม่เปลี่ยนเป็นข้ามไฟล์หายรายตัว
- เพิ่ม regression 4 กลุ่ม: empty/partial source tree, corrupt/missing/extra runtime files, stale selection และ manifest fingerprint ชุด Python runtime assets **12 tests ผ่าน** รวม local rebuild repeatability/source checks
- Isolated production-configured `npm run build` ผ่าน env/assets/content/boundaries/typecheck/Vite/output/secrets ใน `/private/tmp/ro-vercel-build-t0fnr833` ใช้ dependencies เดิมผ่าน symlink, synthetic env ไม่มีจริง, ไม่มี .local/คลังต้นทาง แต่มี source directories ว่าง หลักฐาน `plan/evidence/vercel-runtime-build.{json,txt}` ไม่ใช่ hosted Vercel proof Content `14ffbc71…` / pack `f57a0773…` คงเดิม ไม่เปลี่ยน assets/gameplay/save
- เพิ่ม `*.env` ใน .gitignore/.vercelignore ครอบคลุมไฟล์ env สำเนาที่ผู้ใช้สร้างไว้ราก project โดยไม่อ่าน/ลบ/ส่งไฟล์นั้น แก้ docs ให้ตรงว่า Git integration ใช้ .vercelignore หลัง clone เช่นเดียวกับ CLI
- ไม่มี restart6173 หรือ cloud write; TASK-058 AC05/hosted deployment ยังรอตรวจจริง ขั้นถัดไปตรวจ Vercel deployment ของ commit ใหม่และขอ URL เมื่อพร้อม แล้วทำ hosted Auth/save transfer ตามหัวข้อถัดไป ไม่ปิด TASK-043/045/046/058 จาก local build เพียงอย่างเดียว



## 21 ต.ค. 2026 · Codex — TASK-058 ย้ายเซฟไป Supabase: เตรียม snapshot จริงแล้ว ยังไม่ import cloud

- ผู้ใช้ถามต่อ Auth/RLS/cloud saves ยืนยัน **ย้ายเซฟเดิม6173** (D-081) และรายงานสร้าง Supabase project/รัน6migrationsแล้ว ส่ง Project URL กับ target Auth UID มาแล้วในแชต ค่าลับ Supabase จะใส่ Vercel เอง ยังไม่มีโดเมน Vercel/hosted login proof
- Sign-in/email-password/no-sign-up มีอยู่แล้วใน `src/client/supabase-auth.ts`/`src/ui/auth-page.tsx` และ RLSใน6migrations ไม่สร้างใหม่ซ้ำ แก้ข้อความเก่าไม่มีเซฟให้ชี้ไปสร้างตัวละครแทนข้อความว่าระบบยังไม่เปิด Backend public signup ต้องปิดใน Supabase Dashboard ตาม docs
- ผู้ใช้สับสนชื่อSecret/legacy จึงเปลี่ยนcanonicalenvเป็น`SUPABASE_SECRET_KEY` (ใส่sb_secretใหม่), frontendใช้`VITE_SUPABASE_PUBLISHABLE_KEY` (sb_publishableใหม่) รองรับชื่อSERVICE_ROLEเดิมเฉพาะbackwardcompat/localและrejectค่าต่างกันถ้าตั้งสองชื่อ แก้.env.example/docs/privateproductionenvแล้ว 20targetedAuth+transfertests/buildผ่าน server auth adapterเปลี่ยนจึงไม่ใช่UI-onlycompatible snapshot update; ไม่ได้รีสตาร์ต6173
- เพิ่ม operator-only `scripts/game/prepare-cloud-transfer.ts`: ตรวจ source schema/content/hash/history/HMAC, bind target UID, preserve full AccountState + source revision และสร้าง atomic SQL save/history/import receipt ตรวจ project marker/Auth UID/ปลายทางว่าง/clock ไม่มี public upload endpoint Exact retryหลังเล่นต่อเป็นno-op; UUIDเดิมpayloadต่างถูกปฏิเสธ ใช้ signing key เดิมจาก private sourceเพื่อให้userใส่Vercelตรงกัน
- `scripts/prepare_local_cloud_transfer.py`: source read-only via Unix socket, pg_dumpเฉพาะgame tables, signed context, SQL/env/summaryใน`.local/cloud-transfer/`ไฟล์0600/dir0700 ไม่มีsecretในSQL/logs ไม่คัดAuthschemaหรือcredentialsท้องถิ่นไปcloud history/receiptsรุ่นเก่าอยู่localbackup Cloudย้ายเฉพาะstateปัจจุบัน+signed tip+importreceipt
- QA: 4unit tests, build/env/assets/content/boundaries/type/secretsผ่าน, readiness8/8; fresh PostgreSQL6กลุ่ม + sharedAPI checkpoint200/คำสั่งถัดไปrevision23→24/replay/collision/rollback3ตาราง/RLS/permissionsผ่าน รายงาน`task-058-{unit,postgres}.json`/build.txt ไม่ใช่ hostedAuth/JWT/PostgREST proof ชุดfixtureลบทิ้งแล้ว ไม่แตะ6173ระหว่างทดสอบ
- Round1–3 test socket pathยาวเกินmacOS103bytes แก้prefix; Round4พบPythonPath.openไม่รองรับopener แก้builtinopen เก็บfailure evidenceแยก ไม่มีการเปลี่ยนเกณฑ์ให้ผ่าน
- หลังได้project/UIDจริง รันhelperกับเซฟส่วนตัวสำเร็จ **revision2933** hash/schema/content/signatureผ่านและstateคงเดิม เก็บbackupแล้ว **ยังไม่มีcloud write** private directory `.local/cloud-transfer/transfer-1792562795716865000/` มีcontext/import.sql/local-game-backup.dump/summary/vercel-signing.env เพิ่ม`vercel-production.env` (URL/ref/appenv/signingkeyพร้อม, 2APIkeysว่างให้userเติม) และ`setup-project.sql` (create-or-verifyproductionmarker ไม่relabel) ห้ามพิมพ์เนื้อหาไฟล์ private เหล่านี้ รายงานpublicมีเฉพาะboolean/revision/hash`task-058-personal-export.json`
- ขั้นถัดไป: userเติม Publishable/Secret key ใน private env→ใส่Vercel Production, รันsetup-project.sqlแล้วimport.sqlในSQLEditorที่ถูกproject→ตรวจ state_hash/revision/sign-in/เล่นต่อ/reloadจริง Source snapshotอาจเก่าถ้ายังเล่น6173ต่อ ให้ exportล่าสุดตอน cutover ก่อนนำเข้า (ไม่เขียนทับ cloudที่เริ่มแล้ว) ขอURLVercelเมื่อพร้อมเพื่อตรวจAuthredirect/network/health ไม่มีrestart6173ในงานนี้
- Board **46/58done**, inprogress041+058, review048/054/055/056/057, todo042–046; TASK058 AC01–04ผ่านเครื่องมือ/fixtures AC05ยังรอhosted ห้ามปิดdoneหรืออ้างว่าย้ายจริงแล้ว TASK043/045/046ยังไม่ผ่าน

## 21 ต.ค. 2026 · Codex — ส่งทั้งโปรเจกต์ขึ้น GitHub สำเร็จ แก้ SSH account แล้ว

- หลังผู้ใช้อนุญาตให้ตรวจ SSH metadata พบ alias ที่ตั้งไว้แล้ว `github-new` ใช้บัญชี **ctemchai-cmd** (`ssh -T` ยืนยันสำเร็จ); `github.com` เดิมเป็น Rehpyc-z ที่ไม่มีสิทธิ์ repo นี้ ไม่อ่าน/พิมพ์ private key/token และไม่แก้ SSH config ส่วนกลาง
- เปลี่ยน origin เฉพาะ repo เป็น `git@github-new:ctemchai-cmd/ro-idle-pve.git` แล้ว **push main สำเร็จ** ที่ [GitHub](https://github.com/ctemchai-cmd/ro-idle-pve) สาขา main มี upstream `origin/main` ตรวจ source commit `edb95a74553a27e6a62a37cd8d6561d5e103671b` ตรง remote ด้วย ls-remote แล้ว การส่งเอกสารผลรอบนี้เป็น commit เพิ่มจาก source payload
- Source payload มี120,294 tracked files/1,131,126,052B รวม source assets117,892files/990,574,867B และ runtime artifact1,198files/27,200,551B ไม่มีไฟล์ส่วนตัว/credentials/node_modules/dist/generated source รวมตาม audit ไม่ส่ง `.local/play` หรือเซฟไป GitHub
- หลักฐาน `plan/evidence/git-initial-push.json` และ `git-initial-tree-audit.json`; build/source audit/config schema ที่ผ่านก่อนหน้าไม่เปลี่ยน ไม่รันเกม tests ซ้ำเพราะรอบนี้มีแต่เอกสาร/การเลือก SSH alias ยังไม่มี hosted Supabase/Vercel deployment และไม่ปิด TASK043/045/046
- ขั้นตอนนำไป deploy อยู่ `docs/DEPLOYMENT.md` (env/SQL6migrations/marker/Auth redirects) GitHub integrationใช้สาขาmainและruntime artifactที่เก็บในGit ไม่คัดคลัง assets เต็มไปเว็บ ต้นทางบนเครื่องยังมีครบ และไม่ได้รีสตาร์ต6173/เปลี่ยนเซฟ Boardยัง46/57doneเหมือนเดิม
- ต่อไป push ผ่าน `origin` ของ repo นี้เพื่อใช้บัญชีที่ถูกต้อง ไม่เปลี่ยนกลับไป `github.com` โดยไม่มีการแก้บัญชี SSH การเรียกกลับไปทำงานเกมให้ยึด task folders/overview และกติกาถามก่อนรีสตาร์ต6173ตามเดิม

## 21 ต.ค. 2026 · Codex — เตรียม GitHub ทั้งโปรเจกต์แล้ว แต่ push ติดสิทธิ์บัญชี

- ผู้ใช้สั่งขึ้น GitHub ทั้งโปรเจกต์ที่ `git@github.com:ctemchai-cmd/ro-idle-pve.git` เพื่อนำไปต่อ Vercel/Supabase สร้าง repo สาขา `main`, origin ตามที่ระบุ และ commit `4b7f6c9` (`first commit`) แล้ว **ยังไม่ขึ้น GitHub**
- รวม code/plan/tests/SQL migrations/คลัง assets ทั้งชุด และเปลี่ยนให้เก็บ `runtime/ro/` เป็น deployment artifact ใน Git ไฟล์รวมประมาณ120,000รายการ/1.13GB ไม่มีไฟล์≥100MiB `.local/`, credentials, `.env*` ยกเว้น example, node_modules, dist, generated source และ caches ถูกกันออก `.gitattributes` คง byte-exact เพื่อไม่ให้ CRLF ทำ checksum เสีย
- เพิ่ม `vercel.json` (Vite/Node24, build/output, API+SPA routes, manifest no-store/hashed asset immutable), `.vercelignore` สำหรับCLI และ `docs/DEPLOYMENT.md` พร้อม environment/marker/migrations6ไฟล์/Auth settings READMEปรับสถานะจริง การเตรียมนี้ไม่ปิด TASK043/045/046 และไม่ได้สร้างหรือ deploy บริการจริง
- Build ใน `/private/tmp/ro-git-build-1m060zwk` ที่ไม่มีคลัง assets/.local/env/generated source ผ่านโดยใช้ runtime artifact + existing dependencies พบครั้งแรกว่า CLI exclusion ของ tests ทำให้ type import ของ compact-ui-fixture หาย จึงนำ tests กลับใน source selection แล้ว build ผ่าน เก็บ failure/pass แยก หลักฐาน `plan/evidence/git-initial-build*.{json,txt}`; configผ่านschemaทางการ
- สแกน70,886 staged text files/120,289pathsผ่าน ไม่มี prohibited path/ไฟล์ใหญ่/credential pattern ที่ไม่ใช่fixture พบ3tokensที่เป็น synthetic auth fixturesเดิมและตรวจแล้ว รายละเอียด `git-initial-source-audit.json` ไม่อ่าน/แสดง `.local/play/login.md`, private.json หรือ private keys
- `ls-remote` อ่าน repo ว่างได้ แต่ push ถูก GitHubปฏิเสธ **Permission denied to Rehpyc-z** สองครั้ง (SSH และการลอง override origin URL ไป HTTPS ซึ่งยังได้ SSH denialเดิม) `main` จึงยังไม่ถูกส่ง ห้ามอ้างว่าอัปโหลดเสร็จหรือ force push
- Auto-review ปฏิเสธคำขอสำรวจ ~/.ssh/config/key filenames/agent public fingerprints หลัง pushถูกปฏิเสธ โดยมองว่าเป็นการหาสิทธิ์ใหม่ ต้องรอผู้ใช้อนุญาตโดยตรง ยังไม่ได้อ่านข้อมูลเหล่านั้น ส่ง async question ให้เลือกว่าอนุญาตตรวจ metadataนี้/เพิ่มสิทธิ์ให้Rehpyc-z/จัดการบัญชีเอง ห้ามพยายามอ้อม rejection ระหว่างรอ
- งานถัดไปหลังผู้ใช้ตอบ: แก้ช่องทาง auth/สิทธิ์ตามที่อนุญาต แล้ว push `main` ปกติ ตรวจ remote ref ตรง local HEAD และ upstream ไม่มีการรีสตาร์ต6173/เปลี่ยนเซฟในงานนี้ Boardยัง46/57doneเหมือนเดิม

## 21 ต.ค. 2026 · Codex — อัปเดต UI D-077–080 และทรงผม D-079 บน 6173/LAN แล้ว

- ผู้ใช้ตอบคำขอ restart ว่า **"อัปเดตเลย"** จึงหยุดเฉพาะ PID ของ personal `play_local.py` แล้วเปิด detached ด้วย `--refresh-compatible-snapshot --lan` สำรอง PG และ archive snapshot เดิมครบ ไม่ reset/migrate เซฟ
- ก่อน/หลังมี1เซฟ revision2622 และ fingerprint `b5b091e2a67bd74b2b2358c0233af655` เท่ากัน content ยัง `14ffbc71…` runtime pack ใหม่ `f57a0773…` public manifest มี36 job/gender head presets ใช้36หัวไม่ซ้ำ และทุกไฟล์ UI ตรง frozen source
- เว็บพร้อมที่ `http://127.0.0.1:6173/play` และ `http://192.168.1.101:6173/play` Auth health/HTTP200 ผ่าน Chrome signed-out360×640ทั้งสอง origin ผ่าน bundle JS/CSS15ไฟล์ต่อ origin ตรง snapshot ไม่มี browser error ไม่มีการอ่านหรือใช้ private/login ใน probe และไม่ได้สั่งบันทึกบัญชีส่วนตัว
- หลักฐาน `plan/evidence/task-056-polish-local-refresh.json` และ `task-056-polish-updated-preview-smoke.json` บันทึกแยกจากการอัปเดต D-076 ครั้งก่อน ผลทดสอบ source/ทรงผม/UI ก่อนอัปเดตอยู่หัวข้อถัดไป ไม่ได้รันชุดเต็มซ้ำโดยไม่มี source เปลี่ยน
- Board ยัง done46/57, inprogress041, review048/054/055/056/057, todo042–046 TASK056 AC06 และ057 AC05 รอผู้ใช้ยอมรับภาพจริง การอนุญาตอัปเดตไม่ใช่การรับภาพ รีสตาร์ตครั้งถัดไปยังต้องถามตาม D-072 และคง `--lan`

## 21 ต.ค. 2026 · Codex — รอบแก้ UI D-077–080 + ทรงผม TASK-057 พร้อมอัปเดต (รอผู้ใช้ตอบ restart)

- ผู้ใช้แก้ TASK-056 หลังดูของจริง: คิวสกิลต้องกลับด้านล่าง (D-077), CSPD/ห้ามเลือกข้อความ/ลูกศรกึ่งกลาง/ลบแนะนำหน้าแรก (D-078), แถบปุ่มต่อสู้ไม่สวยและเอา Emoji ออกใช้ Icon แทน (D-080) — ทำครบและตรวจแล้ว
- `SkillsPage`: DOM loadout กลับใต้ skill-split ก่อน Timeline ยังติดอยู่ในหน้าไม่ต้องเลื่อน outer page; อัปเดต AGENTS/design30/decisions แล้ว ห้ามย้ายขึ้นด้านบนอีก
- `character-nav.tsx`: chevron SVG ไม่อิง font baseline วัด glyph center ทั้งแกนและ path center ผ่าน ≤0.5px; `game.css`: user-select/-webkit-user-select none ใน shell ทั้งหมด ยกเว้น input/textarea/contenteditable เพื่อพิมพ์ข้อมูลได้; ชื่อ Cast Speed ทุก UI ใช้ CSPD
- `field.tsx`: ลบ guide/quest pill และ localStorage state เดิม หน้าแรกเหลือ map/AFK/challenge; boss-tools เป็นแถวเดียว **ภายใน boss-bar ใต้แถบร่าย** ไม่ absolute ลอยบังฉาก ปุ่ม Stats/Timeline/speed/retreat ใช้ shared outline SVG `Icon` เพิ่ม paths ใน `src/ui/icon.tsx` และแทน Emoji ทุกหน้าเกม/ชีต/Timeline รวม fallback หลายส่วน (native RO item/skill/menu art คงเดิม)
- ผู้ใช้ขอทรงผมต่างกัน (D-079): TASK-057 เลือก native human heads จาก 42 แบบต่อเพศ ทุก job/gender ใช้คนละ ID รวม19 jobs/36 presets ผ่าน `plan/data/actor-presentations.json` **ไม่ต้องเพิ่ม renderer override หรือ stat/schema ใหม่** รวม Monk ทรงโกน `32` รายการเลือกใน `task-057-hairstyles-selection.json`
- runtime pack **f57a0773…**, 656 assets / 1197 files / raw26,693,726B (~25.46MiB) + manifest506,825B; initial1,582,917B อยู่ใน cap27MiB content hashยัง **14ffbc71…** จึงอัปเดต compatible ได้ ไม่ migrate/reset เซฟ API/server/migrations/gateway ตรง frozen preview ทุก byte
- ตรวจจริง: build/env/assets/content/boundaries/type/secrets ผ่าน; M0 11/11 + readiness8/8, starter check, library60,460 checksum/ACT/atlas checks (9 STR unresolved เดิมนอก pack), native4 testsผ่าน `RO_EVIDENCE_PREFIX=task-056 RO_COMPACT_ARTIFACT_TAG=task-056-polish RO_LOCAL_TEST_FOCUS=compact python3 scripts/test_auth_stack.py` ผ่าน **9กลุ่ม/30layouts/0error** รวม doubleclick/drag ไม่เลือกข้อความ, RESET input ยังพิมพ์ได้ (ไม่กดรีเซ็ต), และ Daily จริงกดสถิติ/Timeline/1→2→4→1/retreat บันทึก SQL ถูก
- Native head QA ใหม่ `scripts/check_job_hairstyles.cjs` ผ่าน3,420 decoded body-clock samples × state/facing/hat (5 states, ซ้าย/ขวา, bare/Tier20) ทุก36preset ภาพ contact sheets bare/hat และ battle/skill/Stats ตรวจด้วยตาเฉพาะ idle composites/UI; ไม่อ้างว่าเปิดดูทุก animation frame ด้วยตา
- หลักฐานล่าสุด `plan/evidence/task-056-polish-{compact-ui,local-stack,compatibility}.json`, `task-056-battle-toolbar.json`, `task-057-{native-renderer,hairstyles-selection,review}.json`; screenshot prefix `task-056-polish-compact-*`, `task-057-{job-hairstyles,heads-with-hats}.png` เก็บรายงาน UI รอบก่อนแยกไม่ทับ
- **เว็บ6173ยังไม่ได้อัปเดตรอบนี้** (ยังเป็น UI D-076 แรกที่ผู้ใช้สั่งอัพ) ส่งคำถาม `request_user_input_async` รอผู้ใช้ตอบอนุญาต restart รอบใหม่ตามกติกา ask-before-every-restart; งานพร้อมตรวจและได้เห็นภาพแล้ว ยังห้ามถือว่าเวลาเงียบเป็นการอนุญาต
- เมื่อผู้ใช้อนุญาต ใช้ `python3 /private/tmp/ro-refresh-ui-polish.py` (helperชั่วคราว) สำรอง/ตรวจ revision+fingerprint/หยุดเฉพาะ PID ส่วนตัว/เปิด detached compatible --lan/เทียบทุก UI file และ public pack+36uniqueheads จากนั้น `node /private/tmp/ro-refresh-polish-smoke.cjs` ตรวจ signed-out localhost/LAN bundles (ไม่ใช้ login ส่วนตัว) หรือทำขั้นเดียวกันด้วย play_local.py ตามคู่มือถ้า helperหาย ทั้งสองต้องมีสิทธิ์เปิดพอร์ต/ส่ง signal นอก sandbox
- Board done46/57, inprogress041, review048/054/055/056/057, todo042–046; TASK056 AC06 และ057 AC05 รอผู้ใช้ภาพจริง ไม่ใช่แค่คำอนุญาตอัปเดต

## 21 ต.ค. 2026 · Codex — อัปเดต TASK-056 บน 6173 แล้วตามผู้ใช้อนุญาต

- ผู้ใช้ตอบ "อัพเลย" จึงรีสตาร์ตเฉพาะบริการส่วนตัวด้วย `--refresh-compatible-snapshot --lan` สำรอง PG และเก็บ snapshot เก่าครบ ไม่ reset/migrate เซฟ
- ก่อน/หลัง: 1 เซฟ revision2237 และ fingerprint ของ revision/content/state_hash เท่ากัน Content `14ffbc71…` / pack `5370e86d…` เดิม source UI ใหม่ 8 ไฟล์ตรง frozen snapshot
- เว็บกลับมาแล้วที่ `http://127.0.0.1:6173/play` และ `http://192.168.1.101:6173/play` ตรวจ Chrome แบบไม่ล็อกอินทั้งสอง origin ผ่าน 0 error และ JS/CSS สาธารณะ 15 ไฟล์ต่อ origin ตรง snapshot มี compact CSS/ปุ่มเปลี่ยนตัวจริง
- หลักฐาน `plan/evidence/task-056-local-refresh.json` และ `task-056-updated-preview-smoke.json` บริการใหม่เปิด detached คง PID/lock ตามปกติ ไม่อ่านหรือใช้ login/private ใน probe
- TASK-056 ยังอยู่ review รอผู้ใช้รับภาพ (AC-06) การอนุญาตอัปเดตยังไม่ใช่การยอมรับภาพจริง กระดานยัง done46/56, inprogress041, review048/054/055/056

## 21 ต.ค. 2026 · Codex — TASK-056 UI มือถือกระชับ (D-076), รออนุญาตอัปเดต 6173

- รับช่วงจาก Claude ตามหัวข้อถัดไป อ่าน AGENTS/HANDOFF/overview/decisions แล้ว ผู้ใช้ขอเอาวงกลมทีม 4 ตัวออกจากหน้าแรก, เพิ่ม ‹ › ใน Stats/Skill และลด UI ให้เลื่อนน้อยลง
- ทำแล้วใน `src/ui/game/`: ลบ `team-dock` (ยังเก็บ party focus ในบอส), เพิ่ม `character-nav.tsx` ให้ Stats/Skill กับ roster strip ใช้ลำดับทีมก่อนแบบเดียวกัน วนหัวท้ายครบเจ็ดตัว; route `c` เปลี่ยนโดยไม่บันทึกเกม, keyed Stats/Skill ล้าง draft/picking ของตัวเก่า, เปลี่ยนหน้า/ตัวแล้วคืน scroll ด้านบน
- CSS ปรับ HUD 58px/bottom bar 60px, แผงอุปกรณ์ 56px, roster card 72px, ช่องว่าง/เมนู/ดัน/ร้าน/ชีตกระชับ, กระเป๋า 6 คอลัมน์; ไม่ใช้ zoom และไม่เปลี่ยนขนาด actor ในสนาม Stats ใช้ label/value ในช่องบรรทัดเดียว คำอธิบายโบนัสอยู่ใน Additional Stats เปิดดูได้
- Skill: คิว 4 ช่องอยู่ด้านบนตลอด รายการ/รายละเอียดเลื่อนแยกกัน ผลระดับถัดไปกดขยาย; Timeline เปิดใน `dialog.skill-preview` แทนขยายหน้าหลัก ฮาร์เนส shell เดิมปรับ selectors ตามแล้ว
- `hud.tsx`: ย้ายปุ่มสถานะเซฟไปแถวชื่อ ขยายพื้นที่ทรัพยากรให้ badge ไม่ชน sound/settings ที่ 360px
- ตรวจแล้ว: `npm run build` (env/assets/content/boundaries/typecheck/secrets), `python3 plan/checks/readiness.py` 8/8 และ `RO_EVIDENCE_PREFIX=task-056 RO_LOCAL_TEST_FOCUS=compact python3 scripts/test_auth_stack.py` ใช้ fresh upstream Auth/API/PostgreSQL/Chrome แยก ผ่าน 6 กลุ่ม/30 layouts (360×640,390×844,1280×800 ×10 หน้า), 28 ภาพ, 0 browser error Stats/Skill ปกติ page scroll 0px ทั้งสามขนาด; ลูกศร 40×40px ยืนยัน draft isolation และคำสั่งบันทึก INT/upgrade/คิวลง NPC ที่เลือกจริง หน้ารายการยาวยังเปิดดูท้ายสุดได้
- หลักฐาน `plan/evidence/task-056-{compact-ui,compatibility,review,local-stack}.json`, `task-056-build.txt`; browser ใช้ funded Lv20/Class2 fixture ทุกตัว+ของสวม ไม่อ้างว่าเล่นหาได้จริง ตรวจภาพด้วยตาเฉพาะ home/Stats 360, Skill 390 และภาพ Buddy/Skill 360 รอบก่อน ไม่ใช่มือถือจริง/Safari
- รอบ 1 พบ Stats ล้น 52px แล้วแก้ รอบ 2 layout ทั้ง 30 ผ่านแต่ selector ของ nested summary กำกวม จึงแก้ฮาร์เนสเป็น direct child; เก็บ failure evidence round1/round2 แยก รอบ 3 ผ่านทั้งหมด ไม่ได้รัน 355 unit tests เดิมซ้ำเพราะเปลี่ยน UI เท่านั้น
- Board: done46/56, inprogress TASK-041, review TASK-048/054/055/**056**, todo042–046. TASK-056 AC01–05 ผ่าน self-check แต่ AC06 ต้องผู้ใช้ยอมรับ ยังไม่ปิด done เพิ่ม D-076 และ acceptance 6 แถว (รวม255 cases) แล้ว
- **ยังไม่รีสตาร์ต/อัปเดต 6173 และไม่อ่าน login/private** เว็บส่วนตัวยังคง snapshot จาก Claude (LAN) content `14ffbc71…`, pack `5370e86d…` ตรงเดิม ตรวจ byte hashes ของ API/server/migrations/gateway ตรง snapshot สามารถใช้ `--refresh-compatible-snapshot --lan` หลังผู้ใช้อนุญาต (สำรองอัตโนมัติ)
- งานถัดไป: เมื่อผู้ใช้ตอบอัปเดต ให้หยุดเฉพาะ PID ของเว็บส่วนตัวแล้วเปิด `python3 scripts/play_local.py --refresh-compatible-snapshot --lan`; อย่าลืมคง LAN และถามก่อนตาม D-072 ถ้ายังไม่อนุญาต งาน UI พร้อมตรวจแล้ว งาน balance/TASK-042–046 คงตาม handoff Claude ด้านล่าง

## 21 ต.ค. 2026 (ค่ำ) · Claude Code → Codex — ส่งต่องานฉบับละเอียด (TASK-041, TASK-054/055, D-070–D-075)

อ่านส่วนนี้ก่อนทั้งหมด ส่วนล่างเป็นประวัติตามลำดับเวลา (รายละเอียดเชิงลึกของแต่ละรอบ)

### 0. ผู้ใช้และวิธีทำงานที่ผู้ใช้คาดหวัง

- ตอบผู้ใช้เป็น**ภาษาไทยเสมอ** สรุปสั้น ตรง บอกสิ่งที่ยังไม่ได้ตรวจตรงๆ
- ผู้ใช้กำลัง**ลองเล่นเว็บส่วนตัว 6173 อยู่จริง** และส่งคำขอ/บั๊กเล็กๆ ระหว่างเล่นบ่อย รูปแบบที่ใช้มาตลอด: ทำ → ตรวจ (unit + build + live) → สรุป → ถามก่อนรีสตาร์ต → ผู้ใช้ตอบ "อัพเลย" → deploy
- **ถามก่อนรีสตาร์ต 6173 ทุกครั้ง** (ไฟต์บอส/ดันที่ค้างจะถูกถอยทัพ สิทธิ์ดันรายวันไม่คืน)
- เวลาประเมินต้องวัดจริงก่อนบอก (ผู้ช่วยเคยบอกผิดว่าจำลอง 25 วันใช้ไม่กี่นาที) ผู้ใช้ถามเรื่อง token: การจำลองรันบนเครื่องไม่กิน token ให้ใช้ background + แจ้งเตือนแทนการเปิดเช็กบ่อย
- คำตอบของผู้ใช้ที่เป็นการตัดสินใจถูกบันทึกเป็น D-0xx ใน `plan/decisions.md` เสมอ ห้ามรื้อคำตอบเดิม (เช่น ดันรายวันเลือดสะสมทั้งวัน P-07, D-074 ไม่ปรับจูนใหม่สำหรับท่าร่ายแรงเพิ่ม)

### 1. สถานะตอนนี้

| เรื่อง | ค่า |
| --- | --- |
| กระดานงาน | done 46/55 · `inprogress`: TASK-041 (บาลานซ์) · `review`: TASK-048 (AC-08), TASK-054 (AC-06), TASK-055 (AC-06) — รอผู้ใช้ยอมรับเท่านั้น ห้ามปิดเองโดยไม่มีคำยืนยัน |
| content / pack | content `14ffbc71…` · pack `5370e86d…` (622 assets, 25.67 MiB raw ≤ cap 27 MiB, initial 1.56 MB) |
| เทสต์ล่าสุด | `npm test` **355/355** · `npm run build` ผ่าน · `bash scripts/m0_checks.sh` 11/11 · live shell modes-only 18 checks/0 error (ชุดเต็มล่าสุดก่อน D-074: 33 checks/0 error) · LAN smoke ผ่าน (ข้อ 3) |
| เว็บส่วนตัว 6173 | **โหมด LAN** ที่ `http://192.168.1.101:6173/play` (และ `http://127.0.0.1:6173/play`) เซฟ rev 2092 บน `14ffbc71…`; เปิดด้วย `--refresh-migrate-saves --lan` · **รีสตาร์ตครั้งต่อไปต้องใส่ `--lan`** ไม่งั้นกลับเป็น loopback · อย่ารัน live test พร้อม deploy |
| ข้อมูล balance | `.local/balance/` (git-ignore, บนเครื่องนี้): `snap-{mage,thief}.json.gz` (snapshot ทุกด่านจาก journey 25 วัน), `pace-*.json`, `cal-*.txt` · หลักฐานถาวร `plan/evidence/balance/task-041-calibration-2026-10-21.json` |

### 2. สิ่งที่เปลี่ยนตั้งแต่ D-070 แยกตามระบบ

**ภาพการต่อสู้ (D-070, TASK-054)** — `src/renderer/{battle,actor-animation,damage-numbers,projectiles,impact-timing,pack}.ts`, `src/renderer/combat-visuals.json`, `plan/data/actor-presentations.json`
- อาวุธตาม `weapon_compatibility`; Monk (สนับมือไม่มีภาพ) วนท่า 86/94/46; อาชีพถืออาวุธใช้ท่าเดียวเพราะ overlay RO วาดในกลุ่มท่าเดียว
- ธนูปล่อย **frame 7** (`attack_release_frame`; 4–6 คือดึงสายสุด) และ `ActorAnimation.swing()` เร่งท่าเมื่อโจมตีถี่กว่าความยาวท่า
- ชื่อสกิลขึ้นทุก `cast_start` ≥1.5 วิ, เลข RO โค้ง/หด 0.8 วิ, เลขแดงฝั่งเรา (`frameStats.incoming`), STR จริงต่อฮิต (`impacts` key = presentation id), Bolt ตกจากฟ้า
- ไอคอนสกิลครอปตาม `sprite_sheet.frames[0]` ผ่าน `AssetPack.iconUrl()` (atlas 30×26 มีขอบ/คอลัมน์เกิน)

**คำขอระหว่างลองเล่น (D-071–D-073, D-075; TASK-055 AC-01–09)**
- รีเซ็ตเซฟลัดจากตั้งค่า (`BackupSheet focusReset`), ตัวกรอง Rarity/Level + "เลือกที่กรอง" (`backpack.tsx`), ป้ายเลือดต่อจากรอบก่อน (`daily.tsx`)
- **speed 1×/2×/4×**: `battle.advance.speed` → `calculateBattleCredit` (เวลาเกม = min(ขอ, ช่วงจริง×speed, 5000×speed)), `src/client/battle-speed.ts` (localStorage), `SpeedButton` ใน `field.tsx`
- ตัวละครใหญ่ขึ้น ~12% (`story.ts`, `farm-scene.ts`); ใส่สกิลแบบเลือกสกิลก่อน (`skills.tsx`, `placeSkill`/`removeSkill`); สถิติรายสกิลแบบซ่อน/แสดง (`ActorCombatStatistics.skills`, `SkillSplit`); หน้าตัวละครเรียงตัวในทีมก่อน (`RosterStrip`)
- UI audit ใน live (`UI_AUDIT`: 360/390/1280 × 9 หน้า ล้มถ้าป้ายปุ่มตัดบรรทัดหรือไอคอนช่องไม่อยู่กลาง), ป้าย Refine pill, แบนเนอร์กาชาอ่านจำนวน Option จาก content
- **D-075 เล่นจากมือถือใน LAN** — ดูข้อ 3

**ศัตรู/ด่าน (D-074 + TASK-041)** — `plan/data/enemies.json`, `plan/generators/stages.py`, `plan/generators/stages-spec.json` (calibration), `scripts/game/balance.ts`
- ท่าร่ายแรง = ทุกสกิลที่มี tag `heavy_cast`: Cataclysm (ทั้งทีม ×1), Doom (HP% ต่ำสุด ×2.5, Provoke ดึงได้), Twin Hex (`random_n` 2 คน ×1.6) ร่าย 4 วิ ขัดได้ ใช้แถว calibration เดียวกัน; บท 1 Cataclysm เสมอ บท 2+ หมุน (`heavy_skill`) 7 ด่านต่อท่า
- ปรับจูน 14 รอบบน snapshot ของ journey: ปกติ **101/104** ในแถบ 0.7–0.9 (เฉลี่ย 0.82), ท้ายบท **8/8** ในแถบ 0.55–0.8 (0.67), ร่ายแรง **16/21** หลัง D-074 (8/21 แพ้ถ้าไม่ขัด)
- ตัวปรับร่ายแรงใช้ค่าเฉลี่ยสองทีม (`bareMean`), ก้าว `cast_share` 0.05, ลด ATK (`heavy_atk_scale`) เมื่อยากเกินแม้ cast เบาสุด; รายงานพิมพ์ `bare` (เฉลี่ย) และ `bare_max`

**การจำลอง (TASK-041)** — `scripts/game/journey.ts`
- แก้บั๊กบอท: รับรางวัลดันทุกรอบ (คิว 32 เต็ม → `PENDING_REWARDS_FULL` → ไฟต์ค้าง → ทุกคำสั่งล็อก), `battleToEnd` retreat เมื่อ advance ถูกปฏิเสธ, เก็บทองเมื่อมีคนรอ Breakthrough (`gateWaiting`), progress/ETA ต่อวันทาง stderr, `--dump-final <path>`
- pace 25 วันสองทีม: จบเรื่อง **193/207 ชม.** (เป้า D-069 240 ชม.; บอทเล่นเกือบสมบูรณ์ จึงไม่ปรับอัตราฟาร์ม); บท 1–7 เร็วกว่าเป้า ~15–30%
- เทสต์ parity T029–T034 ย้ายไปด่าน 3-8 (fixture มีสมาชิก Lv.1 ไม่มีของสองตัว แพ้ 6-20 ใน 10 วิหลังปรับจูน — fixture ไม่ใช่สัญญาณบาลานซ์)

**บั๊กจริงที่แก้ (deploy แล้ว)** — schema `options.maxItems` 4→5 ใน inventory และ pending reward (Supreme D-068 มี 5 แถว) + เทสต์ผ่าน `validateAccount` จริง (mutation-checked); การ์ดหอคอยตาม tier มีเทสต์แล้ว (TASK-053 ปิด)

**เครื่องมือใน repo** — `scripts/m0_checks.sh`, `scripts/game/calibrate-rounds.sh` + `scripts/game/calibration_summary.py`, `scripts/game/journey-calibrate.sh`, `scripts/act_contact_sheet.py`

### 3. D-075 เล่นจากมือถือในวง LAN (ล่าสุด)

- ผู้ใช้ต้องการ `http://192.168.x.x:6173/play` แบบไม่ลงใบรับรอง เปลี่ยน bind อย่างเดียวไม่พอ เพราะ (1) build ฝัง Supabase URL `127.0.0.1` (2) หน้า http ที่ไม่ใช่ localhost ไม่มี `crypto.subtle`/`crypto.randomUUID`/Web Locks ซึ่งระบบเซฟใช้
- `scripts/play_local.py --lan`: gateway (`scripts/game/local-supabase-gateway.ts`, env `RO_GATEWAY_HOST=0.0.0.0`) ฟังทุก interface; Auth/PostgREST/Postgres/mail ยัง 127.0.0.1 และเข้าถึงได้ผ่าน path ที่ gateway proxy เท่านั้น; `GOTRUE_DISABLE_SIGNUP=true`; พิมพ์ `lan_url`
- `src/client/auth-config.ts`: `readPublicAuthConfig(env, window.location)` — build `local` ที่ชี้ loopback ใช้ origin ของหน้าเมื่อเปิดจาก `isPrivateLanHost` (RFC 1918/169.254/.local) เท่านั้น; production/test/public host ไม่เปลี่ยน
- `src/client/secure-context.ts`: `sha256Hex` (SubtleCrypto หรือ SHA-256 JS ที่ให้ผลเท่ากันทุก byte), `randomId` (randomUUID หรือ v4 จาก getRandomValues) แทนทุกจุดใน `src/client`/`src/ui`
- `src/client/save-browser.ts storageWriterLock`: ใช้เมื่อไม่มี Web Locks — lease localStorage ต่ออายุทุก 2 วิ หมดใน 6 วิ แท็บที่สองเป็น read-only เหมือนเดิม (server CAS ยังกันเซฟชน)
- ตรวจแล้ว: `tests/game/lan-play.test.ts` 4 ข้อ, live โหมดปกติ, LAN smoke ใน Chrome บน 192.168.1.101 (secure=false, ไม่มี subtle/randomUUID/locks, คำขอ auth ไป LAN origin, รหัสผิด → 400, 0 error) — **ยังไม่ได้ทดสอบล็อกอินจริง+เซฟบนหน้า http** (ห้ามใช้บัญชีส่วนตัวผู้ใช้ทดสอบ; รอผู้ใช้ลองบนมือถือ ถ้าจะทำ E2E ให้สร้าง stack แยกที่ build ด้วย `VITE_APP_ENV=local` แล้วเปิดผ่าน IP วง LAN)
- ความเสี่ยงที่ยอมรับ: รหัสผ่านวิ่ง http ใน Wi-Fi บ้าน (ผู้ใช้เลือกไม่ลงใบรับรอง) — เขียนเตือนใน `docs/LOCAL-PLAY.md` แล้ว

### 4. ข้อห้าม / invariant

- เวลาไฟต์บอสให้โดยเซิร์ฟเวอร์: speed คูณเฉพาะช่วงจริงที่ credit; lease/ticket/offline เป็นเวลาจริง
- ห้ามใส่ `attack_variant_indices` ให้อาชีพถืออาวุธ; ธนูปล่อย frame 7
- เลขขาออกตามตัวโฟกัส (`frameStats.damage`), เลขแดงแยก `frameStats.incoming`
- ท่าร่ายแรงเช็กด้วย tag `heavy_cast` เสมอ (ไม่ใช่ id Cataclysm); ดันรายวันเลือดสะสมทั้งวัน
- ตัวปรับจูนอ่านคอลัมน์ `mean` (สองทีม) ไม่ใช่ `win`
- ห้ามผ่อนกฎ https ของ production เพื่อ LAN; fallback crypto ต้องให้ผลเท่ากับ API จริง (มีเทสต์เทียบ node)
- ห้ามแก้ `src/` ระหว่าง live test; live shell ผูก tag `task-048` (เก็บสำเนา `task-048-r<เวลา>-*` ถ้าต้องรักษาหลักฐาน); อย่ารัน live พร้อม `play_local.py` refresh
- ห้ามพิมพ์ `.local/play/private.json`/`login.md`; ฮาร์เนส renderer รุ่นเก่าที่ขับ UI `/` เดิมใช้เป็น regression ไม่ได้

### 5. วิธีตรวจ / คำสั่ง

```bash
bash scripts/m0_checks.sh && npm run content:generate && npm run assets:build   # หลังแก้ plan/data หรือ presentation
npm test && npm run build
RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py   # ~12 นาที; RO_SHELL_ONLY_MODES=1 รอบสั้น ~5 นาที
ROUNDS=4 bash scripts/game/calibrate-rounds.sh                                            # ปรับจูนต่อ (≈2.5 นาที/รอบ) บน snapshot ใน .local/balance
python3 scripts/game/calibration_summary.py .local/balance/cal-final.txt
# เว็บส่วนตัว (ถามผู้ใช้ก่อน; หยุด pid ใน .local/play/running.pid ก่อน; คง --lan ไว้)
python3 scripts/play_local.py --refresh-compatible-snapshot --lan   # UI อย่างเดียว (content/migration/server code เท่าเดิม)
python3 scripts/play_local.py --refresh-migrate-saves --lan         # content หรือโค้ดฝั่ง server เปลี่ยน (สำรองก่อนเอง)
```

### 6. งานต่อไป (เรียงลำดับ)

1. รอผู้ใช้ลองบนมือถือ (D-075) และยอมรับ TASK-048 AC-08, TASK-054 AC-06, TASK-055 AC-06 → ย้าย done พร้อมหลักฐาน; ฟีดแบ็กความยากใหม่จากการเล่นจริงสำคัญกว่าตัวเลขบอท
2. **TASK-041 ที่เหลือก่อนปิด**: `scripts/game/matrix.ts` 20 seeds, story report 100 seeds, สรุปผลลงไฟล์งาน; ด่านร่ายแรงนอกแถบ (4-15/5-10 0.68, 7-10 0.93, 3-5 ไม่ขัดก็ชนะ) ปรับได้เฉพาะถ้าผู้ใช้ขอ (D-074)
3. ขอบเกมจริง: `pending_rewards` ครบ 32 → ไฟต์ settle ไม่ได้ ค้างจนถอยทัพ (UI แค่ toast "รับรางวัลที่ค้างไว้ก่อน") ควรกันตั้งแต่เริ่มไฟต์หรือรับอัตโนมัติ
4. TASK-042: bundle gzip ~422 KB > เป้า bootstrap 350 KiB (chunk content โตจาก D-068) — แยก chunk หรือแก้เป้าแบบมีเหตุผล
5. งานถัดไปตามกระดาน TASK-042–046 (TASK-043 ต้องขออนุญาตผู้ใช้ก่อนสร้าง infra ภายนอก)

## 20 ต.ค. 2026 ดึก · Claude Code — TASK-054 ภาพการต่อสู้ตรง RO (D-070)

### ทำอะไรไป

- ผู้ใช้แจ้ง 7 ข้อ (Monk ถือกระบอง, ท่าโจมตีท่าเดียว, ลูกธนูออกตอนง้าง, เอฟเฟกต์สกิลไม่ใช่ของจริงโดยเฉพาะ Bolt, ชื่อสกิลไม่ขึ้นถ้าไม่มีหลอดร่าย, เลขดาเมจควรโค้ง-หดแบบ RO และเร็วขึ้น, ฝั่งเราโดนตีไม่มีเลข) → [TASK-054](review/tasks_054.md) อยู่ `review` รอผู้ใช้ดูภาพ (AC-06)
- `plan/data/actor-presentations.json`: overlay ตาม `weapon_compatibility` (monk 너클, acolyte/priest 롯드, alchemist 클럽, assassin 단검 + attack 94→86), `attack_release_frame: 4` ให้ archer/hunter, `attack_variant_indices: [86,94,46]` ให้ monk → **content hash เปลี่ยนเป็น `51db6fd7…`**
- renderer: `presetSwing()` + `ActorAnimation.attackState()` (จำต่อ event), `attackContactMs(parts, state)` ใช้ release frame, `battle.ts` มี shouts/impacts/incoming numbers, `damage-numbers.ts` มี `numberFlight` และ kind `incoming`, `projectiles.ts` มี `path: 'sky'`/`shape: 'spear'`/`impactAt` และตรวจ `impacts`
- `src/renderer/combat-visuals.json`: `impacts` 28 presentation → 22 STR จริง, Fire/Cold Bolt เป็นหอกตกจากฟ้า, Lightning Bolt/Arrow Shower ไม่มี projectile แล้ว (STR เป็นตัวเล่า)
- `scripts/build_runtime_assets.py`: raw cap 27 MiB (D-070), initial profile นับ impact เฉพาะสกิล Lv.1 สี่สาย; pack ตอนนี้ 622 assets / 1129 files / 25.67 MiB raw / initial 1.56 MB, pack hash `75e103ee…`

### ตรวจแล้ว

- `npm test` 342/342, `npm run build` ผ่าน, `python3 -m unittest tests.test_runtime_assets tests.test_preparation_pack` 11/11, M0 checks + readiness ผ่าน
- `scripts/test_presentation_fidelity.cjs` (ใหม่) กับ Vite แยก port ผ่าน 3 checks: ทุกสกิลที่ใช้มีชื่อ (Bash 1.5 วิ), impact 7 ชนิดวาดจริง, ลูกธนู 9 ดอกออก 400–408 ms, monk วน 3 ท่า ภาพ `docs/screenshots/presentation-*.png`, หลักฐาน `plan/evidence/task-054-presentation.json`
- ฮาร์เนส renderer รุ่นเก่า (test_focus_impact/test_combat_polish/test_mobile_spatial/test_timeline_caster_polish) ขับ UI `/` เดิมที่มี `.companion` ซึ่งไม่มีแล้ว รันเป็น regression ไม่ได้ (ลองรันสำเนาจาก scratch root เพื่อไม่ทับหลักฐานเดิม)
- live shell suite ถูกผูก tag `task-048` ใน `test_auth_stack.py` จึงเก็บสำเนาหลักฐานรอบ 17:43 ไว้เป็น `plan/evidence/task-048-r1743-*` ก่อนรันใหม่

### ข้อควรรู้

- RO วาด overlay อาวุธในกลุ่มท่าโจมตีเดียว อย่าใส่ `attack_variant_indices` ให้อาชีพถืออาวุธ (เทสต์ใน `impact-timing.test.ts` จะจับ) Monk สนับมือไม่มีภาพ = ต่อยมือเปล่าแบบ RO
- STR sidecar ใหญ่กว่าภาพได้มาก (resurrection 280 KB, magnificat 132 KB) ก่อนเพิ่ม effect ให้ดู webp+meta และงบ 27 MiB; ACT sprite effect (fireball/icemine/soule) render ผิดสเกลใน `drawParts` ยังไม่ใช้
- bundle gzip ของ build ตอนนี้ 417 KB (เดิมสูงสุด 343 KB) ส่วนใหญ่จาก chunk content ที่โตตาม D-068 (138 KB gzip) เกินเป้า bootstrap 350 KiB ของ TASK-042 — TASK-042 ต้องแยก chunk หรือแก้เป้าแบบมีเหตุผล
- เว็บส่วนตัว 6173 อัปเดตแล้ว: `--refresh-migrate-saves` ย้ายเซฟ rev 806→807 (farm rate refreshed for 4-2) บน content `51db6fd7…` / pack `75e103ee…` แล้ว `--refresh-compatible-snapshot` อีกรอบหลังแก้ข้อความแบนเนอร์กาชา (UI อย่างเดียว)
- live shell suite (`RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py`) ผ่าน 27 checks / 55 ภาพ / 0 browser error รวมขั้น HEAVY_067 ครั้งแรก (3-5 intro + Cataclysm cast track) รอบแรกล้มที่ STORE เพราะบั๊กของผมเองในรอบก่อน: คำสั่งเติมทอง/คริสตัลใน MODES seed ไปอยู่ท้าย `//` comment จึงไม่รัน แก้แล้ว และ STORE/GEAR_PULL อ่านราคา/ของที่ได้/จำนวน Option จาก content แทนตัวเลขเก่า (ถุง EXP 3000, Immortal 3)
- แบนเนอร์กาชาอุปกรณ์เคยเขียนตายตัว "Legendary/Immortal 3 แถว" ตอนนี้สร้างจาก `random_options.lines_by_rarity` ผ่าน `optionLineSummary()` (มีเทสต์ใน gacha-shop)

### งานต่อไป

ดูส่วน 21 ต.ค. ด้านบน (รายการนี้ล้าสมัยแล้ว)

## 20 ต.ค. 2026 · Claude Code (ช่วงที่ Codex หมดโควตา)

### สถานะตอนรับงาน

- Codex จบ TASK-028 และรีเฟรชเว็บส่วนตัวเรียบร้อย ไม่มีงานค้างใน `inprogress/` หรือ `review/` และไม่มีโค้ดที่แก้ค้างไว้ครึ่งทาง
- ตรวจซ้ำแล้ว: typecheck ผ่าน, `npm test` 233/233

### คำขอใหม่ของผู้ใช้ (บันทึกแล้วใน decisions)

- **D-051**: ปรับ UX/UI `/play` ให้เหมือนเกมมือถือ (อ้าง Ragnarok Idle Adventure) ผู้ใช้วาด layout ของแต่ละหน้ามาเอง รายละเอียดทั้งหมดอยู่ใน [design30](design/30-game-shell-ui.md)
- **D-052**: Mobile First **แนวตั้งเท่านั้น** ไม่มี layout แนวนอน มือถือที่ถือแนวนอนจะเห็นข้อความให้หมุนเครื่อง ส่วน desktop แสดงกรอบแนวตั้งกลางจอ

### สิ่งที่ทำ = TASK-048 (อยู่ใน `plan/review/tasks_048.md`)

| ส่วน | ไฟล์ |
| --- | --- |
| Game shell ใหม่ของ `/play` | `src/ui/game/` — `shell.tsx` (save session/route `?v=&c=`/submit/toast/rotate lock), `hud.tsx`, `nav.tsx`, `field.tsx` (ฉากฟาร์ม, ไฟต์บอส, การ์ดผลลัพธ์, แผนที่, หีบ AFK), `buddy.tsx` (ช่องอุปกรณ์ 3+3, Upgrade/Change/Character sheets, roster strip), `skills.tsx`, `stats.tsx`, `backpack.tsx`, `team.tsx`, `onboarding.tsx`, `kit.tsx` (ชิ้นส่วนกลาง, ป้ายภาษาไทย, ActorCanvas, Sheet, CostChips), `game.css` |
| Route | `src/ui/main.tsx`: `/play` → `game/shell.tsx`; `/roster` ที่ตั้งค่าบัญชีแล้วจะส่งต่อไป `/play?v=buddy` ส่วน sandbox (ไม่มีบัญชี) ยังใช้ `roster-page.tsx` เดิม |
| ลบไฟล์ | `src/ui/story-page.tsx`, `story-fight.tsx`, `story.css` (ไม่มีใครใช้แล้ว) |
| ฉากฟาร์มหน้าหลัก | `src/client/farm-scene.ts` (`FarmWaveSession`, `farmSceneStage`, `farmWaveRows`) + `tests/game/farm-scene.test.ts` |
| Helper ที่แยกออกมา | `src/client/story.ts`: `sceneLabels`, `partyNames`, `partyAppearances`, `battleRenderView` · `src/client/equipment.ts`: `itemModifiers`, `rarityRank` |
| Renderer | `battle.ts`: `scroll` (ฉากเลื่อนแบบ mirror tile) และ `zoom` (กล้อง) ใช้เพื่อแสดงผลเท่านั้น · `pack.ts`: `currentScene` สำหรับสลับเพลง · `shell.ts`: อ่านไอคอนและ skin มอนจาก pack |
| Asset | `src/renderer/shell-visuals.json` (ไอคอนเมนู `ro_menu_icon`, ไอคอนทรัพยากร, skin มอนฟาร์ม 48 ตัวใน 8 บท) · `scripts/build_runtime_assets.py` อ่านไฟล์นี้เข้า `index.shell` · pack ตอนนี้มี 319 IDs / 638 files / 23.07MB (งบ 25MiB) |
| เว็บเล่นส่วนตัว | `scripts/play_local.py --refresh-compatible-snapshot` (ดูหัวข้อด้านล่าง) |
| ทดสอบในเบราว์เซอร์ | `scripts/test_game_shell_live.cjs` และ `scripts/test_auth_stack.py` รับ `RO_LOCAL_TEST_FOCUS=shell` |
| เอกสาร | decisions D-051/D-052, design30 (ใหม่), แก้ design09/10, TASK-039/042, overview, design README, LOCAL-PLAY, AGENTS.md |

### กติกาที่ต้องรักษาไว้ (สำคัญ)

- **content_hash ต้องเป็น `65b82feb21f654bb17521bdc4417245c630d0cf6f0149f5877ab93b5ec3b9dc2` เท่าเดิม** hash นี้คิดจาก engine data (ไม่รวม presentations, `reference_profiles`, ชื่อ, ฉาก) + schema + โค้ดใน `src/content`, `src/contracts`, `src/domain`, `src/simulation` ดังนั้นงาน UI ให้แก้แค่ `src/ui`, `src/client`, `src/renderer` และ asset pack เท่านั้น ถ้าไปแตะ contracts/domain hash จะเปลี่ยน แล้วเซฟของผู้ใช้จะเปิดกับ snapshot ใหม่ไม่ได้ (การย้ายเซฟเป็นงาน TASK-040)
- **ฉากฟาร์มเป็นแค่การแสดงผล** รัน `createBattle/advanceUntil` ตัวเดิมกับทีมในเซฟ เจอแถว `enemy_add_*` ของด่าน (เฉพาะ 1-1 ที่ไม่มีลูกน้อง จึงใช้บอส×0.25 HP/×0.6 ATK ตามค่าใน `shell-visuals.json`) ไม่ส่ง command และไม่แก้ state รางวัลยังมาจาก `farm.claim` ตามเวลาเท่านั้น ห้ามนำผลฉากนี้ไปใช้เป็นหลักฐานบาลานซ์
- `plan/data/progression.json` → `reference_profiles.mobile.landscape_css` ถือว่ายกเลิกแล้วตาม D-052 แต่ยังไม่ได้แก้ไฟล์ เพราะ `generate-content.ts` ตรวจ hash ของ M0 input ถ้าแก้ต้อง re-review manifest
- ผู้ใช้ถือว่า UI ของผู้ช่วยปรับได้ ส่วนที่ผู้ช่วยตัดสินใจเองอยู่ในตาราง design30 (ผสม rarity/อัป Tier อยู่ในกระเป๋าเพราะ Crafting ยังล็อก, ปุ่ม Upgrade รวมเลเวล/Breakthrough/เปลี่ยนอาชีพ/รีเซ็ต ฯลฯ)

### วิธีตรวจ

```sh
npm run typecheck && npm run boundaries && npm test          # 237/237 (มี farm-scene เพิ่ม 4)
npm run assets:check && npm run build                        # build ผ่าน; คำเตือน chunk>500kB มีมาก่อนแล้ว และเป็นงาน TASK-042
python3 -m unittest tests.test_runtime_assets && node --test tests/renderer.test.mjs
RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py
```

คำสั่งสุดท้ายเปิด Auth/PostgREST/PG แยกบน loopback สร้างบัญชีใหม่ แล้วเล่นตั้งแต่สร้างตัว → ฟาร์มเดิน → ท้าบอส 1-1 → รับรางวัล → หีบ AFK → Buddy/ช่อง/Upgrade/Change → Stats (ลง INT) → Skill → กระเป๋า → ทีม → จอ 360/1280 → มือถือแนวนอน/แนวตั้ง ผลล่าสุดผ่าน 9/9 ไม่มี browser error ดู [shell-live](evidence/task-048-shell-live.json) และ [review](evidence/task-048-review.json) ภาพอยู่ที่ `docs/screenshots/task-048-*.png`

สคริปต์ `scripts/test_{story,roster,skills,equipment,slots,gear_growth,save}_live.cjs` ยังใช้ selector ของ UI เก่า จึงรันกับ `/play` ใหม่ไม่ได้แล้ว เก็บไว้เป็นหลักฐานของ TASK-022–028 ถ้าจะเขียน flow ใหม่ ให้ต่อจาก `test_game_shell_live.cjs`

ข้อควรระวังตอนเขียนเทสต์และ UI:

- แท็บที่ล็อกใช้ `aria-disabled` จึงต้องกดด้วย `{ force: true }`
- sheet มี animation ประมาณ 0.22 วินาที ถ้าจะถ่ายภาพ ให้รอประมาณ 350ms ก่อน
- `ActorCanvas` วาดโดยเอาเท้าไว้ที่ `footY` ถ้า `scale × ~82px` สูงกว่า `footY` หัวจะโดนตัด
- ฟาร์มกับบอสใช้ `AssetPack` ตัวเดียวกัน (`background`/`actors` มีชุดเดียว) จึงต้องเรียก `prepare` ใหม่ทุกครั้งที่สลับฉาก ตอนเปิดหน้าอื่นหรือถือมือถือแนวนอน ฉากจะหยุดวาด (`covered`)

### เว็บเล่นส่วนตัว (http://127.0.0.1:6173)

- อัปเดตแล้วสองรอบด้วย `--refresh-compatible-snapshot` คำสั่งนี้จะยอมสร้าง snapshot ใหม่ทั้งที่มีเซฟอยู่ก็ต่อเมื่อ content_hash, ไฟล์ migration, `api/`, `src/server/` และ gateway ตรงกับของเดิมทุก byte ก่อนทำจะ `pg_dump` ไว้ที่ `.local/play/backups/before-compatible-snapshot-refresh-*.sql` และย้าย snapshot เก่าไปไว้ที่ `.local/play/archives/`
- เซฟของผู้ใช้อยู่ที่ revision **79** (ตอนส่งงาน) ตอนตรวจได้แค่ล็อกอินแล้วเปิดดู ไม่ได้ส่ง command ใดๆ
- บริการที่รันอยู่เปิดแบบ detached (`nohup`, PPID 1) แทนตัวเดิมที่ Codex app-server เคยเปิดไว้ PID อยู่ใน `.local/play/running.pid` และ log อยู่ใน `.local/play/service.log` ถ้าจะ refresh อีก ให้ kill PID นั้นด้วย TERM แล้วรันคำสั่งเดิม (เช็กก่อนว่าไม่มี `active_battle`)
- ห้ามพิมพ์เนื้อหาของ `private.json` หรือ `login.md` ออกมา

### รอบแก้หลังผู้ใช้ทดลอง (ยังเป็น TASK-048)

- หน้าจัดทีม: เดิมเป็นคอลัมน์เหลื่อมกัน ปรับเป็นตาราง 2×2 (`.formation-grid`) หัวคอลัมน์ "แนวหลัง | แนวหน้า"
- หน้าสถิติ/Timeline ในไฟต์: เดิมไม่มีสไตล์ เพราะ CSS อยู่ใน `adventure.css`/`modern-theme.css` ที่ story-page เก่า import ไว้ ตอนนี้ย้ายไปไว้ใน `game.css` และ scope ใต้ `dialog.sheet` แล้ว
- ปุ่มถอยทัพกระพริบ: หลังส่ง command ทุกครั้ง `SaveController.reconnect()` จะตั้งสถานะ `loading` ชั่วครู่ (boss clock ยิงทุก 1 วินาที) ตอนนี้ field นับ `loading` เป็น online และปุ่มถอยทัพใช้ `context.submitWhenReady` ซึ่งรอให้ writer ว่างก่อนส่ง ปุ่มอื่นที่ต้องกดระหว่างไฟต์ควรใช้วิธีเดียวกัน
- ไอคอนอาชีพ (D-053): `src/ui/game/class-icon.tsx` เป็น emblem SVG ที่วาดเอง ไม่ใช่ asset ของ RO

### รอบแก้ที่ 2 หลังผู้ใช้ทดลอง (D-054)

- **รับรางวัล AFK:** `farm.claim` เป็นแค่ทางหนึ่งที่สร้าง pending claim ยังมี `farm.set_stage` และการชนะบอสที่ settle ช่วงฟาร์มเป็น claim `farm_<request_id>` ด้วย ตอนนี้ `FarmSheet.collectAll` รับทุก claim ตามลำดับ และหยุดทันทีที่โดนปฏิเสธ (เช่น `INVENTORY_FULL`)
- **WARNING ก่อนบอส:** อยู่ใน `field.tsx` (`BossIntro`, state `intro`) ขึ้นก่อนส่ง start และไม่หน่วง battle clock ส่วนชื่อบอสมาจาก `storyBossLabel` ใน `client/story.ts`
- **ระดับเสียง:** slider ใน `hud.tsx` เขียนลง `ro-idle.audio-levels.v1` ผ่าน `saveAudioLevels` ห้ามแก้ `DEFAULT_AUDIO_LEVELS` ใน `src/contracts` เพราะ content_hash จะเปลี่ยน
- **เทสต์:** หีบ AFK ที่มีรางวัลค้างจะเด้งตลอด เทสต์จึงต้องกดด้วย `{ force: true }`

### หมวก/ผ้าคลุมบนตัวละคร (D-055)

- `shell-visuals.json` → `wardrobe`: `job_class_sprite` (19 อาชีพ → class_sprite เกาหลีของ RO), `head[tier][gender]` และ `garment[tier].rows["class_sprite|gender"]` ครบ 38 ชุดต่อ Tier
- ฝั่ง client มี `wardrobeTiers(state, id)` ใน `client/equipment.ts` เติม `head_tier`/`garment_tier` ลงใน `partyAppearances` และ `lookOf(a, state)` ส่วน renderer ใช้ `wardrobeRefs` ใน `shell.ts` และ `AssetPack.actor` กับ `ActorCanvas` จะโหลด headgear/garment เพิ่ม (`native.mjs` วาดได้อยู่แล้ว)
- ห้ามแก้ `ActorAppearance` ใน `src/contracts` เพราะจะทำให้ hash เปลี่ยน ให้ใช้ type ขยายฝั่ง renderer (`WardrobeTiers`) แทน
- Pack ตอนนี้ 479 assets / 845 files / 24.1MB เหลือที่ในงบ 25MiB ไม่มาก ถ้าจะเพิ่ม asset อีกต้องระวัง (TASK-042 เป็นเจ้าของงบนี้)

### รอบแก้ที่ 3 (D-056) — หน้าจอเท่านั้น content_hash เท่าเดิม

- **หน้าตาบอส:** `shell-visuals.json` → `boss_pools` บทละ 5 ตัว ใช้ผ่าน `bossSkin` (renderer) และ `stageBossSkin` (field) โดย `SavedBattleSession(payload, state, skinFor)` เปลี่ยนแค่ body_meta/ชื่อ ด่านท้ายบทยังใช้บอสต้นฉบับ
- **ฟาร์มตามด่านล่าสุด:** อยู่ใน receipt effect ของ `Field` ส่งคำสั่ง `farm.set_stage` (ผ่าน `submitWhenReady`) เมื่อชนะด่านใหม่ และจุดฟาร์มเดิมเป็นด่านก่อนหน้าหรือยังไม่ได้ตั้ง
- **Timeline ในหน้าสกิล:** ใช้ `previewStorySession(clone with draft)` กับ `SkillTimeline` เดิม และ `AssetPack.prepareIcons` (โหลดเฉพาะไอคอน ไม่สลับฉาก)
- **เมนูดันเจี้ยน:** `dungeon.tsx` ตอนนี้เป็น hub ที่ล็อกไว้ รอทำ TASK-035/036
- **Refine:** `UpgradeSheet.refineNow` อ่าน `context.lastCode()` ถ้าได้ `REFINE_FAILED` จะแสดงเอฟเฟกต์พลาด (ต้องรอกติกาใหม่ตาม D-057 ก่อนถึงจะมีกรณีนี้)
- **Pack:** 519 assets / 25.39MB จากงบ 26.21MB (97%) แทบเต็มแล้ว

### TASK-049 กติกา D-057 (done) — content_hash เปลี่ยนเป็น `01876ded…`

- **ตัวสร้างข้อมูล:** ก่อนหน้านี้ไม่มีสคริปต์สร้าง `stages.json` เลย ตอนนี้มี `plan/generators/stages.py` (+ `stages-spec.json` เก็บส่วนที่คนเขียนเอง) โดยโหมด `--legacy --check` ยืนยันว่าสูตรสร้างไฟล์ 8×10 เดิมได้ตรงทุก byte (hash อยู่ใน `stages-legacy-sha256.txt`) และ `plan/generators/status_points.py` ปรับ progression.json แบบรันซ้ำได้ ส่วน `levels.py` เรียก `--check` ของทั้งสองโหมด
- **ด่าน:** layout `{1:10,2:10,3:10,4:20,...,8:20}` อยู่ใน generator (`LAYOUT`, บทอนาคต 50) ระดับเลเวลใช้ `8c−4+floor(6i/N)`, HP ใช้ `(7+10i/N)`, บอสท้ายบท = i==N และรางวัลคูณ 10/N
- **Refine:** `slot-progress.json` → `success_chance_by_target`/`pity` ตัวนับอยู่ที่ `slot_progress[slot].refine_failures` (เพิ่มใน schema ทั้ง 6 ช่องแล้ว) `applySlotCommand(..., roll)` รับค่าสุ่มจาก `time.battle_seed` ใน `commands.ts` ส่วน preview ส่ง 0 (สำเร็จ) และ sandbox ใช้ `Math.random`
  - ตีได้ทีละขั้น (`REFINE_ONE_STEP`)
  - ถ้าพลาด receipt เป็น committed โดยมี `REFINE_FAILED`
  - เทสต์ใช้ seed `SUCCESS=634785765` (สุ่มได้ 0) และ `FAIL=1568006588` (สุ่มได้ ~0.995)
- **Status:** แต้มรวมอยู่ใน `level_rows.total_status_points` ส่วนโบนัสอยู่ที่ `combat-rules.json` → `primary_milestone_bonus` ซึ่ง `resolveStats` อ่านไป และ `combat.py` คำนวณซ้ำแบบเดียวกัน
- **ด่านตรวจ M0:** แก้ `levels/progression/combat/classes/architecture.py` ถ้าแก้ข้อมูล M0 อีก ให้รันตามลำดับนี้
  1. รันตัวตรวจทุกตัว ได้แก่ `progression --write-report`, `combat --write-report`, `classes`, `equipment`, `economy`, `levels`, `ui --write-report`, `architecture --write-report`, `composition --write-report`
  2. `node plan/checks/build_manifest.mjs`
  3. `python3 plan/checks/readiness.py` (สคริปต์นี้**เขียนทับ** `evidence/task-014-review.json` ทุกครั้ง)
  4. `npm run check`
- **readiness:** ตอนนี้รองรับงานหลัง 047 (ต้องมี ID ต่อเนื่อง) และนับเกณฑ์ตรวจรับจาก acceptance-cases จริง งานใหม่ต้องเพิ่มแถวลงทั้ง `acceptance-cases.json` และ `acceptance-matrix.md`
- **เซฟส่วนตัว:** เปลี่ยน content แล้วเซฟเก่าใช้ไม่ได้ ผู้ใช้เลือกเริ่มใหม่ จึงรัน `play_local.py --reset-saves-for-new-content` ไฟล์สำรองอยู่ที่ `.local/play/backups/before-new-content-reset-*.sql` และ `game-saves-before-new-content-reset-*.json` (เซฟ #461)
- **ข้อควรระวัง:** การแก้โค้ดใน `src/domain` / `src/contracts` / `src/content` / `src/simulation` ทุกครั้งจะเปลี่ยน content_hash และทำให้เซฟส่วนตัวใช้ไม่ได้ ก่อนแก้ต้องถามผู้ใช้ หรือทำเครื่องมือย้ายเซฟ (ส่วนหนึ่งของ TASK-040) ก่อน

### TASK-050 เครื่องมือย้ายเซฟ (D-058, done)

- **วิธีอัปเดตเว็บส่วนตัวแบบปกติ:** `python3 scripts/play_local.py --refresh-migrate-saves` (ต้อง kill PID ใน `.local/play/running.pid` ก่อน แล้วรันแบบ nohup) คำสั่งนี้
  1. ทำ `pg_dump`
  2. รัน `npm run build`
  3. export เซฟเป็น JSON
  4. ใช้ `scripts/game/migrate-local-saves.ts` (โค้ดใหม่) สร้าง SQL ถ้าเซฟใดไม่ผ่าน `validateAccount` จะ**หยุดก่อนเปลี่ยน snapshot**
  5. เปลี่ยน snapshot แล้วรัน migrations
  6. รัน SQL ที่สร้างไว้
- `src/domain/account/migrate.ts` แปลงเฉพาะสิ่งที่รู้จัก: `refine_failures`, งบ Status, ด่านหรือฟาร์มที่ไม่มีแล้ว และจบไฟต์ค้าง ถ้าเปลี่ยน schema แบบอื่นในอนาคต ต้องเพิ่ม transform ที่นี่พร้อมเทสต์ใน `tests/game/save-migration.test.ts`
- ทดสอบครบวงจรได้ด้วย instance ชั่วคราว: `RO_LOCAL_PLAY_ROOT=$PWD/.local/e2e RO_LOCAL_PLAY_PORT=6299` อย่าใช้ path ยาวๆ เพราะ PostgreSQL socket จำกัดไว้ 103 ตัวอักษร
- `--refresh-compatible-snapshot` ยังใช้ได้ แต่ `--refresh-migrate-saves` ครอบคลุมกว่า ส่วน `--reset-saves-for-new-content` ใช้เมื่อผู้ใช้สั่งให้เริ่มใหม่เท่านั้น

### TASK-029 สกิลสาย Swordsman/Knight/Crusader (done) — content_hash เป็น `5302fe90…`

- engine แบบ generic รองรับทุก effect/status ของสายนี้อยู่แล้ว จึงไม่ต้องเพิ่ม hook เฉพาะ งานหลักคือพิสูจน์ด้วยเทสต์ที่รันข้อมูลจริง
- ไฟล์ใหม่ `src/domain/build/queue-trace.ts` (`catalogQueueTrace`) เป็น dry trace แบบ pure ใช้ค่าพลังถาวรกับ Passive ที่เรียนแล้ว ไม่รวมบัฟชั่วคราว และตรงกับ `queue_estimate` ของ M0 การเพิ่มไฟล์นี้ใน `src/domain` ทำให้ content_hash เปลี่ยน
- **harness ร่วมสำหรับ TASK-030–034:** `tests/game/class-skills.ts`
  - `checkGolden` เทียบ `plan/data/skill-program-cases.json` กับนิยามที่ resolve แล้ว ถ้าเจอ key ที่ยังไม่ได้เขียนตัวตรวจ (เช่น `periodic_raw_intents`, `tick_times_ms`, handler `own_statuses_consumed`) จะ fail ทันที สายอื่นต้องเพิ่มตัวตรวจตรงนี้
  - `probeActive` ร่ายทุกเลเวลใน probe 2v2 แล้วตรวจว่าทุก effect เกิดกับเป้าที่ถูกและตามลำดับ ตอนนี้รู้จัก event ของ damage/apply_status เท่านั้น ถ้าเป็น heal/shield/resource/remove/interrupt/revive/handler/summon ให้ขยายฟังก์ชัน `index`
  - `probePassive` ตรวจทั้ง modifier และ trigger ส่วน `buildAccount` สร้างตัวละครจริงจากบิลด์ใน `plan/data/skills/<root>.json` ซึ่งไม่ได้ ship ใน content และผ่าน `validateAccount`
- แม่แบบเทสต์อยู่ที่ `tests/game/skills-swordsman.test.ts`
  - ตั้ง `RO_TREE_EVIDENCE=plan/evidence/task-0XX-runtime.json` เพื่อบันทึกค่าที่วัดได้
  - AC-04 ขับ `battle.start_story`/`battle.advance` จริง พร้อม `SavedBattleSession.confirm` และ runner
- ข้อควรระวัง:
  - `assert.ok` ที่ไม่มีข้อความทำให้ Node ใช้เวลาหลายนาทีสร้างข้อความ error จากบรรทัดยาว ให้ใส่ข้อความทุกครั้ง
  - บิลด์ (`builds`) และ `skill-program-cases.json` ไม่ได้อยู่ใน content bundle ต้องอ่านจาก `plan/data`
- ยังไม่ได้ทำ:
  - เอฟเฟกต์ในสนามยังใช้ recipe ตามกลุ่ม (burst/buff) ร่วมกัน ส่วนไอคอนแยกรายท่าแล้ว ถ้าจะทำ VFX เฉพาะท่าก็เป็นงาน presentation ล้วน
  - ค่า role ใน evidence เป็นหลักฐานพฤติกรรม ไม่ใช่ผลบาลานซ์ แทงก์ Lv70 ที่ไม่มีของตายใน probe ส่วนนี้ส่งต่อ TASK-041

### รอบต่อมา (20 ต.ค. 2026): D-059 เริ่มไม่มีของ, D-060 ไอคอนขัดร่าย, การ์ดล้น, TASK-030–031 เสร็จ

- **D-059:** `progression.json` ตั้ง `starter_gear.mode=none` และ `equipment.json` ตั้ง `starter_grants.scope=none` ทำให้ `initializeAccount` สร้างช่องว่างทั้งหมด (`slot_progress` ยังครบ) เทสต์ที่ทดสอบกลไกอุปกรณ์ใช้ `tests/game/gear-fixtures.ts` (`equipStarterSet`) ใส่ชุดเดิม id `starter_<ตัวละคร>_<ช่อง>` ให้แทน เซฟเก่าไม่ถูกยึดของ ทีม Lv1 ที่ไม่มีของแพ้บอส 1-10 แต่ Lv3 ผ่าน
- **D-060:** `cast_start` มี `action_id` = cast token และ `cast_interrupt` อ้าง `action_id`/`source_instance_id`/`detail`(ผู้ขัด) ส่วน heal/shield/resource/status/revive มี `action_id`/`source_instance_id`/`effect_id` ครบ Timeline (`src/client/battle-timeline.ts` + `src/ui/skill-timeline.tsx`) ใส่ ⚡ ให้ผู้ขัดและ ✕ ให้ผู้ถูกขัด
- **การ์ดล้น:** `.roster-strip` เป็นกริด 4 คอลัมน์ live test ตรวจว่าไม่มีการ์ดล้นกรอบ
- **harness:** `tests/game/class-skills.ts` รองรับ heal/shield/revive/ลูกแก้ว/periodic golden, `buildActor(root,…)`, `checkDryTraces`, `storyParity` แล้ว สายที่เหลือคือ TASK-032 (Mage), 034 (Merchant: ต้องทำ summon actor factory ที่ engine ยังโยน `MISSING_ACTOR_FACTORY`) และ 033 (Thief: copy skill, detonate)
- **ทีมเริ่มต้น** คือ main, npc_swordsman, npc_acolyte, npc_archer ดังนั้น parity ของสาย Mage/Thief/Merchant ต้องสลับ npc ของสายนั้นเข้าทีมก่อน

### รอบยาว 20 ต.ค. 2026 (ผู้ใช้สั่ง "ทำระบบต่อยาวๆ ให้เล่นได้ครบรวมร้านค้า แล้วค่อย simulate ปรับบาลานซ์/level design")

- **D-061 โบนัสอาชีพ:** `progression.json status_allocation.job_bonus_by_root` (+24 แต้มต่อสาย) ใส่เป็น permanent source ใน `characterBlueprint(actor, content, permanent)` (signature เปลี่ยน ต้องส่ง content) หน้า Stats แสดง "+N" สีเขียว `plan/generators/queue_estimates.py --write/--check` คำนวณ queue estimate ของบิลด์ใหม่ classes.py รวมโบนัสแล้ว
- **สกิลครบ 6 สาย (TASK-029–034 done):** harness `tests/game/class-skills.ts` + `tests/game/skills-<root>.test.ts` ทั้งหมด ตั้ง `RO_TREE_EVIDENCE` เพื่อเขียน `plan/evidence/task-0XX-runtime.json` สคริปต์ปิดงานที่ใช้อยู่ใน scratchpad ไม่ได้อยู่ใน repo (ปิดงานด้วยมือได้ตามแบบ TASK-029)
- **engine ใหม่:** summon factory (`kind:'summon'`, periodic policy, `summon_tick/summon_expiry`, ถูก sweep ออกจาก checkpoint, จุดพิกัดคงที่ในฉาก, render view `summon_of`), event `summon/despawn`, ทุก effect event มี `action_id/source_instance_id/effect_id`, `ModeRespawn` ให้ mode ส่งบอสหลอดถัดไป
- **โหมด:** `src/domain/modes/tower.ts` (TASK-035) และ `src/domain/modes/daily.ts` (TASK-036) คำสั่ง `battle.start_tower/start_daily` + settlement ใน `battle.advance`/`battle.retreat` ทุกจุดที่เดินไฟต์ต้องส่ง `modePolicy(mode, content)` (server, `SavedBattleSession`, Timeline, runner ใส่แล้ว) วันใช้ `bangkokDay(ms)` แบบ pure (ห้ามใช้ Date ใน domain) หน้า UI `tower.tsx`, `daily.tsx`, `GameContext.challenge(target)` เริ่มไฟต์จากหน้าอื่นผ่าน Field
- **live test:** ขั้น `MODES` ใน `scripts/test_game_shell_live.cjs` ใช้ `scripts/game/sign-test-save.ts` (test-only, ต้องมี `RO_SUPABASE_LOCAL_STACK=1`) เขียนเซฟที่ผ่าน 2-10 แบบลงลายเซ็น แล้วเล่น Tower ชั้น 1 และ Daily treasury ผ่าน UI จริง
- **งานใหม่:** TASK-051 ร้านค้า+กาชาอุปกรณ์ (D-063), TASK-052 Option สุ่มตามระดับ (D-062) ลำดับถัดไปที่วางไว้: TASK-052 → TASK-037 กาชาการ์ด → TASK-051 → TASK-038 AFK → TASK-039 → TASK-040 → TASK-041 balance

### ปิดงานรอบ 20 ต.ค. 2026 (ต่อ): TASK-035/036/037/039/040/051/052 → done (45/52)

- **live test ชุดเต็ม** `RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py` ผ่าน 26 checks / 53 ภาพ / 0 browser error (`plan/evidence/task-048-shell-live.json`) มีขั้นใหม่ `FLOW_039` (อัปเลเวล/สกิล/คิว/ทีมผ่าน UI, ขาดเน็ต, โฟกัส, Hi-class) และ `BACKUP_040` ถ้าจะรันเร็วเฉพาะ Tower→Store→Flow→Backup ใช้ `RO_SHELL_ONLY_MODES=1`
- **บั๊ก daily ค้างใน live รอบก่อนไม่ใช่บั๊กเกม**: เกิดจากแก้ไฟล์ src ระหว่างที่ stack รัน (Vite HMR ทิ้ง SaveController/AssetPack) ห้ามแก้ src ระหว่าง live test และใน live test ก่อนแก้ DB ตรงต้องออกจากหน้าเกม (`about:blank`) กันคำสั่งอัตโนมัติ (เช่นย้ายด่านฟาร์ม) ชน revision
- **TASK-039:** `battleDebrief` + `Debrief` (สรุปรายคน), `src/client/guide.ts nextGuide` (quest pill "แนะนำ" จำการปิดใน localStorage `ro-guide-seen`), ชิป Hi-class "เร็วๆ นี้" ในชีต Upgrade, เทสต์ `tests/game/debrief.test.ts`, `tests/game/guide.test.ts`
- **TASK-040 / D-064 สำรอง-กู้คืน:** migration `supabase/migrations/202610200006_save_backups.sql` (ตาราง `game_save_backups` อ่านได้เฉพาะเจ้าของ + `game_commit_maintenance` สำรองแถวเดิมก่อนเขียนเสมอ เก็บ 10 ชุด) คำสั่งใหม่ `save.migrate`, `account.reset` (+เดิม `backup.restore_request` ใช้ `history:N` เมื่อเซฟเสีย หรือ `backup:<uuid>` ย้อนรีเซ็ตครั้งเดียว) จัดการใน `api/index.ts maintenance()` ไม่ผ่าน `decide()` ตัวกันอยู่ใน `src/domain/account/maintenance.ts` (AFK cursor/ตัวนับรายวันไม่ย้อน) ไฟล์สำรอง/สรุปเซฟ `src/domain/build/save-summary.ts` (client ใช้ผ่าน `src/client/backup.ts`, API ใช้ผ่าน re-export ใน account) UI: ตั้งค่า › 💾 สำรอง/กู้คืน (`src/ui/game/backup.tsx`) และ `MaintenancePanel` (checkpoint 409 `SAVE_MIGRATION_REQUIRED` มี before/after, 503 `SAVE_INTEGRITY_FAILED` มี candidate) คู่มือผู้เล่น `docs/SAVE-RECOVERY.md` เทสต์ `tests/game/save-backup.test.ts` + SQL ใน `supabase/tests/storage_ownership.sql`
- **ระวัง:** `scripts/test_storage_postgres.py` เขียนทับ `plan/evidence/task-021-postgres.json` ทุกครั้ง (ตอนนี้เป็นผลรันใหม่ที่รวม migration 001–006 สำเนาอยู่ที่ `task-040-postgres.json`)
- **content_hash ล่าสุด `5b194302…`** (มีคำสั่งใหม่) เว็บส่วนตัว 6173 deploy ด้วย `--refresh-migrate-saves` หลังปิด TASK-040

### งานต่อไป

1. **TASK-048 AC-08 รอผู้ใช้ดูหน้าตาจริง** ถ้าโอเคย้าย `plan/review/tasks_048.md` → `plan/done/` แก้ลิงก์/ตัวเลขใน overview และ acceptance แล้วติ๊ก AC-08
2. **TASK-041 (ถัดไป ผู้ใช้สั่งไว้แล้ว):** simulate แล้วปรับบาลานซ์ + level design ใช้ runner headless (`src/simulation`) กับทีม/บิลด์จริง วัดเวลาเคลียร์ด่าน/ความชันของบอส/อัตราฟาร์ม เทียบเป้า pace ใน design (ปรับทีมได้ราว 30 นาทีครั้ง เป้าใหญ่หลายวัน) เปลี่ยนตัวเลขใน `plan/data/*.json` แล้วรัน M0 checks + manifest + readiness ก่อน `content:generate`
3. TASK-042 ขนาดโหลด/ความลื่น/จอ, TASK-043 build/deploy Vercel Preview **ต้องขออนุญาตผู้ใช้ก่อนสร้าง infra จริง**, 044 RC, 045 production, 046 ส่งมอบ
4. ทุกครั้งที่ deploy เว็บส่วนตัวให้หยุด PID ใน `.local/play/running.pid` แล้วรัน `python3 scripts/play_local.py --refresh-migrate-saves` (สำรอง DB ก่อนเสมอ) ห้ามพิมพ์ `.local/play/private.json`/`login.md`
