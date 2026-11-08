# TASK-200 — ออฟซ้ำหลายแถวและชุดออฟแยกตามส่วนอุปกรณ์

Milestone: M4 · D223

## งานที่ต้องรอก่อนหน้า
TASK-199 (done)

## ผลส่งมอบและขั้นตอน
[Design103](../design/103-slot-option-pools.md): เพิ่ม pool6ส่วนในข้อมูลและตัวตรวจ; ใช้ร่วมสุ่ม/รีโรล/อัปRarity/ดรอป/กาชา/แลกEvent; ออฟซ้ำรวมผลจริง; UIตรงโอกาส; เก็บของเดิมและผลที่จ่ายแล้ว; ตรวจและเผยแพร่

## เกณฑ์ตรวจรับ
- [x] AC01: อาวุธ5แถวM.ATKได้และรวมผลทั้งหมด; ส่วนอื่นใช้poolของตัวเองทุกTier
- [x] AC02: ค่าช่วง/น้ำหนัก/จำนวนแถว/ราคา/2drawsต่อแถวเดิม; ทุกช่องทางใช้poolเดียว
- [x] AC03: รีตามเป้าหมายซ้ำได้ทั้งแถวอื่นและแถวเดิมโดยจ่ายอย่างน้อย1ครั้ง; RNGตรงสุ่มทีละครั้ง
- [x] AC04: เซฟเก่า/ออฟนอกpool/ผลรอเลือกคงอยู่; stale/lock/pending/ทุนไม่พอ/invalidไม่จ่าย; retryหักครั้งเดียว
- [x] AC05: UI320/390แสดงpool/โอกาส/ช่วงตามชิ้นและแถวที่เลือก พร้อมยืนยัน/สรุป
- [ ] AC06: full tests/M0/strict/root/clean committed/publicผ่าน; ไม่แตะเซฟowner/6173

วิธีตรวจ: tests/game/slot-option-pools.test.ts + regressions, native Chrome fixtures and anonymous hosted checks. หลักฐาน plan/evidence/task-200. Local review:932distinctTS/native9/M0/strict/rootผ่าน; clean committed/publicรอเผยแพร่.
