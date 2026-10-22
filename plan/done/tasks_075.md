# TASK-075 — โหลดภาพหลังอัปเดตได้แม้มือถือมี manifest เก่าค้าง

Milestone: M4 · อ้างอิง D-101

## งานที่ต้องรอก่อนหน้า

- TASK-019, TASK-062, TASK-073: runtime asset pack / PWA / pack รุ่นใหม่ (done)

## เป้าหมายและขอบเขต

แก้ข้อความ “ยังเตรียมภาพไม่ได้ กรุณาโหลดหน้าใหม่” ที่เกิดจาก browserเก็บ `/ro/manifest.json` เก่าด้วยimmutable1ปี กฎ `/ro/:hash/:path*` จับmanifest.jsonเป็นhashและทับno-store การโหลดpackต้องดึงmanifestปัจจุบันและยังตรวจexpectedhash ไม่ล้างstorage/Auth/เซฟ ไม่เปลี่ยนกติกา/ข้อมูลเกม/แพ็กภาพ ไม่รีสตาร์ต6173

## รายละเอียดและขั้นตอน

1. บันทึกactualproduction Cache-Control ที่ผิดและcurrentpack/content hashes
2. จำกัดimmutableheaderเฉพาะhashhex64ตัว และให้AssetPack.openใช้fetchcache:no-storeเฉพาะstablemanifest เพื่อข้ามresponseเก่าที่browserมีอยู่แล้ว; hashedmedia/sidecarsคงimmutable
3. ตรวจmismatchยังreject, realChromeHTTPcacheold→new/reload/nativeimages/data sentinelไม่หาย และbuild/type/boundaries/secrets
4. PushและตรวจactualVercelheaders/Cold-Warmpublicdemo startupพร้อมภาพจริงก่อนdone ไม่มีownercredentials/APIwritesหรือbalance simulation

## เกณฑ์ตรวจรับ

- [x] AC-01: `/ro/manifest.json` และqueryvariantsบนproductionเป็นno-store; hashedmedia/metadataยังimmutableและexactbytesเดิม Headerpatternไม่ครอบstablemanifest
- [x] AC-02: Chromeที่มีoldmanifestfreshimmutableอยู่ในHTTPcacheยังโหลดexpectedcurrentpack/scene/nativecardได้โดยไม่clearcache/storage และreloadอีกครั้งได้; wrongpackhashยังreject ไม่มีgameplay/content/schema/packhashเปลี่ยน
- [x] AC-03: build/type/boundaries/secrets/targetedchecksและactualhostedmobileassets startupผ่าน พร้อมบันทึกrootcause/ข้อจำกัด ไม่เขียนownerเซฟ/ไม่restart6173

## วิธีตรวจและหลักฐาน

FocusedAssetPack tests + actual isolatedVite/mobileChromeHTTPcache rollover test + publichostedheaders/demo/images/HTTPcache evidence เก็บpre-fixfailureและpost-fixpass ไม่มีsimulation/calibrationrunner

## Blocker / คำถาม

ไม่มี แก้frontendcacheเท่านั้น ไม่ต้องSQL/envหรือถามกติกาใหม่

## บันทึกการทำงานและ review

- 22ต.ค.2026: ยืนยันproductionstablemanifestตอบ `public, max-age=31536000, immutable` ทั้งที่configมีno-store เพราะbroadrouteทับกัน แก้แล้วและตรวจlocal/hostedผ่าน

- Localตรวจผ่าน: realChromeHTTPcache3กลุ่ม/actualoldmanifestf57→c7/refetch+nativecard+2pageboots/sentinelintact, headerpattern4กรณี, focusedAssetPack4, build/type/boundaries/secrets/contenthashและpackhashเดิม. รูปcache-recovered-mobileเปิดดูจริง Vercelheadersและpubliccold/warmstartupผ่านแล้ว ทุกACผ่าน

- Hostedตรวจผ่าน2กลุ่มจริง: stablemanifest+queryเป็นno-store, nativePoringWebP/metaยังimmutable/SHAเดิม; cold/warmmobilepublicdemoใต้PWAworkerมี4nonblankportraits/scenery, manifestไม่มาจากHTTP/SWcacheแต่mediareuseHTTPcache, sentinelsคง/0mutation ภาพhostedบันทึก390×844และตรวจพิกเซลnativeportraitsจริง
- Source`67c5d03f1e2b6225745f497c1f34b0917e318bdb` VercelReady/actualhostedผ่าน ไม่ต้องSQL/env/migrateเพิ่มเติมจาก075 เพราะcontent/packhashเดิม ให้ผู้ใช้ปิดเปิดหรือreloadเกมครั้งเดียว ไม่clearstorage/Auth/เซฟ

อ้างอิง API/config: [Vercel headers และ regex source](https://vercel.com/docs/project-configuration/vercel-json#headers), [Fetch cache:no-store](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) ข้อสรุปปัญหาอิงactualproductionheadersและrealChromeHTTPcache ไม่ใช่การเดาว่าServiceWorkerเก็บเซฟ

ผู้ตรวจ: Codex · วันที่22ต.ค.2026 · ผล: ทุกACผ่าน actualevidence; physicalAndroid/owneraccountไม่ได้เข้าถึง
