# TASK-078 — เพิ่มพลังให้ครบสายฮีล แทงก์ และซัพพอร์ต

Milestone: M4 · D-104 · Dependencies: TASK-077, TASK-031, TASK-040 (done)

## งานที่ต้องรอก่อนหน้า

- TASK-077, TASK-031, TASK-040 (done)

## ขอบเขตและรายละเอียด

ผู้ใช้ตอบคำถาม D-103 ชัดเจนว่าต้องการเพิ่มพลังในสัดส่วนใกล้เคียงกันทุกบทบาท ไม่ใช่เฉพาะดาเมจ ฮีล โล่ และบัฟความถึกต้องขยับด้วย การ์ดและอาวุธต้องใส่แล้วเห็นผลที่ตรวจได้

ใช้ factor1.75 เดิมจาก baselineก่อน077ครั้งเดียว เพิ่มในกลุ่มพลังฮีล/โล่/ชุบชีวิต/บัฟและpassive ATK/MATK/HP/DEF/คริ/หลบ/ฟื้นฟู รวมHealingPlantและCopiedHeal ไม่เพิ่มดาเมจ077ซ้ำ คงความเร็ว/CT/ACD/SI/SP/hardCC/โอกาสproc/ระยะเวลา/เรทและค่าด่านเดิม ไม่เพิ่มเพดานบัฟและไม่รันbalance simulationใหม่

การ์ด STR/INT/VIT/DEX เสริมderived%ด้วยอัตราแปลงเดียวกับstatและreferenceของ077 คงprimary/ภาพ/ชื่อ/ช่อง/ระดับ/quality/ต้นทุนเดิม อาวุธตรวจแยกcard: บิลด์เดียวกันถอด/ใส่อาวุธที่เหมาะกับเลเวลและอาชีพต้องเพิ่มATK/MATK/ฮีลตามสูตรจริง ไม่เพิ่มทุกค่าโดยไร้เกณฑ์

## ขั้นตอนและผลส่งมอบ

1. ขยายpolicyและgeneratorจากimmutablebaselineให้supportมีfactorร่วมกับdamage และidempotent
2. เติมlate-growthให้primarycardsพร้อมตรวจต้นทุน/ตัวตน/ข้อเสียเดิม และอาวุธทุกตระกูลที่Tier20/40/60
3. ตรวจผลจริงเฉพาะheal/shield/guard/HP/stack/summon/card/weaponด้วยfixedfixturesและstaticmath; regenerate378goldens/M0/build
4. ตรวจหน้าสกิล/การ์ด/อุปกรณ์บนmobileAuthทดสอบจริงแล้วpush/deploy/ตรวจpublicweb ห้ามแตะowner/6173/privateenv

## เกณฑ์ตรวจรับ

- [ ] AC-01: heal/HoT/shield/revive/HP/DEF/guardและsupportทุกอาชีพที่เข้าเกณฑ์scale1.75จากbaselineครั้งเดียว รวมcopies/summons; damage077ไม่เพิ่มซ้ำและมีbefore/after audit
- [ ] AC-02: engineให้Heal/เพลง/โล่/ลดdamage/HPและstackตามค่าที่คาดไว้จริง; SP/คิว/CC/เวลาเดิม การ์ดprimaryมีderived%ที่โตตามบิลด์ อาวุธทุกตระกูลให้ผลแยกจากการ์ดตามTier
- [ ] AC-03: focusedchecks/378goldens/M0/type/boundaries/build/secretsผ่าน ไม่มีownerwrite/SQL/env/newassets/เศรษฐกิจหรือด่านเปลี่ยน ไม่มีbalancebatchใหม่
- [ ] AC-04: actualmobile320/390แสดงHeal/Kyrie/Endure/HealingSong/CardINTตรงสูตรและไม่มีinspection save; actualdeployAPI/newdata/login/PWAผ่าน จึงย้ายdone

## Review

ยังไม่ตรวจ หลักฐาน `plan/evidence/task-078-*` แยกจาก077และ072 ค่าพลังเป็นtrialbaselineที่เลือกตามทิศทางผู้ใช้ ไม่ใช่ผลรับรองว่าทุกอาชีพมีDPSหรือEHPเท่ากัน
