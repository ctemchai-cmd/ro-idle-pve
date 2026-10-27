# TASK-169 — หินรีโรล/Rarity จากฟาร์มด่าน

Milestone:M4 · D193 · [design82](../design/82-farm-crafting-stones.md)

## งานที่ต้องรอก่อนหน้า
TASK-164, TASK-165 (done).

## ขอบเขต
เพิ่มสองหินจากAFKStoryทุกบท;ร้าน/ราคา/ค่าใช้หิน/เรทอุปกรณ์-การ์ดคงเดิม. ไม่เพิ่มEventหรือSQL.

## รายละเอียด
เฉลี่ย12hบท1–3รีโรล4/Rarity1;4–6=6/2;7–9=7/2.5;10–12=8/3. สุ่มแยกต่อ5นาทีด้วยcrafting_rngที่เซฟไว้ ไม่ใช้loot_rngเดิม. Frozenprofile/pendingpayloadoptional;ช่วงค้างเก่าไม่ย้อนหลัง. รับรวมหนึ่งคำสั่งและสต็อกไม่กินช่องกระเป๋า. ปิดเกม/แบ่งรับ/12hcap/UUIDreplayต้องตรงเดิม. UIแสดงอัตราเฉลี่ยและจำนวนที่รอรับ/รับแล้วด้วยไอคอนจริง.

## ขั้นตอน
1. เก็บbaselineและออกแบบprofile/claim/RNG
2. sharedreserve/claim/UIและschemaoptional
3. unit/native/full/build/hostedและบันทึกหลักฐาน

## เกณฑ์ตรวจรับ
- [x] AC-01: อัตรา12บท/เศรษฐกิจเดิม/gear-card RNGไม่เปลี่ยน/optional schema rejectข้อมูลผิด
- [x] AC-02: แบ่งรับ=รับรวม/12hcap/frozenเก่า/ย้ายด่าน/overflow/atomicclaim/duplicate UUID
- [x] AC-03: native320390/ไอคอน-อัตรา-จำนวนจริง/fullTS/root-filtered/M0/hosted

## Blocker / คำถาม
ไม่มี ใช้baselineตามdesign82.

## ผลตรวจรับ
Source188ab28ef/VercelSUCCESS;772TS/native5/root-filtered/M0/public4groupsผ่าน. [ผลตรวจ](../evidence/task-169-review.json).
