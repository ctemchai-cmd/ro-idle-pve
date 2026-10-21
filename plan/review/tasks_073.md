# TASK-073 — การ์ดมอนสเตอร์ RO / Mini / MVP และดรอปฟาร์มตามด่าน

Milestone: M4 · อ้างอิง D-099

## งานที่ต้องรอก่อนหน้า

- TASK-017, TASK-027: shared effects และ card slots (done)
- TASK-038, TASK-040: AFK reservation และ backed-up migration (done)
- TASK-072: แก้ Healing Song ก่อนตามลำดับคำขอผู้ใช้ (done)

## เป้าหมายและผลส่งมอบ

แทนชื่อสมมติ/skill-symbolของการ์ดด้วยการ์ดมอนสเตอร์จริงในRO มีNormal/Mini/MVP รูปcardbmpจริงเก็บlocal/meta อ้างอิงชื่อ/ช่อง/จุดเด่นจากROofficialและrAthena (ระบุว่าemulator) คงinstanceเดิมของ60definitionIDsและเพิ่มMini6ใบ รวม66ใบ โบนัสปรับเข้าระบบidle/คุณภาพ/levelเดิม ไม่อ้างcopyสูตรPCทั้งหมด

## ขอบเขตและรายละเอียด

- Source catalogแต่ละใบมีROitemID/monsterID/ชนิด/ช่องต้นทาง/ลิงก์reference/คำอธิบายจุดเด่นและadaptationที่ใช้จริง เกราะรองรับการ์ดshieldเพราะเกมมี6ช่องไม่มีshield ไม่แปะMVPให้monsterธรรมดาอย่างAbysmalKnight
- ภาพROcardจริงจากpublicragassets cardbmp endpoint ไม่ใช้ไอคอนสกิลแทน อ่านsidecarก่อนภาพ/เก็บchecksum/provenanceและlosslessWebPที่pixels/dimensionsเดิม หากภาพขาดต้องหา/ระบุจริง ไม่สวมรูปผิดตัว Rawpackbudgetปรับจาก27เป็น32MiBเพื่อเพิ่มภาพการ์ดที่โหลดเมื่อใช้ โดยคงinitialprofile≤8MiB ตรวจขนาดจริง ไม่ส่งfullassetlibrary
- Farmจากreservationเดิมมีcard rollต่อรอบ5minจากloot RNGที่บันทึก ไม่ผูกกับมอนภาพ/kill/FPS/speed โอกาส20→40%ตามบท คุณภาพและpoolสูงขึ้นเมื่อด่านหลัง เปิดMini/MVPในบทหลังและให้rareweights ไม่มีguaranteeทุกด่านที่สูงกว่าต้องได้ใบดีกว่าทุกroll
- Freezecarddrop profileในrate_snapshotแบบoptionalเพื่ออ่านเซฟเก่าได้; migrationเปิดprofileใหม่โดยไม่retroactiveจ่ายซ้ำ/ reroll claimเก่า การ์ดเดิมคงID/level/rarity/lockและinventory; หากช่องเปลี่ยนเพราะแก้ตามROให้ถอดคืนกระเป๋าอย่างชัดเจนไม่ลบ/ลดlevel/refundราคาใหม่
- กาชา/รางวัลยังใช้poolเดียวกัน/bronze-silver-goldเดิม; monstergradeแยกจากqualityและแสดงชัดในUI ขอบเขตไม่มีbalance simulationใหม่/ไม่มีSQL/env/ownerwrite/6173restart

## ขั้นตอนทำงาน

1. ตรวจreference/artsourceแล้วauthor66cardcatalog/generatorและprovenance; คงstableIDs ปรับslots/bonuses/ภาพจริง พร้อมMini6
2. เพิ่มsharedfarm card drop profileและpureweightedroll พร้อมcheckpoint/schemaoptional/migration; UIแสดงโอกาสตามด่านและgrade/ภาพ/ผลการ์ด
3. ตรวจทุกreference/grade/asset/ID, RNGpartition/offlinecap/retry/fullbag/snapshotmigration/oldcardpreservation และtriggerสำคัญด้วยfocusedchecks ไม่รันfullbalance
4. Assetchecks/M0/content/build/type/boundaries/secrets/actualisolatedChrome+SQL/hostedและหลักฐานการ์ดearnedจากclaimจริง

## เกณฑ์ตรวจรับ

- [x] AC-01: 66ใบมีชื่อมอนสเตอร์ RO / ROitemID / monsterID / sourcegradeและlocalcardartถูกตัว ไม่มีชื่อสมมติหรือskillsymbol; sourceกับadaptationแยกชัด และMVP/Miniไม่จัดจากการเดาชื่อ
- [x] AC-02: ฟาร์มออนไลน์/AFKได้การ์ดตามseededreservation/5minroll/profileของด่าน; ด่านหลังเปิดpool/qualityดีขึ้น โอกาสถูกแสดงตามdata; splitinterval/12hcap/retry/fullbag/oldpendingไม่จ่ายซ้ำหรือreroll
- [x] AC-03: การ์ดเดิมทั้ง60IDsยังอยู่ level/quality/lock/inventoryไม่หาย; migrationถอดเฉพาะใบที่ช่องไม่ตรงกลับกระเป๋า snapshotเก่าไม่retroactiveดรอป และeffect/triggerที่เพิ่มทำงานในsharedpipeline
- [ ] AC-04: UIเห็นภาพจริง/ชื่อ/Normal-Mini-MVP/slot/ผล ทั้งbag/slot/gacha/reward; actualChrome claimและใส่การ์ดผ่าน M0/assets/build/type/boundaries/secrets/hosted ไม่มีownerwrite/6173restart/balance simulation Rawpack≤32MiBและinitial≤8MiB

## วิธีตรวจและหลักฐาน

Focusedcard/farm/migrationunitcases/assetmetadatachecks + realisolatedAuth/Postgres/mobileChrome + productionbuild/hostedsignedout ไม่มีownercredentials

## Blocker / คำถาม

ไม่มี ทำตามคำขอและใช้ระบบstack/qualityเดิม ไม่ต้องถามเรื่องกติกาที่ตกลงแล้ว

## ผลตรวจจริง

ผ่านsource/art66ใบ, focusedrules84+14overlap/Python35/M0/build/type/boundaries/secrets และactualmobileChrome5กลุ่มแล้ว รอhostedหลังpush เก็บfailedroundsที่เป็นbudget/authoring/testfixtureไว้ ไม่อ้างfullbalanceหรือownerเซฟถูกเปลี่ยนแล้ว

หลักฐาน: `plan/evidence/task-073-074-ui-live.json`, `task-073-local-stack.json`, `task-073-card-targeted.txt`, `task-073-rules.txt`, `task-073-build.txt`, `task-073-presentation.txt` และภาพในevidenceที่เปิดดูจริง; ACที่รอhostedยังไม่ผ่าน
