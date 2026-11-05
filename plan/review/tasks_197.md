# TASK-197 — เพิ่มหินเลื่อน Rarity สำหรับทั้งทีม

Milestone: M4 · D219

## งานที่ต้องรอก่อนหน้า
TASK-196 (done)

## ขอบเขต
[design100](../design/100-rarity-stone-supply.md)

## ขั้นตอน
1. เทียบต้นทุน24ชิ้นกับหินจากAFK/ร้าน/Eventแล้วเพิ่มอัตรา
2. ตรวจเซฟเก่า/frozenwindow/counters/receipt replay โดยคงราคาอัปเกรด
3. ตรวจsharedquotes/UI/build/cleancommittedarchiveและเว็บจริง

## เกณฑ์ตรวจรับ
- [x] AC-01: AFKเฉลี่ย8/12/16/20/24ต่อ12hครบ15บท คงRNGและผลดรอปอื่น
- [x] AC-02: ร้าน40ต่อวัน/Event100ต่อรอบ โดยคงสิทธิ์เดิมและไม่รับซ้ำ
- [x] AC-03: frozenAFK/pending/stock/ราคาตีRarityเดิมไม่เปลี่ยนย้อนหลัง
- [ ] AC-04: focused/native/M0/strict/build/cleanGit/publicผ่าน

Local focused41/native6groups320390/M0/strict/root passed. Clean committed build + hosted verification pending.
