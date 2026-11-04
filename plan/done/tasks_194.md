# TASK-194 — ธาตุเกราะบอสตาม Origin และเพิ่มพลังโจมตี

Milestone: M4 · D216

## งานที่ต้องรอก่อนหน้า
TASK-193 (done)

## ขอบเขต
[design97](../design/97-boss-origin-elements.md)

## ขั้นตอน
1. ตรวจแหล่ง Origin และแยกค่าที่ยืนยันไม่ได้ตามคำตอบผู้ใช้
2. ใช้โปรไฟล์กลางทุกโหมด เพิ่ม P.ATK/M.ATK15% โดยคงHP
3. ตรวจธาตุจริง/ตัวเลข/ดันเฟสใหม่/เซฟ/หน้าจอและbuild
4. ตรวจclean committed archive แล้วเผยแพร่และตรวจเว็บจริง

## เกณฑ์ตรวจรับ
- [x] AC-01: ครบ61identity มีแหล่งอ้างอิงหรือระบุ retained ชัดเจน
- [x] AC-02: ทุกโหมดเพิ่มพลังโจมตี15%ครั้งเดียว HP/รางวัล/คิวเดิม
- [x] AC-03: ธาตุเกราะจริงตรงUIและการ์ด; phase/reload/speedตรงกัน
- [x] AC-04: frozen content/backup/สิทธิ์และรางวัลเดิมปลอดภัย
- [x] AC-05: strict/tests/native/root/cleanGit/publicผ่าน

ผลตรวจ: [review](../evidence/task-194-review.json) · Vercel source`228ba2f3d` verified.
