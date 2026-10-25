# TASK-151 — เอฟเฟกต์พื้นทุกสายจาก native assets

Milestone: M4 · D175 · design64

## งานที่ต้องรอก่อนหน้า
TASK-146, TASK-149

## ขอบเขตและผลส่งมอบ
ตรวจทุกสกิลในcatalog แยกสนามต่อเนื่อง/เพลง/พื้นแบบครั้งเดียว/สกิลอื่น. แก้สนามที่หายก่อนหมดผลหรือใช้ภาพคนละหน้าที่: Sanctuary,StormGust,Quagmire,VenomDust,Demonstration,PsychicWave,Gospel,Moonlit,AnkleSnare และวงเพลง8ท่า. ใช้nativeSTR/textureจริง;ไม่เพิ่มrange/damage/สถานะหรือเปลี่ยนเซฟ. อ้างอิงแหล่งและการadaptชัดเจน. ลดruntimeJSONอย่างรักษาค่าเพื่อให้ทั้งหมดอยู่32MiB;sourcefiles/pixels/timingไม่เปลี่ยน.

## ขั้นตอน
1. Auditทุกskill/presentationและsource;ดูnativeที่เลือกจริง
2. เพิ่มtyped ground-field config/projection/anchor/lazy loader แยกจากengine;วงตามactualstatusหมดแล้วหาย/reducedmotionแสดงนิ่ง;recast/หลายเป้าไม่ทับสนามซ้ำ
3. เติมnativeQuagmire/poison/fire/trap/meteorและsongtextureที่ตรงหน้าที่;losslessruntime-sidecarencoding
4. ตรวจBase/Awaken/borrowedenemy/expiry/interrupt/position/1x2x4/native320390/boundedcost;assetintegrity/build/publicVercel

## เกณฑ์ตรวจรับ
- [ ] AC-01: catalogทุกสกิลมีclassificationชัด;สนามต่อเนื่องอ่านstatussource/type/expiryจริง ไม่ใช้timerเดา;แสดงครบผล/ตำแหน่งจริง/ซ้อนหลายเป้าไม่คูณภาพ/ไม่มีผลไม่สร้างสนาม;Base/Aw/borrowedenemyและreducedmotionผ่าน;engine/stat/saveSHAเดิม
- [ ] AC-02: nativeภาพตรงหน้าที่พร้อมsource/ขอบเขตvisualreview;เพลงใช้textureตามmappingจริง;static/mobile320390/boundedcostไม่บังตัวเลข;โหลดก่อนdraw;runtime32MiB/initialไม่โต/JSONและmediaมีค่าเดิมทุกไฟล์/sourcechecks/build/hostedผ่าน

## วิธีตรวจและหลักฐาน
Typed projection+actual shared engine;native Canvas/drawImage traces/mobile captures;allsidecarsJSON equality/mediaSHA;source30460460/build/publicread-only. plan/evidence/task-151-review.json.

## Blocker / คำถาม
ไม่มี. ไม่owner/AuthSQL/env/6173/agents/balancebatch.

## ผลตรวจlocal

34focused/native7groups(20Base-Awสนาม+8เพลง+6instant)/23mobilecaptures/1x2x4/source30460460/packcheckผ่าน. ทุก894sidecarJSON.parseเท่าต้นฉบับ/ทุกmediaSHAเดิม. Floorblackmattekeyทำครั้งเดียวตอนprepare;glow/songringใช้additiveไม่มีกรอบดำ. ขนาดinitial1600070ต่ำกว่า1621492. รอrootbuildและpublicreleaseก่อนdone.
