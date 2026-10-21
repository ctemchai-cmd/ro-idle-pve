# พัฒนาบนเครื่อง

ใช้ Node24 และ npm ตาม `.nvmrc` / `package-lock.json` รุ่นเครื่องมือถูก pin ไว้ ขั้นตอนจาก checkout ใหม่:

```sh
npm ci
npm run assets:build
npm run check
npm run build
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://127.0.0.1:5173`) ตอนนี้หน้าเว็บเป็น[เดโมฉากต่อสู้](BATTLE-DEMO.md) เล่นได้โดยไม่ต้องเปิด API แต่ยังไม่มีเซฟ/รางวัล/ฟาร์ม หากพัฒนา API ให้เปิดอีก terminal:

```sh
npm run dev:api
```

API อยู่ `http://127.0.0.1:8787/api/health` และ Vite proxy `/api` ไปที่เดียวกัน ใช้ Fetch entry เดียวกับ `api/index.ts` โดยไม่ต้อง deploy ก่อน `/api/account`, `/api/commands`, `/api/receipts/*` คืน503 `AUTH_NOT_CONFIGURED` จนถึง TASK-021/022 ไม่มีบัญชีจำลองหรือ wallet ชั่วคราวแอบใช้แทน cloud

Tests ใช้ memory repository แยกต่อ test เพื่อตรวจ revision/receipt replay/conflicts เท่านั้น นี่ไม่ใช่หลักฐาน transaction/RLS ของ Supabase ตัวจริง ไม่มี remote infrastructure หรือ credentials จากขั้นตอนนี้

## ข้อมูลและการสร้าง build

แหล่งเดียวของ definitions คือ `plan/data/` ตาม [design index](../plan/design/README.md) Build generator เลือกเฉพาะ definitions/schemas/strings/presentation references สร้าง `src/generated/` อัตโนมัติ ไม่ commit generated files ไม่โหลด payload จากคลังภาพ ไม่รวม review fixtures/example builds เข้าเว็บ

`npm run content:check` ตรวจทั้ง schema และ semantics: IDs/targets/typed params/units/outcome scopes/status bindings/source lifecycle/actor refs/versions Unknown primitives ไม่ถูกข้าม การเปลี่ยนข้อมูล M0 ต้อง review ใหม่และปรับ manifest ด้วย `node plan/checks/build_manifest.mjs` ก่อน generate ไม่ใช้วิธีข้าม checksum

`npm run boundaries` ตรวจ AST ของ imports/re-exports/dynamic imports และ global APIs ตาม `plan/data/module-contracts.json` Pure modules รับ clock/RNG/content ผ่าน parameter ไม่เรียก DOM/network/เวลาเครื่อง/random หรือ locale order ชนิดข้อมูลใน `src/contracts/` generate จาก JSON schemas แก้ schema ต้นทางแทนไฟล์ types

Build ให้ `dist/content-version.json` ซึ่งบันทึก content/rules/schema/implementation hash และขนาดไฟล์ การเปลี่ยนสูตร/ราคา/โค้ด pure เปลี่ยน runtime hash ส่วนการเปลี่ยนรูปไม่เปลี่ยน engine-data hash การเรียง JSON ใช้ ASCII keys และ arrays คงลำดับเหมือนกันทุกช่องทาง

TASK-019 เตรียม selected packใน `runtime/ro/` แล้ว ต้องมีPython3.11+สำหรับ `assets:build/check` การbuildใช้packที่คัดเท่านั้นและตั้งruntime_asset_pack_hashจริง แต่publish_readyยังfalseจนผ่านTASK-043/046 ห้ามcopyคลังassetsทั้งชุดเข้าpublicหรือdeployทั้งrepositoryโดยไม่มีbuild selection

## เครื่องมือที่เลือก

ใช้ Vite8/React19, Ajv2020 สำหรับ Draft2020-12 และ TypeScript6 เพื่อใช้ compiler AST API ที่มีเสถียรภาพ Node24 ตรงกับเครื่องพัฒนาและ [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) ดู [Vite guide](https://vite.dev/guide/) และ [Ajv guide](https://ajv.js.org/guide/getting-started.html) สำหรับเครื่องมือ ไม่ใช่ข้ออ้างว่าผ่าน hosted deployment แล้ว

## Runtime asset pack

`npm run assets:build` อ่านเฉพาะsidecar/checksumจากคลังlocal ไม่เปิดวิเคราะห์ภาพ ไม่ดาวน์โหลดและไม่แก้source Sidecarถูกคัดแยกจากsharedmediaตามfile.path พร้อมACT/STR/anchors/timing/annotationsเดิม ส่วนสูตรสกิลและราคาอยู่ข้อมูลเกมตามเดิม

`runtime/ro/manifest.json` มี126skill→presentation,19job/36presets,recipes,เสียง/ฟอนต์,รายชื่อไฟล์และchecksum ใช้ `src/renderer/asset-locator.ts` แปลงassetIDหรือsource meta pathเป็นversioned URL ห้ามอนุมานนามสกุลหรือsidecarจากimagebasename Recipe.runtime/recipe_pathเดิมเป็นprovenance ใช้embeddedrecipesและrenderer adapterในbundleเท่านั้น

Viteเสิร์ฟ `/ro/manifest.json` กับเฉพาะไฟล์ที่อยู่ในpackผ่าน `/ro/<packhash>/...` Native `assets/ro` ยังคงdeny Buildคัดpayloadเดียวกันไปdist/roและตรวจhashตรงกับcontent manifest หลังrebuildpackให้restartdevserver

ไฟล์packรวมราว22MB แต่โหลดdefaultsceneเพียงบางส่วนและโหลดงาน/เพศ/ฉาก/เสียงอื่นตามต้องใช้ UIpanelวาดCSSและใช้ไอคอนที่คัดแล้ว รายงานinitialprofileเป็นงบscenario4Class1ชาย/ด่านแรก/ปิดเสียง ไม่ใช่ผลbrowsernetworkหรือการวัดทุกทีมที่ผู้ใช้เลือก

สำหรับขั้นdeployในTASK-043: source uploadต้องมีselected runtime/ro,sourcecode,authored gameJSON/schemasและbuild toolsพร้อมmanifest ห้ามคัดคลังต้นทาง/node_modules/archivesไปweb output ปัจจุบันเก็บ `runtime/ro` ในGitเป็นartifactเพื่อbuildจากcheckoutใหม่ได้ และใช้ `.vercelignore` ลดCLIupload `assets:check` ตรวจartifactได้โดยไม่มีคลังต้นทาง ส่วนrebuildต้องทำบนเครื่องที่มีsource assets ดู [DEPLOYMENT.md](DEPLOYMENT.md) การเตรียมconfigยังไม่ใช่ผลทดสอบhosted deployment

Simulation CLI and replay/report contracts: [SIMULATION.md](SIMULATION.md). The six bundled probes are not a balance verdict or an account progression simulator.

Auth/SQL setup and the limits of local versus hosted evidence: [SUPABASE.md](SUPABASE.md). `/auth` is optional for the battle demo; missing config shows a status, never a fake login.
