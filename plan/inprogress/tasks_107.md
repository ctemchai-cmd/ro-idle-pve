# TASK-107 — Modernทุกอาชีพ ปรับผลสกิล และหน้าสุ่มการ์ดตามไฟล์ผู้ใช้

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · design36/D-138

## งานที่ต้องรอก่อนหน้า

TASK-029–034,TASK-037,TASK-040,TASK-083,TASK-106(done)

## เป้าหมายและขอบเขต

ทำตามsuggestion-migrate.txtล่าสุดครบ:119explicit+7inheritedskill icons,12resource/scrollicons,renames/skillnotes/major damagebudgets70%single50%AoEของFinger,purplethief/AxeVFX และcardrevealUX. คงstableIDs/ownerprogress,ไม่balancebatch/ownercloudwrite/privateenvread/6173restart.

## รายละเอียด

ยึดdesign36และmappingที่อ่านจากไฟล์จริงทุกบรรทัด. Numericที่ไม่กำหนดเป็นassistanttrialและจดชัด. ปรับschema/sharedengineเฉพาะgenericcapabilityที่จำเป็น ไม่hardcodeIDในengine/UI. ทุกผลสกิล/ระดับบอกในdescriptionจริง.

## ขั้นตอน

1. Auditทุกmapping/noteและbeforestate; importเฉพาะภาพเลือกด้วยmetadataและsourcehash
2. ทำidempotentdatachangesและgenerictypedcrit/outcomecontracts
3. ทำdescriptions/nativeeffects/purpletreatment/cardrevealUX
4. ทดสอบfocusedrules+speedparity+savecompat+actualmobile/commandreceipts/build/publicVercelแล้วreview

## เกณฑ์ตรวจรับ

- [ ] AC-01:126skills/12resourcesตรงexplicit/inheritedmapping;sourceunchanged/metadata/SHA/pathguard/reviewจริง;ไม่ใช้รูปอื่นแทนjobicons
- [ ] AC-02:major single70%/AoE50%Fingerทุกlevelตามdesign;Fingers/Asura/SP/spherecostเดิม;ทุกclassnoteมีผลตามไฟล์และidempotentgenerator
- [ ] AC-03:SpellBreakerเฉพาะsuccessfulinterrupt,guaranteed/bonuscritไม่leak,Dispel1→4/CT→0,CC/duration/plant/HoTทำงานจริงและ1×/2×/4×เท่ากัน
- [ ] AC-04:126stableIDs/oldlevels/slots/ledger/items/walletไม่สูญหายในการbackedupmigration;descriptionทุกnote/ทุกlevelตรงresolvedeffectsไม่มีstaleชื่อหรือผลเก่า
- [ ] AC-05:actualmobile320/390ครบ19jobs/skills/loadout/Timeline/resources/scrolls;purpleexceptions/nativeAxeและgachareveal/skip/reducedmotionไม่ล้น/noerrors/noextraHTTPwrites/pity-costเดิม
- [ ] AC-06:requiredassets/M0/readiness/build/focusedchecks/publicVercelตรงSHAผ่าน เก็บภาพและผลจริงก่อนdone

## วิธีตรวจและหลักฐาน

Use task-107-*source audit/per-note coverage/arithmetic/typedengine fixtures/migration/Chrome/publicSHA. Fixed targeted fixtures only, not renewed balance simulation. Preserve failed rounds and correct actual defects without weakening expectations.

## Blocker / คำถาม

ไม่มี;ผู้ใช้ยืนยัน70%single/50%AoEต่อเป้าของFingerและให้ทำทั้งหมดตามไฟล์

## บันทึก

เริ่ม23ต.ค.2026. อีก7inheritedคือDancerEncore/BreathingและRoguecopy5ใช้ภาพของsource skill.

Localreview23ต.ค.:95focusedTS+56uniqueclasstests(all378goldens/per-level;onefailedparityfixturecorrected3-10)/37Python/M0/readiness8/build/assets260-60460-6926ผ่าน. Actual38mobilejobcases+realgacha10/singlepull, native11attacks/1x2x4/interruptผ่าน. [หลักฐาน](../evidence/task-107-review.json). ยังรอpublicreleaseproofก่อนdone.
