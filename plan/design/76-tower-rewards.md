# D187 — รางวัลหอคอยหลายชนิดและชั้นสำคัญ

ผู้ใช้ขอเพิ่มทอง, Crystal สำหรับสุ่ม, การ์ดสุ่ม, คู่มือสกิล, Refine และ EXP ให้คุ้มค่าลงหอคอย; ผง Enchant อยู่ในชุดวัตถุดิบด้วย. TASK163. ไม่เพิ่มเศษ Awaken โดยตรง.

## กติกาและขอบเขต
ผ่านครั้งแรกชั้นใหม่เท่านั้น, รับอัตโนมัติผ่าน battle.finish/collect_rewards เดิม. ท้าซ้ำ/แพ้/timeout ไม่ได้รางวัล. ไม่มี reset หรือการชดเชยชั้นเก่าที่ย้อนหลัง. คง highest floor, pending rewards เก่า, inventory, gacha pity, enemy curves/skills/speed, Story/AFK/shop ทุกค่า. Content update ใช้ backup/migrate เดิม, ไม่ต้อง SQL.

## ตารางรางวัล
ทุกชั้น f: ทอง 1500+250f, EXP 1000+200f. วนคู่มือสกิล ceil((60+4f)/10), Refine ceil((100+5f)/10), Enchant ceil((40+3f)/10) ทีละชนิด.
ชั้นหาร5ลงตัวเพิ่มทอง/EXP ฐานอีก1ชุด + Crystal50, คู่มือ15/Refine20/Enchant10.
หาร10ลงตัวเพิ่มฐานอีก1ชุด + Crystal50, คู่มือ15/Refine20/Enchant10, การ์ดสุ่ม1ใบ.
หาร20ลงตัวเพิ่มฐานอีก1ชุด + Crystal100, คู่มือ30/Refine40/Enchant20, การ์ดสุ่ม1ใบ.
โบนัสเป็นการบวก ไม่คูณซ้อน: ชั้น10รวมฐาน3ชุด/Crystal100/การ์ด1; ชั้น20ฐาน4ชุด/Crystal200/การ์ด2. ยังใช้ card pool/tier ตาม Story เดิม, RNGเดิมหนึ่งครั้งต่อใบ, ไม่แตะ pity.

100ชั้นแรกทั้งหมด: ทอง1,940,000 / EXP1,525,000 / คู่มือ1,504 / Refine1,963 / Enchant1,051 / Crystal2,000 (20pulls) / การ์ด15. เป็นรางวัลครั้งเดียวเมื่อไต่ผ่าน100ชั้น ไม่ใช่อัตรารายวัน. เทียบ Refine+5หนึ่งช่อง11,000gold/120ore และ+10รวม77,000gold/440ore ก่อนความล้มเหลว; วัตถุดิบช่วยได้จริงแต่ไม่แจกอัปเต็มทั้งทีม. AFK12hยัง480Crystalตามเดิม.

## โครงสร้าง
reward_schedule แบบtyped base/rotation/milestones เก็บใน tower.json. Content boundary ตรวจ keys/integers/divisor/periods; pure scheduledTowerRewards รวมแบบsafe integers. TowerRow.reward_resources กับgold/crystal/card_count aliases และ Python authored100rows ใช้สูตรเดียว. Legacy generator fields เป็น fallback สำหรับ frozen content เก่า. ไม่มีรูปแบบเซฟใหม่.
UI แสดงชนิด/จำนวนจริงทุกชั้น และพรีวิวชั้นสำคัญถัดไปจาก schedule พร้อม native resource icons; ไม่ใส่ข้อความสอนยาว.

## เกณฑ์ตรวจ
AC01:100authoredrowsตรงsharedgenerator, budget/rulesตามตัวอย่าง1/5/10/20/100, stats/bosses unchanged, invalidconfig/ปฏิเสธ overflow.
AC02:command first-clear auto-collect ครบทุกresource/cardครั้งเดียว, replay/loss/timeoutไม่จ่าย, inventory-fullพักpendingไม่หาย, retryไม่เพิ่มรางวัล.
AC03:migrateรักษาhighest/pendingoldrewards/wallet/investments, firstnewfloorจ่ายใหม่ ไม่grantย้อนหลัง.
AC04:actualReact320/390แสดงnativeicons/ตัวเลขครบไม่ล้น, M0/fullTS/build/publicartifactผ่าน, pack/SQL/env unchanged.
