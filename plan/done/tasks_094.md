# TASK-094 — ใบธาตุในร้านค้าและปรับไอคอนธาตุ

Milestone: M4 · D-123

## งานที่ต้องรอก่อนหน้า

- TASK-037, TASK-040, TASK-051, TASK-076, TASK-091 (done)

## ขอบเขตและรายละเอียด

ผู้ใช้ขอใบธาตุในร้านค้าและย้ำว่าเปลี่ยนเฉพาะสกิลweapon พร้อมไอคอนร้านค้าสีและป้ายธาตุสวยขึ้น. ผู้ใช้ยืนยันหนึ่งไฟต์ถัดไป(Story/Tower/Daily). ใบ4ธาตุพื้นฐาน ราคา50gold/ใบ limit99/ธาตุ/วันเป็นauthoredbaseline ปรับในeconomydataได้.

เลือกตัวละครแล้วจองหนึ่งใบต่อคน ยกเลิก/เปลี่ยนคืนใบเก่าก่อนหักใบใหม่. เริ่มไฟต์สำเร็จจึงconsumeการจองของ4คนในทีม ไม่consumeจากAFKpresentation. เก็บoptionalbattle_supplies stock/queuedแยกจากinventoryและwallet เพื่อไม่แปลงresourceหรือgearเป็นconsumable. ใช้weapon_elementในsharedblueprint ไม่แก้damage/fixedskilldefinitions.

## ขั้นตอน

1. เพิ่มdata/schema/typedpureprojection+reducersและsavevalidation/defaults
2. ต่อshop.buy/consumable.prepareและsharedbattlecompiler/consume-on-start
3. เพิ่มstock/characterselector/queueในStorePageและcoloredElementGlyph/compactbadges
4. ตรวจisolatedซื้อ/เตรียม/ใช้/rollback/replay/reload/migrationและmobile แล้วbuild/push/hostedreview

## ผลส่งมอบ

Fourelementscrollsพร้อมpersistenceและใช้จริงในcombat, compactelementUI/colorstoreicon และหลักฐานทั้งrules/mobile/SQL/public

## เกณฑ์ตรวจรับ

- [x] AC-01: ร้านค้ามีใบไฟ/น้ำ/ดิน/ลม ซื้อด้วยทองและเก็บstockแยกจากwallet/gear/card; เลือกmain/NPCเพื่อเตรียมได้ สลับหรือยกเลิกก่อนเริ่มคืนใบที่จอง ไม่มีหัก/ซื้อซ้ำจากresponse-lossหรือUUIDreplay
- [x] AC-02: ใบที่เตรียมมีผลหนึ่งไฟต์Story/Tower/Dailyถัดไปของตัวนั้นและใช้จริงเฉพาะสมาชิกทีมเมื่อเริ่มสำเร็จ; invalidstart/ตัวสำรองไม่เสียใบ ท่าธาตุweaponและตีปกติรับธาตุใหม่ ส่วนfixedelementไม่เปลี่ยน statusendowสกิลยังoverrideตามpipelineเดิม การคำนวณx1/x2/x4ตรงกัน
- [x] AC-03: เซฟเก่าเติมstock/queueว่างผ่านbackup/migrateเดิม โดยไม่ล้างinventory/paidledger/AFK/pity/characters; stock/queueถูกvalidateและpersist พร้อมserverreceipt ไม่มีSQL/envหรือownerwrite
- [x] AC-04: ไอคอนร้านค้าเป็นสีและเข้าร้านได้; ใบธาตุใช้ไอคอนแยกสี/ตัวละคร+stock/คิวเตรียมชัด; ป้ายธาตุสกิลใช้SVGที่สื่อธาตุ/compactอ่านง่ายและตามอาวุธแสดงธาตุที่เตรียมได้ ตรวจmobile320/390/build/focused/actualisolatedAPI-save/publicVercelก่อนdone

Reviewผ่าน4/4AC · 22 ต.ค.2026 · source`3a51292679cd5d101d348191b96cc83987acaced` VercelSUCCESS · [หลักฐาน](../evidence/task-094-review.json)
