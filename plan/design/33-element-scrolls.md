# ใบธาตุสำหรับไฟต์ถัดไป — D-123 / TASK-094

ผู้ใช้ยืนยันหนึ่งไฟต์บอส/หอคอย/ดัน ไม่ใช้เวลาผนัง10/30นาที. ราคาทดลอง50gold/ใบ limit99/ธาตุ/วันและ4ธาตุพื้นฐานอยู่economy.json ไม่ใช่ค่าที่ผู้ใช้กำหนด.

## สัญญาข้อมูลและคำสั่ง

Optional `account.battle_supplies={stock:{[definition_id]:count},queued:{[character_id]:definition_id}}` แยกจากwallet/gear/card. Initialize/migrationเติมว่างเมื่อไม่มี คงข้อมูลเดิมเมื่อมี และschema+referencevalidatorตรวจค่า/ตัวละคร/definition. ไม่เพิ่มSQL/envหรือชนิดinventoryitemที่ไปปะปนgear/card.

Shop.buy debitgoldกับgrantstockในreceiptเดียว ใช้UUID/CASเดิม. Consumable.prepareจองหนึ่งใบต่อตัวละครจากstock; เปลี่ยน/ยกเลิกคืนใบเดิม ตรวจstock/overflowก่อนเปลี่ยน. คำสั่งในbattleถูกปฏิเสธ. เตรียมNPCสำรองได้และคงคิวไว้จนได้ลงจริง.

StoryPartyใส่elementในsharedStatBlueprint.weapon_elementสำหรับผู้ที่จองไว้. Buildhashรวมqueuedscrollถ้ามี. หลังcreateBattleสำเร็จเท่านั้น คำสั่งstartทั้งStory/Tower/Dailyล้างreservationเฉพาะteamในtransactionเดียวกับbattlecheckpoint. Failedstartไม่เสียของ. Response-loss/replayอ่านreceiptเดิม ไม่consumeซ้ำ. ไฟต์หนึ่งครั้งรวมแพ้/ถอยทัพตามbattleเริ่มสำเร็จ; preparationที่ยังไม่เริ่มคืนได้.

## การคำนวณและการแสดงผล

ไม่มีตัวคูณเฉพาะUIหรือSQL. Normalกับdamageelement=weaponใช้elementของblueprint/สถานะendowที่มีผลขณะactionตามengineเดิม. Fixedelementเช่นFireBolt/ColdBolt/LightningBoltคงเดิม. Sageendowยังoverridebaselineweaponระหว่างdurationตามเดิม. ใบไม่มีwall-clock expiry จึงให้ผลเหมือนกันที่1×/2×/4×. Farmpresentationไม่consumeใบและรายได้AFKไม่เปลี่ยน.

Storeแยกtabใบธาตุให้4offer+stock/ตัวละคร/คิวจองอ่านได้บนมือถือ ไม่ยืดร้านค้าวัสดุเดิม. ไอคอนร้านค้าเป็นcoloredSVG ป้ายธาตุใช้ElementGlyphร่วมครบ10ธาตุ+weapon ไม่มีemoji และSkillElementsแสดงธาตุที่เตรียมข้างคำว่าตามอาวุธ. รายละเอียด/ตารางOriginยังอ่านauthorityเดียว.

## การตรวจรับ

Focusedซื้อ/จอง/คืน/invalid/overflow/3modestart/bench/weapon-vs-fixed/statusoverride/speed/RNG/migration และactualdisposableAuth/API/Postgres/browser320/390พร้อมbuy/startUUIDreplayและcheckpointจริง. ไม่ใช้ownercredentials/save/preview6173หรือbalancebatch.
