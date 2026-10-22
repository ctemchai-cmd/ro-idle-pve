# TASK-083 — ระดับการ์ดตามความแข็งแกร่งมอนสเตอร์และสีขอบไอเทม

Milestone: M4 · D-109

## งานที่ต้องรอก่อนหน้า

- TASK-073, TASK-080, TASK-081 (done)

## ขอบเขตและรายละเอียด

คำตอบล่าสุดแทนแนวคิดสุ่มrarityหลายระดับต่อมอนสเตอร์: การ์ดแต่ละชนิดมีระดับคงที่ มอนอ่อนCommonเทา/มอนเก่งUncommonเขียว/Elite Rareฟ้า/Mini Epicม่วง/MVP Legendaryทอง ปัจจุบันเปิด5ระดับ Immortal/Supremeเตรียมไว้แต่ไม่สร้างหรือดรอป ใช้primaryrAthena pre-re level/class/MvpExpระบุความแข็งแกร่งและประเภท thresholdsNormal<=20/<=45/>45เป็นbaselineเกมเรา ไม่อ้างROPCมีสีการ์ดนี้ตรงทุกภาค

เก็บ66IDs/art/effects/level1–5/slots/paidcostsเดิม เปลี่ยนrarityพลังและdropตามคำขอ สืบทอดinventory/pending/assignedIDs/lock/levelและoldfrozenAFKโดยรักษาพลังและsalvagedustเดิมด้วยoptionallegacy_quality floor ไม่คูณเพิ่มซ้ำ ไม่มีSQL/env/assetsใหม่หรือbalancebatch/ownerwrite/6173restart

## ขั้นตอนการทำ

1. Audit66monstersจากsourceและเก็บclassification; authoredspecเป็นauthorityเดียวของfixedrarity
2. Extendtypeddata/schema/migrationและsharedpower/salvage สร้างfarm/gacha/Towerให้คงrarechance1–2%แต่fixedmonsterquality มีGachaRare+/Legendarypityและfuturelevelsปิด
3. ใช้สีขอบไอเทมทุกcardframe/bag/socket/mini indicator/details/reveal/farm แสดงrarityและประเภท/Eliteแยกชัด พร้อมกรอง/เรียงตามระดับ
4. ตรวจfocusedmath/legacyrefundfloor/frozenprofile/replay/fullbag/currentcreationpaths, M0/build/type และactualdisposablemobile/Auth/SQL
5. Push/deploy ตรวจnewpublicdata/UI/API/login/PWAก่อนreviewdone

คำขอเพิ่มD-110/D-111: Add Cardเรียงว่างก่อน/สวมท้ายพร้อมป้ายเจ้าของชัด, Refine/Enchantbadgeเล็กแยกบนgearicons, คำอธิบายข้างรูปและตรึงปุ่มใส่การ์ดให้listเลื่อนแยก ไม่ต้องเลื่อนหาปุ่มล่าง

## ผลส่งมอบ

- singlefixedraritycatalog66ใบ + sourcefacts และcanonicaldesign31
- sharedcardrarityhelpers/newdropfactories/backedupmigration/consistentUI
- reproduciblefocusedและactualbrowser/hosted evidence

## เกณฑ์ตรวจรับ

- [ ] AC-01: 66IDsมีfixedrarityตามweak/strong/Elite/Mini/MVPครบ SourceMini6=MVP11ถูกต้อง AbysmalKnightเป็นEliteไม่ใช่MVP ไม่มีImmortal/Supremeสร้างในรุ่นนี้; same monsterทุกสำเนาระดับเดียวกัน
- [ ] AC-02: Inventory/pending/assignment/level/lock/ledgerคงเดิม migrationidempotent; oldpower/procs/penalties/salvagedustไม่ด้อยลง ไม่มีdoublemultiplierหรือลบของ
- [ ] AC-03: Farmchance1–2%/5minและ12hcapเดิม frozenoldchance/pool/quality/RNGเก็บก่อนclaimครั้งเดียว จากนั้นv3fixedrarity; gachaRare+10/Legendary30pityคงcounterและราคา/Towerfixedcards/retry/fullbagถูกต้อง
- [ ] AC-04: Bag/picker/socket/equipmentcardframes/detail/farm/revealใช้สีเทาเขียวฟ้าม่วงทองตามactualcardrarity ภาพเต็มmask กรอง/เรียงและElite/Mini/MVPอ่านได้ที่320/390px ไม่มีinspectionwrite
- [ ] AC-05: Focusedtypedmath/migration/drop/gacha/slots checks, M0/build/type/boundaries/secretsและactualmobile/Auth/API/SQLผ่าน มีภาพจริงและจำกัดscopeไม่อ้างwholebalance/physicalAndroid
- [ ] AC-06: Push/VercelSUCCESS/publicnewdata/UI/CSS/API/hash/login/PWAผ่านก่อนdone ไม่มีownercloudwrite/6173restart/newSQL/env/assetsหรือbalancebatch

- [ ] AC-07: Add Cardว่างก่อน/สวมท้ายตามเจ้าของจริง ป้ายสวมอยู่ชัด คำอธิบายอยู่ข้างรูป และปุ่มใส่/ย้ายตรึงมองเห็นแม้รายการยาวที่320/390px; R+Refine/EEnchantแสดงจากslotownerโดยไม่ทับframe/ป้ายอื่น ไม่มีAPIขณะดู/เลื่อนหรือย้ายprogressตามitem

## Review

รอหลักฐานจริง
