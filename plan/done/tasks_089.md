# TASK-089 — เพิ่มรายได้ทองให้ใช้วัสดุอัปเกรดได้

Milestone: M4 · D-118

## งานที่ต้องรอก่อนหน้า

- TASK-010, TASK-036, TASK-038, TASK-040, TASK-083 (done)

## เป้าหมายและขอบเขต

ผู้ใช้รายงานหินตีบวกล้นแต่ทองหมด จึงเพิ่มทองจากฟาร์ม/AFKและTreasury×3 ข้อมูลบท3เดิมทอง7238/หิน34ต่อชั่วโมง≈213ทองต่อหิน ขณะที่Refine+7ถึง+10ใช้280–400ทองต่อหินและทองยังใช้เลเวล/สกิล/Enchantร่วมกัน อัตราใหม่21714/34≈639เผื่อหลายระบบพร้อมกัน ไม่ปรับEXP/วัสดุให้เร่งทุกระบบ

ราคา/โอกาสตีบวก/pity/ของเก่า/paidledgerเดิม Goldquest/Storyfirstclear/Tower/salvage/ร้านค้าไม่บัฟตามเพื่อไม่เพิ่มloopหรือเงินย้อนหลัง Treasurybase1000→3000แล้วใช้phaseformulaเดิม Pendingchestเก่าเป็นจำนวนคงที่ ไม่คูณอีก ฟาร์มเก็บunpaidfrozenprofileเดิมจนclaimแรก จากนั้นsnapshotปัจจุบันตามflowที่มีอยู่แล้ว ไม่ต้องSQLใหม่

## ขั้นตอนการทำ

1. บันทึกbefore/after8บทพร้อมgold/oreและต้นทุนRefineแต่ละขั้น
2. เพิ่มpost-generatorgoldmultiplier3และTreasurybase3000 โดยคงฐานพลัง/วัสดุ/XPและbudgetwindowเดิม
3. ตรวจsource-diff/carry/cap/frozenoldclaim→newrate/replay/migration/oldpending
4. M0/build/actualdisposableAuth/API/SQL/mobile/publicproofก่อนreviewdone

## ผลส่งมอบ

- Goldincomeข้อมูลและgeneratorที่reproduceได้
- แผนอัตราส่วน/กติกาfrozenพร้อมrule/mobile/hosted evidence

## เกณฑ์ตรวจรับ

- [x] AC-01: ทองฟาร์มทั้ง8บทและTreasurychestเพิ่ม3เท่าจากbaselineก่อนpatchจริง Generatorreproduceได้ รายได้EXP/manual/หิน/essence/dust/lootและราคาตีบวก/Enchant/level/skill/โอกาส/pityเดิม ไม่มีบัฟทองจากsalvageเพื่อสร้างarbitrage
- [x] AC-02: wallet/pendingreward/paidledger/จำนวนของ/ชั้น/สิทธิ์รายวันเก่าไม่ถูกคูณหรือรีเซ็ต ช่วงAFKที่frozenเก่าจ่ายตามrateเดิมครั้งเดียวแล้วติดตั้งrateใหม่3เท่าให้เวลาถัดไป Claimreplayไม่จ่ายซ้ำ12hcap/carry/RNGเดิม
- [x] AC-03: มีsourcebeforeafterและอัตราทองต่อหินเทียบต้นทุนอย่างชัดเจน ตัวเลขเป็นbaselineทดลองไม่อ้างbalanceครบ; generator/M0/focusedfarm/daily/save/migration/buildและactualdisposableUI/API/SQL/publicproofผ่าน ไม่มีownerwrite/SQL/env/assets/balancebatch

## วิธีตรวจและหลักฐาน

Generator--check/M0 + existingfarm/daily/migration/replay tests และrealdisposableoldrateclaim→newrate/mobileUI เก็บtask089-* หรือshared086089 ไม่runbalancebatch

ผล review: ผ่าน 3/3 AC · 22 ต.ค.2026 · source `069b09acb6e63ed8f672fe16df1ab116c78acc6a` ขึ้น Vercel แล้ว · [หลักฐาน](../evidence/task-089-review.json)
