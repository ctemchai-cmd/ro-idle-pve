# TASK-062 — PWA ติดตั้งเกมบนมือถือ

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-086, design/30-game-shell-ui.md

## งานที่ต้องรอก่อนหน้า

- TASK-020, TASK-021, TASK-022, TASK-025 (done): browser presentation, Auth และ online-primary saves

## เป้าหมายและผลส่งมอบ

ติดตั้งเกมบนมือถือ/desktopที่รองรับ เปิดจากไอคอนเป็นstandalone portraitเข้า/play พร้อมmanifest/icons/apple-touch metadata และปุ่มติดตั้งหรือวิธีเพิ่มหน้าจอหลัก

## ขอบเขตและรายละเอียด

- Online-primaryเดิม ไม่มีoffline progression/push/background sync หรือการcacheAPI/Auth/checkpoint
- Service workerใช้network navigationเสมอ เก็บเฉพาะหน้าoffline/iconเป็นfallback ไม่precacheเกม/library และไม่reloadกลางไฟต์
- Scope/headers/build allowlist/versioningชัดเจน ไฟล์PWAไม่เปลี่ยนcontenthash/schema/เซฟ ไม่รีสตาร์ต6173

## ขั้นตอนทำงาน

1. เพิ่มmanifest/ไอคอน/metadata/safe-area และservice workerจำกัดcache
2. เพิ่มinstall UXสำหรับnative promptและiOS/manual guide ซ่อนเมื่อstandalone
3. ตรวจproduction buildในChrome: manifest/installability/worker/offline/API isolation/update lifecycle
4. DeployVercelตรวจartifact/headers/หน้าเข้าสู่ระบบ แล้วบันทึกวิธีติดตั้ง

## เกณฑ์ตรวจรับ

- [x] AC-01: manifestถูกต้อง start_url/play, standalone, portrait, icons192/512/maskableและApple180; Chromeอ่านmanifest/workerได้ ไม่มีinstallabilityerrorที่เกิดจากartifact
- [x] AC-02: offline navigationได้หน้ารอเชื่อมต่อ; onlineAPIยังผ่านnetworkและไม่cacheแม้GET/privateheader; authcallbackไม่ถูกเก็บ; SWupdateไม่auto reloadและไม่แตะlocalStorage/เซฟ
- [x] AC-03: installbuttonใช้usergestureกับdeferredpromptครั้งเดียว; iOS/manualguideใช้งานได้; standaloneไม่โชว์ปุ่มซ้ำ; safe-areaมือถือไม่ล้น
- [ ] AC-04: build/type/boundaries/secretguardผ่าน contenthash768e12a4เดิม; Vercelmanifest/worker/icons/headersจริงผ่านโดยไม่มีownercloudwrite/6173restart

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | ChromeCDPmanifest/installability + PNGdimensions/build | ไม่มีinstallabilityerrorบนnormalprofile; icondecode192/512/512/180 | ผ่านlocal |
| AC-02 | realSW/CacheStorage/network offline/API/update tests | cache5publicfilesเท่านั้น; GET/POST/Authnetwork; callback/contentไม่cache; updatewaiting/no reload/storageคงเดิม | ผ่านlocal |
| AC-03 | Chrome native-eventfixture/iOS UA/standalone + mobilelayout | dismiss/accept/fail/usergestureครั้งเดียวผ่าน; iOSguide/standalone/320–390pxไม่ล้น; ย่อauthicon44px | ผ่านlocal |
| AC-04 | production build/versioncompare + hostedreadonlysmoke | build/type/boundaries/secretguardผ่าน contenthashเดิม; รอhosteddeployment | ยังไม่ครบ |

หลักฐาน: [Chrome6กลุ่ม](../evidence/task-062-pwa-browser.json), [build](../evidence/task-062-build.txt) · ผู้ตรวจ: Codex · วันที่: 21 ต.ค.2026 · รอบ review: 1

รอบแรกChromeincognitoไม่อนุญาตติดตั้งจึงเปลี่ยนharnessเป็นnormalprofileเฉพาะทดสอบ รอบสองพบfailedguideถูกพับซ่อน แก้เปิดแสดงทันทีแล้วตรวจผ่าน เก็บround1–3แยก ไม่ลดเกณฑ์ ฝั่งloginแก้ขนาดSVGที่เคยกินviewportด้วยscopedCSS ไม่เปลี่ยนUIเกม

## Blocker / คำถาม

ไม่มีสำหรับimplementation; actualOSinstallationบนiPhoneต้องเจ้าของกดเอง ไม่อ้างว่าdesktopemulationคือการติดตั้งบนเครื่องจริง
