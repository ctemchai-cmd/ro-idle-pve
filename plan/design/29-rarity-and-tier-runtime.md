# ผสม rarity และอัป Tier ใน runtime

20ตุลาคม2026 · TASK-028 · canonical equipment.json + protocol23 + equipment27/slots28

`domain/progression/gear-upgrades.ts` แยก `fusionQuote`, `tierQuote`, `fusionCandidates` และ `applyGearUpgrade` ทุกส่วนรับ state/content โดยไม่อ่าน storage/เวลา/RNG และใช้ assignment/definition helpers เดียวกับ inventory ห้ามทำระหว่าง active battle

## Fusion

รับ instance IDs3ใบไม่ซ้ำ ทั้งหมดต้องเป็น equipment/ไม่ได้สวม/ไม่ล็อก/ไม่ใช่training ตรวจrarity/tier/slot/weaponkindตรงกันก่อน mutation หาrarityขั้นถัดไปจากrankตาราง Supremeไม่มีขั้นถัดไป ใช้ feeจากdata (รุ่นแรกฟรี)

เมื่อผ่านจึงหักทุน/ลบสามinstance/สร้างหนึ่งinstanceใหม่ที่`fusion_<request_id>` definition/tierเดิม rarityถัดไป unlocked/nontraining ของเดิมที่สวมไม่มีส่วนเกี่ยวข้อง ค่าพัฒนาช่องยังอยู่กับตัวละคร ผลลัพธ์เข้ากระเป๋า ไม่สวมให้อัตโนมัติ

กระเป๋าเต็มยังผสมได้เพราะจำนวนสุทธิลด2 ไม่มีการทิ้ง rewardหรือสุ่มใหม่ pending bundles/cursor/RNGไม่เปลี่ยน การรับรางวัลหลังเว้นที่ยังเป็นอีกคำสั่งหนึ่ง

`fusionCandidates` เริ่มจากชิ้นที่ผู้เล่นเลือกและอีกสองสำเนาที่เข้าเงื่อนไข เรียง IDแบบASCII ไม่ใช้localeหรือrandom UIแสดงวัสดุสามชิ้น/rarityผลลัพธ์/ค่าพื้นฐาน/ผลถ้าสวมก่อนเปิดยืนยัน ของที่ต้องการเก็บสามารถล็อกเพื่อกันเป็นวัสดุ รุ่นแรกไม่มีrandomsubstatจึงไม่เลือกลบชิ้นต่างค่าสุ่ม

## Tier

ใช้แถวราคาที่ตรง`from→to`เท่านั้น:1→20ราคา1000ทอง/10แร่,20→40ราคา5000/40,40→60ราคา20000/120 รวม26000/170 ไม่ข้ามขั้นหรือย้อนลง อาวุธฝึกหัดอัปไม่ได้

แก้definition_idบนinstanceเดิม จึงรักษาID/rarity/locked/assignmentทั้งหมด ของล็อกอัปTierได้เพราะไม่ได้ใช้เป็นวัตถุดิบ ถ้าสวมอยู่ เจ้าของต้องมีlevelถึงrequired_levelของdefinitionใหม่ก่อนจ่าย ถ้ายังไม่ได้สวมสามารถเตรียมTierสูงไว้ได้ แต่equipยังตรวจlevel/jobตามปกติ

Refine/Enchant/cardsไม่เปลี่ยนและไม่คูณrarityซ้ำ ExampleEpicSword1basefloor(13×1.5)=19→EpicSword20base105 ต่าง86 และEpicSword60base285 ต่าง266จากTier1 ผลต่อบิลด์บวกslot/card sourcesเดิม

## Canonical command และ preview

AccountCommandRules registerสองคำสั่งก่อนgeneric equipment reducers ใช้immutable receipts/CAS/historyเดิม `created_instance_ids`/`removed_instance_ids`ระบุของจริงที่เปลี่ยน ไม่มี refundable ledger ของ tier/fusionในรุ่นแรก ReplayUUIDเดิมคืนreceiptเดิมก่อนตรวจrevision ไม่สร้างชิ้นใหม่หรือกินสามชิ้นซ้ำ

`build/equipment.ts::resolvedEquipmentModifiers` คำนวณrarity×base flatแล้วfloorจุดเดียว ทั้งcompiled sourceและgrowth preview `client/gear-upgrades.ts` ใช้quote/reducerบนclone ถ้าเงินไม่พอเติมเฉพาะยอดขาดในcloneสำหรับpreview ไม่ส่งsnapshotขึ้นserver; serverยังตรวจทุนจริง

Previewถ้าสวมใช้central equipment/Passive/slot compiler เจ้าของที่กำลังสวมได้รับผลจริง ส่วนชิ้นว่างเทียบกับตัวละครที่ผู้เล่นกำลังดู ถ้าตัวนั้นยังใส่ไม่ได้ แสดงbaseผลลัพธ์กับข้อความlevel/jobแทนผลบิลด์ที่ผิด ค่าต่อสู้ที่ลดลงเน้นสีแดงเพื่อให้ตัดสินใจก่อนสวม

## ตรวจรับ

เพิ่ม6unit cases: rarityทั้ง6ขั้น(floor14/16/19/23/28/35ของSword1), invalid/protected recipes, Tierคงinvestment/ค่าใช้จ่ายจริง, level/training gates, fullbag/pendingfixed, poor-wallet preview/combat lock

Auth/API/SQL/Chromeใช้signedLv20/slot/card/gear/fullbag fixturesแยกเซฟส่วนตัว ทดสอบresponseหายหลังtierและfusioncommit พร้อมrefresh/UUIDreplay, protectedcopies/Supreme/levelgate และ390/360 portrait ผลสุดท้าย/ขอบเขตภาพ/sourcehashอยู่ในTASK-028reviewหลังตรวจregressionรวม ไม่อ้างว่าfixturesเป็นของที่ฟาร์มได้แล้ว
