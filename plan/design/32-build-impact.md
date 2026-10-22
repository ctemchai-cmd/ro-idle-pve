# น้ำหนักสกิล การ์ด และอุปกรณ์ — D-103

22 ต.ค.2026 ผู้ใช้ต้องการให้การเลือกสกิล/การ์ด/อุปกรณ์มีผลต่อไฟต์ชัดขึ้น ค่านี้เป็น trial baseline สำหรับเกมเรา ไม่ใช่สูตรRO PCหรือผลreverse-engineer Idle Adventure และไม่ใช่whole-gamebalanceproof

## แหล่งของพลัง

- Normal attack ยังคง100%ATK, intervalฐาน1.5s; skill intervalฐาน3s. CT/ACD/SP/การหักบอล/คิวไม่เปลี่ยน
- ผู้ใช้ขอscaleทุกอาชีพ/การ์ดไปทางเดียวกันและไม่เพิ่มด่านเดิมชดเชย: shared `power_multiplier=1.75` เป็นassistant trial factor เพิ่มdamageทุกท่า/Passive/DoT/counter/copy/summonและcarddamageprocจากbaselineเดียวกัน รักษาสัดส่วนระหว่างท่า/เลเวลเดิม (ก่อนfloor) ไม่เลือกบัฟบางคลาส ตามD-104 พลังฮีล/โล่/ชุบชีวิต/บัฟและPassive ATK/MATK/HP/DEF/guard/คริ/หลบ/ฟื้นฟูใช้factorเดียวกันจากbaselineเดิมครั้งเดียวด้วย; ความเร็ว/CC/โอกาสproc/ระยะเวลา/ต้านทานยังคงเดิม
- `skill_damage_bonus` และ `normal_damage_bonus` เป็นratio default0 เลือกตาม origin/sourceจริง แล้ว **บวกกับ outgoing physical/magical/true bucketเดิม** เช่น outgoing20% +skill15%+skill10% ได้1.45 ไม่ใช่1.2×1.15×1.1. ไม่เพิ่มเพดานบัฟ/สแต็กหรือสูตรเกราะใหม่
- Normalbonusใช้เฉพาะ normal hit; skillbonusใช้โปรแกรมจาก skill definition จริง รวมPassive/DoT/summon. Procจากcard/itemไม่รับskillbonusเพิ่มอีกชั้น และ heal/shield/CCไม่ใช้ทั้งสองค่า. Summonเก็บoffenseโบนัสจากเจ้าของตอนเรียกหนึ่งครั้งและคืนattributionให้เจ้าของ

## อุปกรณ์และการ์ด

ฐานอาวุธ/เกราะ/Tier/Rarity/Refineเดิมยังมีความหมาย เพิ่มrole modifierตามชนิด: สายskill/normal/heal/sustain/tank โดยมาตรฐานและแบบ_bมี trade-offค่าสถานะเดิม. Rarityคูณbase flat/bonusของitemเท่านั้น; options/card/refineเป็นsourceอิสระ ไม่คูณทั้งหมดตามrarityอาวุธ

Optionsเพิ่มสองสายดาเมจใหม่โดยคงlinecount/rollscale/unique-stat/oldIDs. ของเดิมไม่สุ่มใหม่; optionsเดิมรักษาroll. การ์ด66ใบยังยึดชื่อ/ภาพ/ช่อง/จุดเด่นRO และบอกส่วนที่ดัดแปลง flat ATK/MATK/HP/SP/DEFทุกใบคงflatเดิมและเพิ่มderived%ด้วยสูตรเดียวกัน `flat/reference×1.75` (reference100/100/1000/100/100/100ตามลำดับ); damage procทุกใบใช้factor1.75เดียวกับสกิล; การ์ดที่กันธาตุ/CC/ASPDมีผลมากอยู่แล้วคงค่า ไม่เพิ่มresistanceทุกใบจนทุกbuildกันทุกอย่าง

## การตรวจและขอบเขตหลักฐาน

Static budgetรายสกิลเทียบrawpower/ช่วงใช้/จำนวนhit/เป้า โดยไม่เอาATKไปเทียบMATKราวเป็นstatเดียวและไม่อ้างว่าrawรวมคือDPSจริง. Focused fixturesตรวจengineเฉพาะผล/สแต็ก/การขัด/ค่าdefault; ไม่มีseed batch, journey หรือ calibration ใหม่. Actualbrowserใช้บัญชีทิ้งในloopback ไม่ใช้เซฟผู้ใช้

การอัปเดตมีcontenthashใหม่ จบไฟต์/reloadแล้วใช้ปุ่มสำรองและย้ายรุ่นเดิม Wallet/paidresources/gear/cardinstances/rolls/farmและpendingclaimsคงเดิม ไม่มีSQL/envใหม่. การสอบเทียบwhole-gameของTASK041ต้องทำภายหลังเมื่อได้รับอนุญาตใหม่

Detonateแปลงflatต่อชั้นเป็นATKratioด้วยreferenceATK100และfactorเดียวกัน (Lv1=105%ATK/ชั้น, max210%ATK/ชั้น) เพื่อโตตามบิลด์ ไม่คงflatซ้ำ; HellPlantใช้power_scale1.75ครั้งเดียวบนoffense ATK/MATKไม่คูณHP/CC/bonuses ค่าพลังsummonก่อนfloorรักษาสัดส่วนเดิม HealingPlantใช้power_scale1.75เช่นกันตามD-104 โดยโบนัสฮีลของownerสืบทอดsnapshotครั้งเดียว

ค่าด่าน/บอส/เศรษฐกิจ/เรทรางวัลเดิมทุกแถวคงไว้ ความง่ายหลังเพิ่มพลังเป็นสิ่งที่ผู้ใช้ยอมรับ ความยากเนื้อหาภายหลังออกแบบแยกได้ ไม่จำเป็นต้องรันsimulationรอบใหม่เพื่อดันด่านเดิมกลับมายากเท่าเดิม

## D-104 — ครบทุกบทบาทหลังผู้ใช้ตอบคำถาม

คำตอบล่าสุดชี้ว่าต้องเพิ่มฮีลและความถึกด้วย จึงแทนข้อยกเว้นของ077ที่คงheal/supportเดิม: ใช้factor1.75จากbaselineก่อน077ครั้งเดียวกับ59supportprograms รวมdirectheal/HoT/shield/revive/HP/DEF/guard/ATK/MATK/คริ/หลบ/SPregen และHealingPlant ค่าดาเมจ077ไม่เพิ่มซ้ำ. ทุกcast/expiry/tick/โอกาสproc/ความเร็ว/CCเดิม ไม่มีเพดานใหม่

อัตราที่เท่ากันหมายถึงค่าพลังที่นิยาม ไม่ใช่รับรองDPS/EHPเท่ากัน เพราะเกราะ/คริ/overheal/สถานการณ์ยังมีผล. PrimarycardsยังคงSTR/INT/VIT/DEXเดิมและเสริมderived%ตามconversionตรง: STR2ATK, INT3MATK+4SP, VIT20HP, DEX1ATK ต่อแต้ม แล้วใช้referenceและfactorของ077. AGI/LUKยังมีประโยชน์ตลอดจากspeed/critเดิม ไม่เพิ่มspeedหรือCCresistanceทุกใบจนวนคิวเปลี่ยน
