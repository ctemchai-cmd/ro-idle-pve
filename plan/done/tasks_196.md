# TASK-196 — Refine Target, Upgrade Max และหน้ากิจกรรม

Milestone: M4 · D218

## งานที่ต้องรอก่อนหน้า
TASK-195 (done)

## ขอบเขต
[design99](../design/99-batch-upgrades-and-events-ui.md)

## ขั้นตอน
1. เพิ่มคำสั่งตีบวกจนถึงเป้าหมายในรายการเดียว พร้อมผลสรุปที่ replay ได้
2. คำนวณ Skill Max จากเพดานและราคาจริง รวม Awaken
3. ตรวจไอคอนทรัพยากร/เติมรายการที่ขาด/แยกภาพซ้ำ
4. ปรับ Event มือถือ ทดสอบคำสั่ง/UI/build/clean committed archive และเว็บจริง

## เกณฑ์ตรวจรับ
- [x] AC-01: Refine Target ราคา/โอกาส/pity เดิม หยุดเมื่อถึงเป้าหมายหรือเงินไม่พอ หนึ่ง receipt/revision ไม่จ่ายซ้ำ
- [x] AC-02: Skill Max ไม่เกิน cap/เงิน/Awaken phase และคืนทุนจาก ledger จริง
- [x] AC-03: ทรัพยากร15ชนิดมีภาพไม่ซ้ำ และ Event mobile320/390ไม่ล้น/รักษาสิทธิ์เดิม
- [x] AC-04: focused/native/strict/M0/build/clean committed archive/public ผ่าน

ผลตรวจ: [review](../evidence/task-196-review.json) · Vercel `f8e9f2fec` SUCCESS / public5groups.
