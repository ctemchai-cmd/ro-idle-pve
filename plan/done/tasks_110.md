# TASK-110 — ภาพ Paladin และผ่อนความยากหลังลองเล่น

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · D-142/design38

## งานที่ต้องรอก่อนหน้า
TASK-108, TASK-109 (done)

## ขอบเขตและผลส่งมอบ
ใช้ภาพสกิลCrusaderจากpaladinตามsuggestion-migrate.txtทั้ง7สกิล. ลดอัตราโตสะสมStoryและลดTowerATKหลังผู้ใช้รายงานยากเกิน. ไม่แก้Refine/การ์ด/อาชีพ/รางวัล/CC/ความเร็ว/เซฟเจ้าของ/SQL/env/6173. ไม่รันbalancebatchใหม่.

## รายละเอียด
D142แก้D140profile:บท3–5ต่อ5ด่านHP+8%/ATK+4%;บท6+20%/+8%;บท7–8+12%/+6%. TowerATKceil((220+44f+11f²)/20) ~10%เหนือก่อนTASK109. HolyCrossใช้paladin27/GrandCrossใช้paladin12ตามคำตอบแก้ล่าสุด. ไม่เปลี่ยนIDหรือผลสกิล.

## ขั้นตอน
1. เก็บbeforedata/checksumsและอ่านdiffของผู้ใช้;เปิดดูเฉพาะ7ภาพใหม่
2. แก้mapping/import/cachemetadataพร้อมmanualreviewและrebuildruntimepack
3. Authorprofileจากimmutablecalibration/regenerateตรวจค่าลดลงและคงstepทุก5ด่าน
4. ตรวจtargeted/sharedengine/control/migration/assets/M0/build/mobile/public ก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: Crusader7logicalIDsใช้paladin27/29/48/12/19/33/34ตามไฟล์;source/export/runtimeSHAตรง;metadataใหม่ถูกต้อง/แสดงจริง320/390;สกิล126/cost/timing/effectsเดิม
- [x] AC-02: Storyบท3+ทุกด่านHP/P.ATKไม่ลดจากก่อนหน้าและไม่สูงกว่าTASK109;6-5/10/15HP71992/86392/103674,ATK2299/2485/2687;Tower21HP24750/ATK300,101ATK5844;บท1–2/รางวัล/สกิล/CC/timing/Refine15/ช่อง0@0,1@5,2@10,3@15เดิม;1x/2x/4xยังตรง
- [x] AC-03: importer/native/prepared/runtimechecks/M0/readiness/build/targetedผ่าน;actualfreshAuth-API-SQL-mobile320/390เห็น7iconsและStory/Towercheckpointค่าจริง;publicVercelnewcontent/newpack/iconSHA/login0writesผ่านก่อนdone

## วิธีตรวจและหลักฐาน
TASK110 fixed arithmetic/stat fixtures และactualdisposablelocalstack;ไม่balancebatchหรือownercloud. Evidence task-110-*.

## Blocker / คำถาม
ไม่มี;อัตราลดเป็นassistantstartingprofileจากfeedback ไม่อ้างวัดอัตราชนะของทีมผู้ใช้.

Localpassed36TS/38Python/M0/readiness8/build/assets271-60460-6926/actualAuthAPI-SQL-Chrome2groups320/390. GrandCrossล่าสุด12ผ่านทั้ง2ขนาด;before-grand12historyเก็บภาพก่อนผู้ใช้แก้คำสั่ง ไม่ใช่ผลfinal. PublicVercel3groupspassed.

Review23ต.ค.2026:3/3ACผ่าน source`3d0ec1ce955a3b4f9a8e24f4bcb15022a0beaf86` VercelSUCCESS/publicAPI200SIN1/contentbc84/newpack1ea/7iconSHA/4bundleSHA/login0writes. [review](../evidence/task-110-review.json). GrandCross12ตามคำแก้ล่าสุด. ไม่มีownerwriteหรือbalancebatch.
