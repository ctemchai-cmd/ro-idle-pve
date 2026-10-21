# Inventory และ equipment ใน runtime

20ตุลาคม2026 · TASK-026 · ใช้ canonical equipment/cards/slot-progress จาก M0 ไม่แก้ราคาหรือเพิ่มของใหม่

`state.inventory` เก็บ instance ของอุปกรณ์และการ์ดทั้งหมด รวมชิ้นที่สวมอยู่ เพดาน500นับรวมของสวมด้วย การสวมเป็น reference จาก `(character_id, equipment_slot)` ไป instance เดิม จึงย้ายของได้โดยไม่คัดลอกหรือลบ payload และไม่กินพื้นที่เพิ่ม การถอด/ย้าย/ปลดล็อก/ย่อยยังทำได้เมื่อเต็ม Purchase/การรับรางวัลที่ต้องสร้าง instance ใหม่ตรวจพื้นที่ก่อนหักเงินหรือจ่ายของ

`domain/build/equipment-definition.ts` เป็นจุดกลางของ definition, slot, compatibility และ bound instances `domain/progression/equipment.ts` เป็น reducer/validation ของ assignment/lock/salvage/purchase ไม่เพิ่ม import ย้อนจาก build ไป progression ฝั่ง UI เรียกผ่าน client และส่งเฉพาะ command intent; ไม่มี stat/cost formula ใน component หรือ SQL

คำสั่งที่รองรับ:

| Command | ผลและข้อจำกัด |
| --- | --- |
| equipment.equip | ตรวจ instance/definition/level/slot/weapon job แล้วเอา reference เดิมออกจากเจ้าของเก่าก่อนใส่เจ้าของใหม่ ของล็อกยังสวมได้ |
| equipment.unequip | ล้าง reference ของช่อง ของยังอยู่ใน inventory ค่าพัฒนาช่องพักไว้ |
| equipment.lock | ป้องกันการใช้เป็นวัตถุดิบ/ย่อย เปลี่ยน bool ที่ instance; ใช้กับการ์ดได้ด้วย |
| equipment.salvage | เฉพาะ equipment ที่ไม่ได้สวมและไม่ล็อก ตรวจทั้ง batch ก่อน mutation; ไม่รับ IDs ซ้ำหรือการ์ด |
| equipment.purchase_weapon | Common Tier1 training125ทอง เลือกชนิดตรงอาชีพและไม่สวมให้อัตโนมัติ; idผูก request UUID |

ทุกคำสั่งข้างบนหยุดขณะ active battle การย้ายของจากเพื่อนทำให้ช่องเดิมว่าง UI ระบุเจ้าของเดิมและผลก่อนยืนยัน การเปลี่ยน item ไม่เปลี่ยน slot_progress ของทั้งสองตัว การลงทุนไม่ได้ย้ายตามของหรือ partyposition

Salvage ปกติคืนทอง `10 × (1 + floor(tier/20))` กับแร่ตาม rank×tierfactor จากตาราง Training discard คืน0 ไม่มีการเปลี่ยนเป็นแหล่งแร่ บันทึก `created_instance_ids` / `removed_instance_ids` และ resource_delta จริงใน immutable receipt; replay/response loss ใช้ protocol23 และ CAS เดิม ไม่มีสูตรในฐานข้อมูล

`validateInventory` ตรวจ definitions/kinds, capacity, unique instances/assignments, equipment fit, training restrictions และ card references/slot/capacity ตามRefine ถ้าช่องไม่มีอุปกรณ์ การ์ดและ investmentยังคงอยู่แต่ไม่ให้ผลต่อสู้ `boundItemInstances` รวม card payload ด้วยเพื่อให้ build hash และ presentation key เปลี่ยนเมื่อการ์ดที่ใส่เปลี่ยนระดับ ขณะที่รางวัลใหม่ที่ยังไม่สวมไม่รีเซ็ตภาพไฟต์

## รวม stat และ preview

`domain/build/equipment.ts::equippedSources` คืน typed permanent sources ให้ central resolver:

1. item base: rarity multiplier เฉพาะ add_flat แล้ว floor ราย modifier
2. Refine: source แยกต่อ `(character,slot)` คูณค่าต่อขั้นจาก slot-progress
3. Enchant: source แยกตาม line/level รวม primary modifier ก่อน derived stats เช่น DEX→Cast Speed
4. Card: source แยกแต่ละ instance ใช้ base modifier×level multiplier×card rarity ไม่ floor ก่อน central resolver

ไม่มีการคูณ rarity ของอุปกรณ์ซ้ำกับ Refine/Enchant/card ไม่มีเพดานบัฟใหม่ ทุก source มี owner/origin/definition/instance id และใช้ triggers กลาง `storyParty` กับ `equipmentStats`/skill preview อ่าน compiler เดียวกัน Learned Passives เติมโดย helper เดิม ไม่แก้ allocated primary ของเซฟหรือเพิ่ม AGI/DEX ตามเลเวล

ตัวอย่าง: CommonSword60 เพิ่ม190, Refine10เพิ่ม80, Enchant offense2เพิ่ม10, GoldWeaponCard1 Lv5เพิ่ม24 รวม304จากแหล่งweapon เปลี่ยนเป็นEpicเพิ่มเฉพาะbaseจาก190→285 ดังนั้น PATKต่าง95 และ investmentทุกตัวเหมือนเดิม ถอดอาวุธแล้ว sourceทั้งสี่พักไว้ ใส่กลับได้ค่าเดิม

## ขอบเขตและการตรวจ

หน้าทีมมีหกช่องอุปกรณ์ ไอคอน local ขนาดใหญ่ กระเป๋ารวมกรอง/แบ่งหน้าทีละ40ชิ้น เปรียบเทียบ stat/SI/CT/ACD และเตือนย้ายของจากเพื่อนก่อนกดสวม ย่อยต้องยืนยันจำนวนกับผลตอบแทนก่อน ส่งซื้ออาวุธฝึกหัดแยกจากสวมและแสดงข้อจำกัดก่อนจ่าย

TASK-026 รวม compiler ของ slot investments เพื่อรักษาพฤติกรรมเมื่อเปลี่ยนของ แต่คำสั่งอัป Refine/Enchant/assign/upgrade/salvageการ์ดเป็น TASK-027; fusion/tierเป็น TASK-028 ไม่แสดงปุ่มที่ยังใช้ไม่ได้ให้กดเสียเที่ยว

Unit cases เทียบ preview กับ actual battle snapshot,304/95 hand example,19job weapon map,500instances/pending bundle/atomic batch และ offline build lock Real Auth/API/SQL/Chrome flow ใช้ signed server-owned Lv60/slot/card/500-item fixtures แยกจากเซฟส่วนตัว เพื่อไปถึงขอบเขตโดยไม่อ้างว่าเล่นสะสมทรัพยากรจริง ผลตรวจเก็บกับ task โดย sourcehash; ไม่อ้างว่าผ่านก่อนจบ review

เว็บส่วนตัว6173ยังเก็บ snapshot M2 ตาม [Local play](../../docs/LOCAL-PLAY.md) การแก้ development source ไม่สลับเวอร์ชันของเซฟนั้นอัตโนมัติ
