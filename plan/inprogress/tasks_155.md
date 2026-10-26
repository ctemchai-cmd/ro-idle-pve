# TASK-155 — เติมการ์ด M.ATK และบิลด์เวท

Milestone:M4 · D179 · [design68](../design/68-magic-card-options.md)

## งานที่ต้องรอก่อนหน้า
TASK-073, TASK-077, TASK-078, TASK-153 (done). TASK154แยกUIreleaseได้.

## ขอบเขตและผลส่งมอบ
เพิ่มScaraba/Necromancer/Agav/Siroma/ImpจากRO5ใบ,typedconditionalcombatbonusesที่ใช้ร่วมruntime/headless,descriptions/loot/gacha,ภาพจริงและlosslessbudget. ไม่แก้73ใบเดิม/ไม่fullbalancebatch.

## รายละเอียด
ตามdesign68;preservefrozenAFK/oldreceipts,personalMDEFpenจริงไม่ใช่postdamageproc,skillbonusใช้stableIDsและAwaken. คง32MiB.

## ขั้นตอน
1. Freeze73cards/pools/data/schema,verifyprimaryROIDs/ภาพ/งบ
2. ทำtypedprofiles/schema/validation/effecthook/compiler/description
3. Author5cards/rebuildpools/metadata/index/runtime;ตรวจsourcepixelsและmigration
4. Targetedmath/actualengine/native/build/filtered/publicแล้วdone

## เกณฑ์ตรวจรับ
- [ ] AC-01:5ใบจริงครบข้อมูล/ภาพ/ข้อความ/pools;73ใบเก่าและrateคงเดิม;oldAFK/pending/ledgerไม่สูญหาย
- [ ] AC-02:MATK/penetration/skillbonusส่งผลจริงเฉพาะเงื่อนไข/scaleถูก/stack/Aw/checkpoint;schemaผิดreject;ไม่มีRNGหรือhitเพิ่ม
- [ ] AC-03:ภาพlossless/RGBAเดิม/pack32MiB/initialbudget;targeted/native320390/root-filteredbuild/publicผ่าน ไม่มีownerwrites

## วิธีตรวจและหลักฐาน
T155-AC01..03/design68;plan/evidence/task-155-review.json. Realnative/engine+isolatedAPI whereapplicable ไม่อ้างวัดbalanceครบทุกบิลด์.

## Blocker / คำถาม
ผู้ใช้ตอบแล้ว:ผสมMAtk/เจาะเวท/เสริมเฉพาะสกิล.
