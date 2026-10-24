# P.ATK/M.ATK, รางวัลชนะและ Auto Battle — D164

## คำอธิบายและบัฟ

ใช้ P.ATK สำหรับ physical_attack/physical_power/sp_burst_power และ M.ATK สำหรับ magical_attack/magical_power/healing_power. ข้อความอ่าน resolved effect จริงทุก rank รวม Passive/HoT/Timeline/การ์ด. บัฟ attack_up ที่แจก allies เพิ่ม magic_up อีก effect โดยใช้ target/ratio/chance/ระยะเวลาเดียวกัน; ไม่เปลี่ยน attack_up ทั่วเกมหรือบัฟ self. ครอบคลุม Knight Battle Cry, Impo, Loud Voice, Weapon Perfection, Maximum Overthrust และ Bard Battle Song. Awaken สืบทอดเพิ่มเวทและรักษา rider เดิม. แยก status instance/expiry ไม่มี cap/refresh.

## รับรางวัล

Client รุ่นใหม่ส่ง battle.finish พร้อม collect_rewards:true (optional เพื่ออ่าน/replay client เดิมได้). ใน transaction เดียวกับจบไฟต์ชนะ Story/Tower: reserve ฟาร์มเก่า, เพิ่ม first clear, จ่าย pending Story/Tower/Farm ที่รับได้ผ่าน claimRewards เดิม และย้ายฟาร์มไป frontier ถ้าเดิมตาม frontier อยู่. จุดฟาร์มเก่าที่เลือกเองยังคงอยู่. ไม่จ่ายรางวัลซ้ำจาก replay/แพ้ และไม่รับ Daily โดยปริยาย. Receipt เดิมแสดง resource_delta/created_instance_ids เป็นผลรับจริง ไม่คาดเดารางวัลจากหน้า UI.

ถ้ากระเป๋าเต็ม ให้เก็บ fixed claim ไว้ ไม่ยกเลิกผลไฟต์หรือ reroll. แสดงสถานะรางวัลรอพื้นที่และหยุด Auto. เมื่อกลับหน้าแรกและมีพื้นที่ writer พร้อม จึงรับรายการนั้นอัตโนมัติหนึ่งคำสั่ง; unknown response ใช้ SaveController intent/UUID เดิม. AFK ที่ยังไม่ได้ reserve ยังคงรับผ่านหีบตามปกติ ไม่มี recurring save เพิ่ม.

## Auto Battle

ใช้ shared battle engine และ start/finish เดิม ไม่มีสูตร/clock/speed/รางวัลใหม่. ตัวควบคุมฝั่ง client รับ confirmed outcome ทีละ battle_id; ชนะ reset แพ้และหา frontier ถัดไปจาก shared Story/Tower view. แพ้หรือหมดเวลาลองด่านเดิมจนแพ้สามครั้งติดกันตามที่ผู้ใช้ยืนยัน; ชนะ reset ตัวนับ. ไม่ข้าม release lock และไม่เล่น Daily อัตโนมัติ.

ปุ่ม Auto บนหน้าแรกและหอคอย, ปุ่มหยุดมองเห็นระหว่างไฟต์/ช่วงรอถัดไป. การหยุดไม่ถอยหรือเสียไฟต์ปัจจุบัน แต่ห้ามเริ่มครั้งถัดไป. ช่วง intro ก่อนส่ง start ต้องยกเลิกได้ด้วย token. เริ่มถัดไปหลัง finish commit เท่านั้น เว้นผลสั้น ๆ ให้ดู/หยุด. เปลี่ยนหน้า/ซ่อนแท็บ/เน็ตขาด/error/reload/เปลี่ยนเซฟหยุด Auto; ไม่ persist auto intent หรือเริ่มต่อหลัง reconnect เอง. ป้องกัน duplicate receipt/rerender และ single-flight ด้วย ref + SaveController เดิม. สถิติ/Timeline ผลล่าสุดยังเปิดได้เมื่อหยุด.

## ตรวจรับ

Unit: all152×base/Awaken×10 descriptions, six party buffs exact ratio/expiry, actual effect stack; atomic win+farm+receipt/replay/fullbag; pure auto retry/win/reset/duplicate/stop. Actual disposable Auth/API/SQL/mobile: หลาย win ต่อเนื่อง, retry จนหยุด, manual stop ใน intro/ระหว่างไฟต์, ผลรับทันที, response-loss/reload, no recurring battle save,320/390. Public hosted ตรวจ hash/bundles/คำอธิบาย/หน้า login โดยไม่ใช้ owner account. ไม่มี SQL/env ใหม่.
